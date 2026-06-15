"""LLM adjudication client for the issue engine — OpenAI-compatible.

Decision: external API only (local self-hosting ruled out — no GPU on 185).
Default backend is "none": pure heuristics, ZERO egress. When backend is "api"
the client calls an OpenAI-compatible chat-completions endpoint (configured for
a cheap domestic model, e.g. GLM) ONLY for the ambiguous residue the heuristics
flag — never the whole conversation.

Fail-safe contract: any error, timeout, missing config, or exhausted daily
budget returns a verdict of "uncertain" so the caller routes the issue to a
human. The engine must NEVER let an LLM failure produce a false closure.
"""
from __future__ import annotations

import datetime as dt
import logging
import threading

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


def _uncertain(reason: str, **extra) -> dict:
    out = {"verdict": "uncertain", "reason": reason, "model": config.LLM_MODEL,
           "prompt_tokens": 0, "completion_tokens": 0}
    out.update(extra)
    return out


def judge_closure(transcript: str, question: str) -> dict:
    """Ask the model whether a problem looks closed. Returns a dict with at
    least {verdict in likely_closed|likely_open|uncertain, model, *_tokens}.

    `transcript` should already be trimmed by the caller to the minimal window
    needed for the judgment (egress minimization).
    """
    if not enabled():
        return _uncertain("llm_disabled")
    if not _budget_ok():
        return _uncertain("daily_budget_exhausted")

    system = (
        "You are a customer-support QA assistant. Decide whether the customer's "
        "problem in the transcript has been RESOLVED to the customer's "
        "satisfaction. Be conservative: if the customer never confirmed, or there "
        "is an open question, or only silence, treat it as NOT resolved. "
        "Reply with a single word: CLOSED, OPEN, or UNCERTAIN."
    )
    user = f"{question}\n\n--- transcript ---\n{transcript}\n--- end ---"

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
                # tiny cap would truncate the verdict. Keep it small but enough
                # for reasoning + a one-word answer.
                "max_tokens": 512,
            },
            timeout=config.LLM_TIMEOUT_SECONDS,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:  # network, timeout, http error, bad json
        log.warning("LLM call failed, treating as uncertain: %s", exc)
        return _uncertain(f"llm_error:{type(exc).__name__}")

    try:
        text = (data["choices"][0]["message"]["content"] or "").strip().upper()
    except (KeyError, IndexError, TypeError):
        return _uncertain("llm_bad_response")

    usage = data.get("usage") or {}
    pt = int(usage.get("prompt_tokens", 0) or 0)
    ct = int(usage.get("completion_tokens", 0) or 0)
    # Crude cost estimate; exact pricing is provider-specific and logged raw.
    _record_spend((pt + ct) / 1000.0 * 0.001)

    # Robust parse: take the LAST verdict keyword in the text, so any reasoning
    # preamble that leaked into content doesn't shadow the final answer.
    upper = text.upper()
    pos_closed, pos_open = upper.rfind("CLOSED"), upper.rfind("OPEN")
    if pos_closed == -1 and pos_open == -1:
        verdict = "uncertain"
    elif pos_closed > pos_open:
        verdict = "likely_closed"
    else:
        verdict = "likely_open"

    return {
        "verdict": verdict,
        "reason": "llm_ok",
        "raw": text,
        "model": config.LLM_MODEL,
        "prompt_tokens": pt,
        "completion_tokens": ct,
    }
