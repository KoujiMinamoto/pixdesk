"""LLM adjudication client for the issue engine — OpenAI-compatible.

Decision: external API only (local self-hosting ruled out — no GPU on 185).
Default backend is "none": pure heuristics, ZERO egress. When backend is "api"
the client calls an OpenAI-compatible chat-completions endpoint (configured for
a cheap domestic model, e.g. GLM) ONLY for the ambiguous residue the heuristics
flag — never the whole conversation.

Three judgments live here:
  * judge_is_problem(): is this customer turn raising a real problem at all?
    The biggest noise source post-backfill is conversational filler being
    mis-segmented as an "issue" and then auto-flagged unanswered. This filter
    drops those.
  * judge_closure(): does this transcript look resolved? Used as the AFFIRM
    side of closure when heuristics already say closed_inferred.
  * judge_closure_challenge(): adversarial counterpart to judge_closure —
    asks the model to argue the OPEN side. A heuristic closure stands only
    if affirm says closed AND challenge fails to find an open issue.

Fail-safe contract: any error, timeout, missing config, or exhausted daily
budget returns a verdict of "uncertain" so the caller routes the issue to a
human. The engine must NEVER let an LLM failure produce a false closure.
"""
from __future__ import annotations

import datetime as dt
import logging
import threading
from typing import Optional

import httpx

import config

log = logging.getLogger("issue-engine.llm")

# Rough price guard only. Real cost is logged per-call into issue_signals from
# the returned token usage; this is just the daily-budget accumulator.
_spent_cny = 0.0
_spent_day = dt.date.min
_lock = threading.Lock()


def enabled() -> bool:
    return (
        config.LLM_BACKEND == "api"
        and bool(config.LLM_BASE_URL)
        and bool(config.LLM_API_KEY)
        and bool(config.LLM_MODEL)
    )


def _budget_ok() -> bool:
    """True if we may spend. Resets the accumulator at each new UTC day."""
    global _spent_cny, _spent_day
    if config.LLM_DAILY_BUDGET_CNY <= 0:
        return True  # 0/unset => no ceiling
    today = dt.datetime.now(dt.timezone.utc).date()
    with _lock:
        if today != _spent_day:
            _spent_day = today
            _spent_cny = 0.0
        return _spent_cny < config.LLM_DAILY_BUDGET_CNY


def _record_spend(cny: float) -> None:
    global _spent_cny
    with _lock:
        _spent_cny += max(0.0, cny)


def _uncertain(reason: str) -> dict:
    return {"verdict": "uncertain", "reason": reason, "raw": "",
            "model": config.LLM_MODEL, "prompt_tokens": 0, "completion_tokens": 0}


def _ask(system: str, user: str, *, max_tokens: int = 256,
         timeout: Optional[float] = None) -> dict:
    """One chat-completion. Returns {raw, model, prompt_tokens, completion_tokens}
    on success; {verdict:"uncertain", reason, ...} on any failure path.

    timeout overrides config.LLM_TIMEOUT_SECONDS when set — distill calls send
    much more input than the small judge calls and need longer.
    """
    if not enabled():
        return _uncertain("llm_disabled")
    if not _budget_ok():
        return _uncertain("daily_budget_exhausted")
    try:
        resp = httpx.post(
            f"{config.LLM_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {config.LLM_API_KEY}"},
            json={
                "model": config.LLM_MODEL,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "temperature": 0,
                # GLM-5.1 emits reasoning tokens before the final answer, so a
                # tiny cap truncates the verdict. Keep it just big enough for
                # short reasoning + a one-word answer; this is the dominant
                # latency knob.
                "max_tokens": max_tokens,
            },
            timeout=timeout if timeout is not None else config.LLM_TIMEOUT_SECONDS,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        log.warning("LLM call failed, treating as uncertain: %s", exc)
        return _uncertain(f"llm_error:{type(exc).__name__}")

    try:
        msg = data["choices"][0]["message"]
        content = (msg.get("content") or "").strip()
        # GLM-5.1 puts thinking in `reasoning_content` and the final answer in
        # `content`. When max_tokens is too small, reasoning eats the budget
        # and content comes back empty; falling back to reasoning_content lets
        # the regex parser still extract the JSON the model managed to write.
        if not content:
            content = (msg.get("reasoning_content") or "").strip()
        raw = content
    except (KeyError, IndexError, TypeError):
        return _uncertain("llm_bad_response")

    usage = data.get("usage") or {}
    pt = int(usage.get("prompt_tokens", 0) or 0)
    ct = int(usage.get("completion_tokens", 0) or 0)
    # Crude cost estimate. Provider-specific pricing is logged from raw tokens
    # in issue_signals; this is just for the daily budget guard.
    _record_spend((pt + ct) / 1000.0 * 0.001)

    return {"raw": raw, "model": config.LLM_MODEL,
            "prompt_tokens": pt, "completion_tokens": ct}


def _last_keyword(text: str, *keywords: str) -> Optional[str]:
    """Return the keyword that appears LAST in `text` (case-insensitive), or
    None. We take the last hit so a reasoning preamble can't shadow the final
    answer (GLM-5.1 sometimes leaks reasoning into content)."""
    upper = text.upper()
    best, best_pos = None, -1
    for kw in keywords:
        pos = upper.rfind(kw.upper())
        if pos > best_pos:
            best, best_pos = kw, pos
    return best


def judge_is_problem(transcript: str) -> dict:
    """Is the customer's first turn raising a real support problem (vs greeting,
    acknowledgement, social chatter)? Returns verdict in {real_problem, not_a_problem, uncertain}.

    Used to filter the noise that segmentation produces — short conversational
    turns that look like "issues" but aren't actually a problem to track.
    """
    system = (
        "You are a customer-support triage filter. Read the first customer "
        "turn(s) of a conversation segment and decide whether the customer is "
        "raising a SUPPORT PROBLEM that warrants tracking — i.e. asking for "
        "help, reporting a bug, complaining about something not working, or "
        "requesting a change. Greetings, thanks, social chit-chat, polite "
        "acknowledgements, or short factual replies (e.g. providing an email "
        "after being asked) are NOT problems. End your reply with a single "
        "word on its own line: PROBLEM, NOT_PROBLEM, or UNCERTAIN."
    )
    user = f"--- conversation excerpt ---\n{transcript}\n--- end ---"
    out = _ask(system, user)
    if out.get("verdict") == "uncertain":  # error path
        return out
    kw = _last_keyword(out["raw"], "NOT_PROBLEM", "PROBLEM", "UNCERTAIN")
    if kw == "PROBLEM":
        verdict = "real_problem"
    elif kw == "NOT_PROBLEM":
        verdict = "not_a_problem"
    else:
        verdict = "uncertain"
    return {**out, "verdict": verdict, "reason": "llm_ok"}


def judge_closure(transcript: str, question: str) -> dict:
    """AFFIRM side: does this transcript look resolved? Verdict in
    {likely_closed, likely_open, uncertain}."""
    system = (
        "You are a customer-support QA assistant. Decide whether the customer's "
        "problem in the transcript has been RESOLVED to the customer's "
        "satisfaction. Be conservative: if the customer never confirmed, or "
        "there is an open question, or only silence, treat it as NOT resolved. "
        "End your reply with a single word: CLOSED, OPEN, or UNCERTAIN."
    )
    user = f"{question}\n\n--- transcript ---\n{transcript}\n--- end ---"
    out = _ask(system, user)
    if out.get("verdict") == "uncertain":
        return out
    kw = _last_keyword(out["raw"], "CLOSED", "OPEN", "UNCERTAIN")
    if kw == "CLOSED":
        verdict = "likely_closed"
    elif kw == "OPEN":
        verdict = "likely_open"
    else:
        verdict = "uncertain"
    return {**out, "verdict": verdict, "reason": "llm_ok"}


def judge_closure_challenge(transcript: str) -> dict:
    """CHALLENGE side: adversarial counterpart to judge_closure. Asked to find
    any reason the problem is STILL OPEN. If it finds one, verdict=likely_open,
    which vetoes a heuristic closure. Verdict set: {likely_open, likely_closed,
    uncertain}."""
    system = (
        "You are a customer-support QA reviewer playing devil's advocate. Look "
        "for ANY evidence that the customer's problem is still open: an "
        "unanswered question, an unresolved follow-up, dissatisfaction, a "
        "request that was never fulfilled, or a complaint that came back. "
        "Bias toward finding problems open. End your reply with a single "
        "word: OPEN, CLOSED, or UNCERTAIN."
    )
    user = f"--- transcript ---\n{transcript}\n--- end ---"
    out = _ask(system, user)
    if out.get("verdict") == "uncertain":
        return out
    kw = _last_keyword(out["raw"], "OPEN", "CLOSED", "UNCERTAIN")
    if kw == "OPEN":
        verdict = "likely_open"
    elif kw == "CLOSED":
        verdict = "likely_closed"
    else:
        verdict = "uncertain"
    return {**out, "verdict": verdict, "reason": "llm_ok"}


def judge_same_problem(transcript_a: str, transcript_b: str) -> dict:
    """Are these two conversation segments tracking the SAME underlying
    customer problem (or are they two distinct problems that happened to share
    a channel)? Used to fix over-segmentation: heuristic time-gap + thread
    rules cut a single in-progress problem into many "issues" because support
    follow-ups span days. We re-merge them after the fact.

    Verdict in {same_problem, different, uncertain}. Bias: DIFFERENT unless
    there's a clear shared root (same request, same bug, same actor following
    up). False merges are worse than false splits — they hide unrelated work.
    """
    system = (
        "You compare two excerpts from a customer-support chat to decide if "
        "they are tracking the SAME underlying problem (same request, same "
        "bug, same follow-up thread between the same parties), or are TWO "
        "DIFFERENT problems that happen to share a channel. Bias toward "
        "DIFFERENT unless there's a clear shared root: the same request "
        "being followed up, an open thread continuing, the customer asking "
        "again about the same incident. Pure social chatter or unrelated "
        "topics are DIFFERENT. End your reply with a single word: SAME, "
        "DIFFERENT, or UNCERTAIN."
    )
    user = (
        f"--- segment A ---\n{transcript_a}\n"
        f"--- segment B ---\n{transcript_b}\n"
        "--- end ---"
    )
    out = _ask(system, user)
    if out.get("verdict") == "uncertain":
        return out
    kw = _last_keyword(out["raw"], "DIFFERENT", "SAME", "UNCERTAIN")
    if kw == "SAME":
        verdict = "same_problem"
    elif kw == "DIFFERENT":
        verdict = "different"
    else:
        verdict = "uncertain"
    return {**out, "verdict": verdict, "reason": "llm_ok"}
