"""Core detection logic for the issue engine.

Reads agent.messages (+ agent.replies for staff turns), segments each
conversation's history into distinct customer problems, derives a lifecycle
state per problem, and flags non-closure with deterministic rules. Writes only
issue.*. Uses its OWN psycopg2 connection (never ticket-api's).

The whole detection floor is heuristic and runs with zero LLM/egress. The LLM
(if enabled) is consulted only for the ambiguous residue.

Design invariants:
  * NEVER write agent.* or ticket.* — read-only upstream.
  * Silence NEVER closes a problem. Only an explicit customer thanks can lead to
    an auto-confirmed closure.
  * Re-scan is idempotent: issues are keyed by (conversation_id, segment_key)
    and upserted, so reprocessing a window extends the in-flight issue.
"""
from __future__ import annotations

import datetime as dt
import json
import logging
from typing import Any, Optional

import psycopg2
import psycopg2.extras

import config
from config import SCHEMA
import markers
import llm

log = logging.getLogger("issue-engine.detector")

UTC = dt.timezone.utc

# Lifecycle transition graph. The detector RE-DERIVES a segment's state from its
# full history every tick, so the derived state is always authoritative for the
# evidence seen — transitions among the "live" (non-terminal) states are all
# legitimate as the conversation grows. The graph's real job is to protect the
# human/terminal states: an issue a person has confirmed/closed/dismissed must
# not be silently re-opened by the heuristic (that guard runs in upsert_issue
# BEFORE this check; closed_confirmed -> reopened is the one allowed exit, taken
# only when a reopen marker fires). validate_transition is defense-in-depth.
_LIVE = {"detected", "active", "awaiting_agent", "awaiting_customer",
         "resolution_proposed", "closed_inferred", "reopened"}
TRANSITIONS: dict[str, set[str]] = {
    # every live state may move to any other live state or be dismissed
    **{s: (_LIVE - {s}) | {"dismissed"} for s in _LIVE},
    # closed_inferred may also be confirmed (grace/human)
    "closed_inferred": (_LIVE - {"closed_inferred"}) | {"dismissed", "closed_confirmed"},
    # terminal human states
    "closed_confirmed": {"reopened"},
    "dismissed": set(),
}


def validate_transition(old: str, new: str) -> bool:
    if old == new:
        return True
    return new in TRANSITIONS.get(old, set())


# ---------------------------------------------------------------------------
# DB connection
# ---------------------------------------------------------------------------

def connect() -> psycopg2.extensions.connection:
    conn = psycopg2.connect(config.DATABASE_URL)
    conn.autocommit = False
    return conn


def dict_cur(conn) -> psycopg2.extras.RealDictCursor:
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)


# ---------------------------------------------------------------------------
# Role inference
# ---------------------------------------------------------------------------

def _looks_like_bot(sender_id: Optional[str], sender_name: Optional[str]) -> bool:
    sid = (sender_id or "")
    name = (sender_name or "").lower()
    if not sid and not name:
        return True  # no identity at all => treat as system/bot noise
    # Slack bot sender_ids are B-prefixed (BXXXX); mautrix gives uppercase.
    if sid.upper().startswith("B") and sid[1:].isalnum() and len(sid) >= 6:
        return True
    if "bot" in name:
        return True
    return False


def infer_role(platform: str, workspace_id: str, sender_id: Optional[str],
               sender_name: Optional[str], origin: str) -> str:
    """customer | agent | bot | system.

    `origin` distinguishes the two source tables: 'reply' rows come from
    agent.replies and are always our side (agent); 'message' rows come from
    agent.messages (ingested puppet-ghost traffic — usually the customer).
    """
    if origin == "reply":
        return "agent"
    if _looks_like_bot(sender_id, sender_name):
        return "bot"
    sid = (sender_id or "").lower()
    name = (sender_name or "").lower()
    if config.AGENT_SENDERS and (sid in config.AGENT_SENDERS or name in config.AGENT_SENDERS):
        return "agent"
    return "customer"


# ---------------------------------------------------------------------------
# Reading upstream chat (read-only)
# ---------------------------------------------------------------------------

def fetch_conversation_messages(conn, conversation_id: str) -> list[dict[str, Any]]:
    """Return the full ordered turn list for a conversation: agent.messages
    (customer/bridged) UNION agent.replies (our staff replies), sorted by time.

    Staff replies live in agent.replies, NOT agent.messages, so a one-table read
    would make every conversation look like the customer always spoke last.
    """
    rows: list[dict[str, Any]] = []
    with dict_cur(conn) as cur:
        cur.execute(
            """
            SELECT platform, workspace_id, channel_id, message_id, thread_id,
                   sender_id, sender_name, text, ts, 'message' AS origin
            FROM agent.messages
            WHERE conversation_id = %s
            """,
            (conversation_id,),
        )
        rows.extend(dict(r) for r in cur.fetchall())
        cur.execute(
            """
            SELECT platform, workspace_id, channel_id,
                   COALESCE(matrix_event_id, id::text) AS message_id,
                   NULL::text AS thread_id,
                   COALESCE(agent_id, 'agent') AS sender_id,
                   COALESCE(agent_id, 'agent') AS sender_name,
                   reply_text AS text,
                   COALESCE(sent_at, created_at) AS ts,
                   'reply' AS origin
            FROM agent.replies
            WHERE conversation_id = %s
            """,
            (conversation_id,),
        )
        rows.extend(dict(r) for r in cur.fetchall())

    # Stable sort by ts (None last); ties keep insertion order.
    rows.sort(key=lambda r: (r["ts"] is None, r["ts"] or dt.datetime.min.replace(tzinfo=UTC)))
    for r in rows:
        r["role"] = infer_role(
            r["platform"], r["workspace_id"], r.get("sender_id"),
            r.get("sender_name"), r["origin"],
        )
        r["markers"] = markers.scan(r.get("text"))
    return rows


def fetch_conversation_meta(conn, conversation_id: str) -> Optional[dict[str, Any]]:
    with dict_cur(conn) as cur:
        cur.execute(
            """
            SELECT c.id, c.platform, c.workspace_id, c.channel_id, c.thread_id,
                   ch.channel_name
            FROM agent.conversations c
            LEFT JOIN agent.channels ch
              ON ch.platform = c.platform
             AND ch.workspace_id = c.workspace_id
             AND ch.channel_id = c.channel_id
            WHERE c.id = %s
            """,
            (conversation_id,),
        )
        row = cur.fetchone()
        return dict(row) if row else None


# ---------------------------------------------------------------------------
# Segmentation: split a conversation's turns into distinct problems
# ---------------------------------------------------------------------------

def segment(turns: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Split ordered turns into problem segments.

    Boundary rules (deterministic):
      a) thread_id changes (Slack/Discord threads are distinct problems).
      b) a time gap larger than GAP_SECONDS between consecutive turns.
      c) a fresh customer problem message (problem marker / question) arriving
         AFTER the current segment already showed a closure signal.
    Each segment gets a stable segment_key = first message_id in the segment,
    so re-scans upsert the same issue rather than duplicating it.
    """
    segments: list[dict[str, Any]] = []
    cur_turns: list[dict[str, Any]] = []
    cur_thread: Any = None
    prev_ts: Optional[dt.datetime] = None
    saw_closure = False

    def flush():
        nonlocal cur_turns, saw_closure
        if cur_turns:
            segments.append({
                "segment_key": cur_turns[0]["message_id"],
                "turns": cur_turns,
            })
        cur_turns = []
        saw_closure = False

    for t in turns:
        boundary = False
        if cur_turns:
            if t.get("thread_id") != cur_thread:
                boundary = True
            elif prev_ts is not None and t["ts"] is not None:
                if (t["ts"] - prev_ts).total_seconds() > config.GAP_SECONDS:
                    boundary = True
            if not boundary and saw_closure and t["role"] == "customer":
                m = t.get("markers") or {}
                if ("problem" in m or "question_mark" in m) and "thanks" not in m and "reopen" not in m:
                    boundary = True
        if boundary:
            flush()
        cur_turns.append(t)
        cur_thread = t.get("thread_id")
        prev_ts = t["ts"]
        m = t.get("markers") or {}
        if t["role"] == "agent" and "resolution" in m:
            saw_closure = True
        if t["role"] == "customer" and "thanks" in m:
            saw_closure = True

    flush()
    return segments


# ---------------------------------------------------------------------------
# Lifecycle derivation + non-closure floor (heuristic, zero egress)
# ---------------------------------------------------------------------------

def _first_customer_problem(turns: list[dict[str, Any]]) -> Optional[dict[str, Any]]:
    for t in turns:
        if t["role"] == "customer":
            m = t.get("markers") or {}
            if "problem" in m or "question_mark" in m:
                return t
    # No explicit problem marker; fall back to the first customer turn.
    for t in turns:
        if t["role"] == "customer":
            return t
    return None


def derive(seg: dict[str, Any], now: dt.datetime) -> Optional[dict[str, Any]]:
    """Compute the issue fields for a segment. Returns None if the segment is
    not a customer problem at all (bot-only / agent-only / no customer turn)."""
    turns = seg["turns"]
    start = _first_customer_problem(turns)
    if start is None:
        return None  # nothing customer-initiated -> not an issue

    customer_turns = [t for t in turns if t["role"] == "customer"]
    agent_turns = [t for t in turns if t["role"] == "agent"]
    last = turns[-1]
    last_customer = customer_turns[-1] if customer_turns else None
    last_agent = agent_turns[-1] if agent_turns else None

    last_speaker = last["role"] if last["role"] in ("customer", "agent") else None

    # Closure / progress signals over the segment.
    agent_proposed = any(t["role"] == "agent" and "resolution" in (t.get("markers") or {})
                         for t in turns)

    reopened = any("reopen" in (t.get("markers") or {}) for t in customer_turns)

    # A customer thanks AFTER the last agent resolution is the strong ack — but
    # a turn that ALSO signals a relapse ("好了…又不行了") is NOT an ack, and any
    # reopen marker at/after the thanks vetoes the closure. This is the central
    # false-closure guard: closure must never win over a reopen.
    customer_thanked = False
    thank_ts: Optional[dt.datetime] = None
    if last_agent is not None:
        for t in customer_turns:
            if t["ts"] and last_agent["ts"] and t["ts"] >= last_agent["ts"]:
                m = t.get("markers") or {}
                if "thanks" in m and "reopen" not in m:
                    customer_thanked = True
                    thank_ts = t["ts"]
    elif last_customer is not None:
        m = last_customer.get("markers") or {}
        if "thanks" in m and "reopen" not in m:
            customer_thanked = True
            thank_ts = last_customer["ts"]
    # Veto: any reopen marker at/after the thanks means the problem came back.
    if customer_thanked and thank_ts is not None:
        for t in customer_turns:
            if "reopen" in (t.get("markers") or {}) and t["ts"] and t["ts"] >= thank_ts:
                customer_thanked = False
                break

    agent_asked = last_agent is not None and "agent_question" in (last_agent.get("markers") or {})

    # --- decide lifecycle_state + nonclosure_reason ---
    lifecycle = "active"
    nonclosure: Optional[str] = None
    closure_reason: Optional[str] = None
    closure_conf = 0.0

    last_activity = last["ts"] or now

    if reopened:
        # Reopen is checked FIRST: a relapse must never be overridden by an
        # earlier thanks. The problem is back in our court.
        lifecycle = "reopened"
        nonclosure = "reopened"
    elif customer_thanked and agent_proposed:
        # Strong ack -> inferred closure (NOT yet confirmed; main loop applies
        # the grace window before any auto-confirm).
        lifecycle = "closed_inferred"
        closure_reason = "customer_thanked"
        closure_conf = 0.9
    elif last_speaker == "customer":
        # Ball in our court — the primary 未闭环 signal.
        lifecycle = "awaiting_agent"
        age = (now - (last_customer["ts"] or now)).total_seconds() if last_customer else 0
        if age > config.SLA_UNANSWERED_SECONDS:
            nonclosure = "unanswered_customer"
    elif last_speaker == "agent":
        if agent_proposed:
            lifecycle = "resolution_proposed"
            # Agent answered, customer silent. Silence NEVER auto-closes; this
            # stays open until a human confirms or the customer acks.
            age = (now - (last_agent["ts"] or now)).total_seconds() if last_agent else 0
            if age > config.IDLE_OPEN_SECONDS:
                nonclosure = "idle_open"
        elif agent_asked:
            lifecycle = "awaiting_customer"
            age = (now - (last_agent["ts"] or now)).total_seconds() if last_agent else 0
            if age > config.AWAITING_CUSTOMER_STALE_SECONDS:
                nonclosure = "awaiting_customer_stale"
        else:
            lifecycle = "awaiting_customer"
    else:
        lifecycle = "active"

    # Global idle catch-all for anything still open and long-dead.
    if nonclosure is None and lifecycle not in ("closed_inferred", "closed_confirmed", "dismissed"):
        if (now - last_activity).total_seconds() > config.IDLE_OPEN_SECONDS:
            nonclosure = "idle_open"

    # SLA due time for the dashboard countdown (when awaiting us).
    sla_due = None
    if lifecycle == "awaiting_agent" and last_customer and last_customer["ts"]:
        sla_due = last_customer["ts"] + dt.timedelta(seconds=config.SLA_UNANSWERED_SECONDS)

    title = (start.get("text") or "").strip().replace("\n", " ")
    if len(title) > 120:
        title = title[:117] + "..."

    return {
        "segment_key": seg["segment_key"],
        "title": title or "(无文本)",
        "lifecycle_state": lifecycle,
        "nonclosure_reason": nonclosure,
        "closure_reason": closure_reason,
        "closure_confidence": closure_conf,
        "last_speaker": last_speaker,
        "last_customer_at": last_customer["ts"] if last_customer else None,
        "last_agent_at": last_agent["ts"] if last_agent else None,
        "message_count": len(turns),
        # opened_at is NOT NULL but agent.messages.ts is nullable; fall back so a
        # null-ts first message can't break the INSERT.
        "opened_at": start["ts"] or last_activity,
        "last_activity_at": last_activity,
        "sla_due_at": sla_due,
        "external_party_id": start.get("sender_id"),
        "external_party_name": start.get("sender_name"),
        "signals": {
            "agent_proposed": agent_proposed,
            "customer_thanked": customer_thanked,
            "reopened": reopened,
            "agent_asked": agent_asked,
            "marker_hits": {t["message_id"]: t["markers"] for t in turns if t.get("markers")},
        },
        "turns": turns,
        "start": start,
    }


# ---------------------------------------------------------------------------
# Persistence (writes issue.* only)
# ---------------------------------------------------------------------------

def _record_history(cur, issue_id, field, old, new):
    if old == new:
        return
    cur.execute(
        f"""
        INSERT INTO {SCHEMA}.issue_history (issue_id, field, old_value, new_value, actor_mxid)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (issue_id, field,
         psycopg2.extras.Json(old) if old is not None else None,
         psycopg2.extras.Json(new) if new is not None else None,
         config.SYSTEM_ACTOR),
    )


# ---------------------------------------------------------------------------
# LLM adjudication (P4)
#
# Runs in upsert_issue's transaction so the LLM verdict, the issue.issues
# update, the issue_history entry, and the issue_signals row all commit
# atomically. Per-tick budget caps cost; overshooting just defers
# adjudication to the next tick (the heuristic verdict still stands until
# then). Hard invariants:
#   * Silence still NEVER closes — adjudicate only DOWNGRADES (never upgrades
#     to closed_*).
#   * Any LLM error => uncertain => human queue (no automation kicks in).
#   * Each LLM call writes one issue_signals row, regardless of verdict.
# ---------------------------------------------------------------------------

# Per-tick LLM call counter, reset by reset_llm_budget() at the top of every
# tick(). Single detector thread so a module-level int is safe.
_llm_calls_this_tick = 0


def reset_llm_budget() -> None:
    global _llm_calls_this_tick
    _llm_calls_this_tick = 0


def _llm_budget_ok() -> bool:
    return _llm_calls_this_tick < config.LLM_PER_TICK_BUDGET


def _format_transcript(turns: list[dict[str, Any]], *, max_chars: int = 2000) -> str:
    """Compact, role-tagged excerpt for the LLM. Trim from the END (i.e. keep
    the head: the problem statement matters most for is-problem judgments;
    closure judgments need the head AND tail, so we keep both with a marker
    when truncated)."""
    lines: list[str] = []
    for t in turns:
        role = t.get("role") or "?"
        text = (t.get("text") or "").replace("\n", " ").strip()
        if not text:
            continue
        lines.append(f"[{role}] {text}")
    full = "\n".join(lines)
    if len(full) <= max_chars:
        return full
    # Keep head 60% / tail 40% with a marker, so we don't hide the resolution
    # turn at the end.
    head = int(max_chars * 0.6)
    tail = max_chars - head - 30
    return full[:head] + "\n... [truncated] ...\n" + full[-tail:]


def _record_signal(cur, issue_id: str, evaluator: str, llm_out: dict,
                   *, score: float | None = None) -> None:
    """One row per LLM call, with the structured verdict + token usage. Cost
    is recorded as the raw token total in micros so the dashboard can sum it
    without caring about per-model pricing here."""
    pt = int(llm_out.get("prompt_tokens", 0))
    ct = int(llm_out.get("completion_tokens", 0))
    cost_micros = (pt + ct)  # raw tokens; dashboard converts to ¥ if it wants
    verdict = llm_out.get("verdict")
    signals = {
        "verdict": verdict,
        "reason": llm_out.get("reason"),
        "raw": (llm_out.get("raw") or "")[-300:],  # tail only — egress hygiene
        "model": llm_out.get("model"),
        "prompt_tokens": pt,
        "completion_tokens": ct,
    }
    # Map our internal verdict tags to the issue_signals CHECK enum.
    enum_verdict = None
    if verdict in ("likely_closed", "likely_open", "uncertain"):
        enum_verdict = verdict
    cur.execute(
        f"""
        INSERT INTO {SCHEMA}.issue_signals
          (issue_id, evaluator, closure_score, signals, verdict, cost_micros)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (issue_id, evaluator, score, psycopg2.extras.Json(signals),
         enum_verdict, cost_micros),
    )


def _has_recent_signal(cur, issue_id: str, evaluator: str) -> bool:
    """Has this evaluator already produced a non-uncertain verdict for this
    issue? Idempotency guard so the cleanup wave doesn't burn tokens
    re-judging the same issue every tick."""
    cur.execute(
        f"""SELECT 1 FROM {SCHEMA}.issue_signals
           WHERE issue_id = %s AND evaluator = %s
             AND verdict IN ('likely_closed','likely_open')
           LIMIT 1""",
        (issue_id, evaluator),
    )
    return cur.fetchone() is not None


def adjudicate(cur, issue_id: str, d: dict[str, Any]) -> tuple[str, Optional[str], Optional[str]]:
    """Run LLM checks against the heuristic verdict. Returns the (possibly
    overridden) (lifecycle_state, nonclosure_reason, closure_reason) that the
    caller should write. Per-tick budgeted; bypassed when llm.enabled() is
    False (heuristic verdict passes through unchanged)."""
    global _llm_calls_this_tick
    state = d["lifecycle_state"]
    nc = d["nonclosure_reason"]
    cr = d["closure_reason"]
    if not llm.enabled():
        return state, nc, cr

    transcript = _format_transcript(d["turns"])
    if not transcript:
        return state, nc, cr

    # 1) PROBLEM FILTER (TELEMETRY ONLY). After dry-run on 30 real issues
    #    showed 0/30 not_a_problem (real customer support traffic looks like
    #    real problems even when terse), we DON'T auto-dismiss anymore. The
    #    verdict is recorded into issue_signals so a human reviewer can see
    #    it, but the lifecycle stays whatever the heuristic chose. Also: when
    #    AUTO_MERGE is on, skip this call entirely so the per-tick budget
    #    goes to merges (which actually change anything).
    if state in ("active", "awaiting_agent", "awaiting_customer", "detected") \
            and not config.AUTO_MERGE \
            and not _has_recent_signal(cur, issue_id, "llm-problem-filter") \
            and _llm_budget_ok():
        out = llm.judge_is_problem(transcript)
        _llm_calls_this_tick += 1
        _record_signal(cur, issue_id, "llm-problem-filter", out)
        # No state mutation; signal serves as transparency only.

    # 2) CLOSURE CHALLENGE. Heuristic said closed_inferred; ask the model to
    #    argue OPEN. If it finds anything, veto. Silence-only inferred closures
    #    don't reach this path because derive() doesnf't infer closure from
    #    silence (only from customer_thanked + agent_proposed).
    if state == "closed_inferred" \
            and not _has_recent_signal(cur, issue_id, "llm-closure-challenge") \
            and _llm_budget_ok():
        out = llm.judge_closure_challenge(transcript)
        _llm_calls_this_tick += 1
        _record_signal(cur, issue_id, "llm-closure-challenge", out)
        if out.get("verdict") == "likely_open":
            log.info("issue %s closure VETOED by challenge", issue_id)
            # Re-derive a non-closed state from the heuristic signals: if there
            # was a real customer follow-up the heuristic missed, the safest
            # bet is awaiting_agent (ball back in our court) and re-flag.
            return "awaiting_agent", "reopened", None

    return state, nc, cr


def upsert_issue(conn, conv: dict[str, Any], d: dict[str, Any]) -> Optional[str]:
    """Insert or extend the issue for this segment. Idempotent on
    (conversation_id, segment_key) while the issue is active. Respects the
    lifecycle transition graph and the human-review boundary: never overrides a
    human-confirmed/closed/dismissed/promoted issue.

    Returns the issue id, or None if skipped.
    """
    seg_key = d["segment_key"]
    with dict_cur(conn) as cur:
        cur.execute(
            f"""
            SELECT id, lifecycle_state, review_state, nonclosure_reason,
                   closure_reason, reopened_count
            FROM {SCHEMA}.issues
            WHERE conversation_id = %s AND metadata->>'segment_key' = %s
            ORDER BY created_at DESC LIMIT 1
            """,
            (conv["id"], seg_key),
        )
        existing = cur.fetchone()

        new_state = d["lifecycle_state"]

        if existing is None:
            cur.execute(
                f"""
                INSERT INTO {SCHEMA}.issues
                  (conversation_id, customer_platform, customer_workspace_id,
                   customer_channel_id, thread_id, external_party_id,
                   external_party_name, title, lifecycle_state, nonclosure_reason,
                   closure_reason, closure_confidence, last_speaker,
                   last_customer_at, last_agent_at, message_count, detector,
                   confidence, opened_at, last_activity_at, sla_due_at,
                   closure_detected_at, signals, metadata)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                        %s,%s,%s,%s,%s,%s)
                RETURNING id
                """,
                (
                    conv["id"], conv["platform"], conv["workspace_id"],
                    conv["channel_id"], conv.get("thread_id"),
                    d["external_party_id"], d["external_party_name"], d["title"],
                    new_state, d["nonclosure_reason"], d["closure_reason"],
                    d["closure_confidence"], d["last_speaker"],
                    d["last_customer_at"], d["last_agent_at"], d["message_count"],
                    "heuristic-v1", d["closure_confidence"], d["opened_at"],
                    d["last_activity_at"], d["sla_due_at"],
                    d["last_activity_at"] if new_state == "closed_inferred" else None,
                    psycopg2.extras.Json(d["signals"]),
                    psycopg2.extras.Json({"segment_key": seg_key}),
                ),
            )
            issue_id = cur.fetchone()["id"]
            _record_history(cur, issue_id, "detected", None,
                            {"lifecycle_state": new_state, "title": d["title"]})
            if d["nonclosure_reason"]:
                _record_history(cur, issue_id, "nonclosure_flagged", None,
                                {"reason": d["nonclosure_reason"]})

            # LLM adjudication may downgrade the verdict. Runs in this same
            # transaction so the issue_signals row, the lifecycle change, and
            # the history entry commit atomically.
            adj_state, adj_nc, adj_cr = adjudicate(cur, str(issue_id), d)
            if adj_state != new_state or adj_nc != d["nonclosure_reason"] \
                    or adj_cr != d["closure_reason"]:
                cur.execute(
                    f"""UPDATE {SCHEMA}.issues
                       SET lifecycle_state = %s, nonclosure_reason = %s,
                           closure_reason = %s,
                           closed_at = CASE WHEN %s = 'dismissedf' THEN now()
                                            ELSE closed_at END
                       WHERE id = %s""",
                    (adj_state, adj_nc, adj_cr, adj_state, issue_id),
                )
                _record_history(cur, str(issue_id), "llm_adjudicated",
                                {"lifecycle_state": new_state,
                                 "nonclosure_reason": d["nonclosure_reason"],
                                 "closure_reason": d["closure_reason"]},
                                {"lifecycle_state": adj_state,
                                 "nonclosure_reason": adj_nc,
                                 "closure_reason": adj_cr})
        else:
            issue_id = existing["id"]
            # Human boundary: do not touch issues a person has acted on.
            if existing["review_state"] in ("confirmed", "rejected", "merged", "promoted"):
                return str(issue_id)
            if existing["lifecycle_state"] in ("closed_confirmed", "dismissed"):
                return str(issue_id)

            old_state = existing["lifecycle_state"]
            target = new_state if validate_transition(old_state, new_state) else old_state

            cur.execute(
                f"""
                UPDATE {SCHEMA}.issues SET
                  lifecycle_state = %s, nonclosure_reason = %s, closure_reason = %s,
                  closure_confidence = %s, last_speaker = %s, last_customer_at = %s,
                  last_agent_at = %s, message_count = %s, last_activity_at = %s,
                  sla_due_at = %s, title = COALESCE(NULLIF(title,''), %s),
                  external_party_id = COALESCE(external_party_id, %s),
                  external_party_name = COALESCE(external_party_name, %s),
                  closure_detected_at = CASE
                    WHEN %s = 'closed_inferred' AND closure_detected_at IS NULL THEN %s
                    WHEN %s <> 'closed_inferred' THEN NULL
                    ELSE closure_detected_at END,
                  signals = %s
                WHERE id = %s
                """,
                (
                    target, d["nonclosure_reason"], d["closure_reason"],
                    d["closure_confidence"], d["last_speaker"], d["last_customer_at"],
                    d["last_agent_at"], d["message_count"], d["last_activity_at"],
                    d["sla_due_at"], d["title"], d["external_party_id"],
                    d["external_party_name"], target, d["last_activity_at"], target,
                    psycopg2.extras.Json(d["signals"]), issue_id,
                ),
            )
            if target != old_state:
                _record_history(cur, issue_id, "state_change",
                                {"lifecycle_state": old_state},
                                {"lifecycle_state": target})
            if d["nonclosure_reason"] and d["nonclosure_reason"] != existing["nonclosure_reason"]:
                _record_history(cur, issue_id, "nonclosure_flagged",
                                {"reason": existing["nonclosure_reason"]},
                                {"reason": d["nonclosure_reason"]})

            # LLM adjudication on existing issues — only re-runs filters that
            # haven't yielded a final verdict yet (the _has_recent_signal
            # guard inside adjudicate handles idempotency).
            adj_state, adj_nc, adj_cr = adjudicate(cur, str(issue_id), {**d, "lifecycle_state": target})
            if adj_state != target or adj_nc != d["nonclosure_reason"] \
                    or adj_cr != d["closure_reason"]:
                cur.execute(
                    f"""UPDATE {SCHEMA}.issues
                       SET lifecycle_state = %s, nonclosure_reason = %s,
                           closure_reason = %s,
                           closed_at = CASE WHEN %s = 'dismissed' AND closed_at IS NULL
                                            THEN now() ELSE closed_at END
                       WHERE id = %s""",
                    (adj_state, adj_nc, adj_cr, adj_state, issue_id),
                )
                _record_history(cur, str(issue_id), "llm_adjudicated",
                                {"lifecycle_state": target,
                                 "nonclosure_reason": d["nonclosure_reason"],
                                 "closure_reason": d["closure_reason"]},
                                {"lifecycle_state": adj_state,
                                 "nonclosure_reason": adj_nc,
                                 "closure_reason": adj_cr})

        _write_evidence(cur, issue_id, d)
        return str(issue_id)


def _write_evidence(cur, issue_id, d: dict[str, Any]) -> None:
    f"""Map the segment's turns into {SCHEMA}.issue_messages (idempotent upsert).
    Only agent.messages rows have a composite FK target; agent.replies turns are
    skipped (they are not in agent.messages)."""
    start_id = d["start"]["message_id"]
    for t in d["turns"]:
        if t["origin"] != "message":
            continue  # only real agent.messages rows satisfy the FK
        signal_kind = None
        m = t.get("markers") or {}
        if t["message_id"] == start_id:
            signal_kind = "problem_start"
        elif t["role"] == "agent" and "resolution" in m:
            signal_kind = "agent_proposed_fix"
        elif t["role"] == "customer" and "thanks" in m:
            signal_kind = "customer_thanks"
        elif t["role"] == "customer" and "reopen" in m:
            signal_kind = "reopen_trigger"
        cur.execute(
            f"""
            INSERT INTO {SCHEMA}.issue_messages
              (issue_id, platform, workspace_id, channel_id, message_id, role,
               signal_kind, is_segment_start, ts, added_by)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (issue_id, platform, workspace_id, channel_id, message_id)
            DO UPDATE SET role = EXCLUDED.role, signal_kind = EXCLUDED.signal_kind
            """,
            (issue_id, t["platform"], t["workspace_id"], t["channel_id"],
             t["message_id"], t["role"], signal_kind,
             t["message_id"] == start_id, t["ts"], "heuristic-v1"),
        )


# ---------------------------------------------------------------------------
# Auto-merge of over-segmented issues (P4f)
#
# Heuristic time-gap segmentation cuts a single in-progress problem into many
# "issues" because support follow-ups span days. After the heuristic pass, ask
# GLM to compare adjacent unreviewed open issues in the same conversation and
# merge those it judges to be the same underlying problem. Skips human-touched
# issues entirely. Idempotent: a SAME verdict already recorded on a pair is not
# re-evaluated.
#
# Failure semantics: any LLM error or uncertain verdict leaves the pair split.
# False merges (hiding distinct problems behind one row) are worse than false
# splits (more rows for a human to glance at).
# ---------------------------------------------------------------------------

def _issue_transcript(conn, issue_id: str, *, max_chars: int = 1200) -> str:
    """Build the same minimal transcript used by validate_merge.py for one
    issue's evidence rows. Trim from the middle so head + tail survive."""
    with dict_cur(conn) as cur:
        cur.execute(
            f"""SELECT im.role, am.text, am.ts
               FROM {SCHEMA}.issue_messages im
               LEFT JOIN agent.messages am
                 ON am.platform = im.platform AND am.workspace_id = im.workspace_id
                AND am.channel_id = im.channel_id AND am.message_id = im.message_id
               WHERE im.issue_id = %s
               ORDER BY am.ts NULLS LAST
               LIMIT 50""",
            (issue_id,),
        )
        rows = cur.fetchall()
    lines = []
    for r in rows:
        text = (r.get("text") or "").replace("\n", " ").strip()
        if not text:
            continue
        lines.append(f"[{r.get('role') or '?'}] {text}")
    full = "\n".join(lines)
    if len(full) <= max_chars:
        return full
    head = int(max_chars * 0.6)
    tail = max_chars - head - 30
    return full[:head] + "\n... [truncated] ...\n" + full[-tail:]


def _merge_pair_already_judged(cur, src_id: str, dst_id: str) -> bool:
    """Have we already evaluated this exact pair this run? Tracked in
    issue_signals on the source issue with evaluator='llm-merge:<dst>'."""
    cur.execute(
        f"""SELECT 1 FROM {SCHEMA}.issue_signals
           WHERE issue_id = %s AND evaluator = %s
             AND verdict IN ('likely_closed','likely_open')
           LIMIT 1""",
        (src_id, f"llm-merge:{dst_id}"),
    )
    return cur.fetchone() is not None


def _do_merge(cur, src_id: str, dst_id: str) -> None:
    """Re-point src's evidence onto dst (skipping rows already on dst), mark
    src as merged, write the merge_links audit row + history on both sides.
    Mirrors the manual /merge endpoint in main.py."""
    cur.execute(
        f"""UPDATE {SCHEMA}.issue_messages m
           SET issue_id = %s
           WHERE m.issue_id = %s
             AND NOT EXISTS (
               SELECT 1 FROM {SCHEMA}.issue_messages t
               WHERE t.issue_id = %s AND t.platform = m.platform
                 AND t.workspace_id = m.workspace_id AND t.channel_id = m.channel_id
                 AND t.message_id = m.message_id)""",
        (dst_id, src_id, dst_id),
    )
    cur.execute(
        f"""UPDATE {SCHEMA}.issues
           SET review_state='merged', lifecycle_state='dismissed',
               merged_into_issue_id=%s, nonclosure_reason=NULL,
               reviewed_by_mxid=%s, reviewed_at=now(), closed_at=now()
           WHERE id=%s""",
        (dst_id, config.SYSTEM_ACTOR, src_id),
    )
    cur.execute(
        f"""INSERT INTO {SCHEMA}.merge_links (kept_issue_id, merged_issue_id, actor_mxid)
           VALUES (%s, %s, %s)""",
        (dst_id, src_id, config.SYSTEM_ACTOR),
    )
    _record_history(cur, src_id, "merged", None,
                    {"into": dst_id, "by": "auto-merge"})
    _record_history(cur, dst_id, "merged_from", None,
                    {"from": src_id, "by": "auto-merge"})


def merge_overcut_issues(conn, conversation_id: str) -> int:
    """For one conversation: ask GLM to compare adjacent unreviewed open
    issues; auto-merge each SAME pair into the older issue. Returns count of
    merges performed. No-op when AUTO_MERGE is off or the LLM is disabled.

    Walks pairs left-to-right, so a SAME-SAME chain (A,B,C) collapses A->B then
    A,C — but since B is now dismissed we re-walk from the survivor list, so
    chains end up A<-merged C (A as the kept survivor)."""
    global _llm_calls_this_tick
    if not config.AUTO_MERGE or not llm.enabled():
        return 0
    merged = 0
    while True:
        with dict_cur(conn) as cur:
            cur.execute(
                f"""SELECT id, opened_at, title
                   FROM {SCHEMA}.issues
                   WHERE conversation_id = %s
                     AND review_state = 'unreviewed'
                     AND lifecycle_state NOT IN ('closed_confirmed','dismissed')
                   ORDER BY opened_at""",
                (conversation_id,),
            )
            issues = cur.fetchall()
        if len(issues) < 2 or not _llm_budget_ok():
            break

        progress = False
        for a, b in zip(issues, issues[1:]):
            if not _llm_budget_ok():
                break
            if not (a["opened_at"] and b["opened_at"]):
                continue
            gap_days = (b["opened_at"] - a["opened_at"]).total_seconds() / 86400
            if gap_days > config.MERGE_WINDOW_DAYS:
                continue
            with dict_cur(conn) as cur:
                if _merge_pair_already_judged(cur, str(b["id"]), str(a["id"])):
                    continue
                ta = _issue_transcript(conn, str(a["id"]))
                tb = _issue_transcript(conn, str(b["id"]))
            if not ta or not tb:
                continue
            out = llm.judge_same_problem(ta, tb)
            _llm_calls_this_tick += 1
            with conn.cursor() as cur:
                # Record the verdict on the SRC (the one that may be merged
                # away), keyed by the DST so the same pair isn't re-judged.
                _record_signal(
                    cur, str(b["id"]), f"llm-merge:{a['id']}", out,
                    score=1.0 if out.get("verdict") == "same_problem" else 0.0,
                )
                if out.get("verdict") == "same_problem":
                    _do_merge(cur, str(b["id"]), str(a["id"]))
                    merged += 1
                    progress = True
                    log.info("auto-merge: %s -> %s", b["id"], a["id"])
                    conn.commit()
                    break  # restart with refreshed list (b is gone)
            conn.commit()
        if not progress:
            break
    return merged


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def process_conversation(conn, conversation_id: str, now: dt.datetime) -> Optional[int]:
    """Re-segment and upsert all issues for one conversation. Returns the number
    of issues touched on success, or None on error (so callers can decide
    whether to advance the watermark past it). Commits on success, rolls back on
    error."""
    try:
        conv = fetch_conversation_meta(conn, conversation_id)
        if conv is None:
            return 0
        # P5: if this channel is owned by the GLM distiller (it has a
        # channel_memory row), the heuristic detector stays out of its way.
        # The distiller will pick this up on its next scheduled run.
        with conn.cursor() as _cur:
            _cur.execute(
                f"""SELECT 1 FROM {SCHEMA}.channel_memory
                   WHERE platform=%s AND workspace_id=%s AND channel_id=%s""",
                (conv["platform"], conv["workspace_id"], conv["channel_id"]),
            )
            if _cur.fetchone():
                return 0
        turns = fetch_conversation_messages(conn, conversation_id)
        if not turns:
            return 0
        touched = 0
        for seg in segment(turns):
            d = derive(seg, now)
            if d is None:
                continue
            if upsert_issue(conn, conv, d):
                touched += 1
        conn.commit()
        # Auto-merge runs AFTER the heuristic pass commits, so even if it
        # fails partway the new/updated issues are already saved. It commits
        # per-merge internally.
        try:
            merge_overcut_issues(conn, conversation_id)
        except Exception:
            conn.rollback()
            log.exception("auto-merge skipped for %s", conversation_id)
        return touched
    except Exception:
        conn.rollback()
        log.exception("process_conversation %s failed", conversation_id)
        return None


# Min UUID sentinel: keyset lower bound so the very first tick includes every
# conversation regardless of id.
_MIN_UUID = "00000000-0000-0000-0000-000000000000"


def _get_cursor(conn) -> tuple[dt.datetime, str]:
    """Return the keyset watermark (last_imported_at, last_conversation_id)."""
    with dict_cur(conn) as cur:
        cur.execute(
            f"SELECT last_imported_at, last_message_pk FROM {SCHEMA}.detector_cursor WHERE detector = %s",
            (config.DETECTOR_NAME,),
        )
        row = cur.fetchone()
    if row:
        pk = row.get("last_message_pk") or {}
        return row["last_imported_at"], pk.get("conversation_id", _MIN_UUID)
    floor = dt.datetime.min.replace(tzinfo=UTC)
    if config.BACKFILL_SINCE:
        try:
            floor = dt.datetime.fromisoformat(config.BACKFILL_SINCE)
            if floor.tzinfo is None:
                floor = floor.replace(tzinfo=UTC)
        except ValueError:
            log.warning("bad ISSUE_BACKFILL_SINCE=%r, ignoring", config.BACKFILL_SINCE)
    return floor, _MIN_UUID


def _set_cursor(conn, ts: dt.datetime, conv_id: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            f"""
            INSERT INTO {SCHEMA}.detector_cursor (detector, last_imported_at, last_message_pk, last_run_at)
            VALUES (%s, %s, %s, now())
            ON CONFLICT (detector) DO UPDATE SET
              last_imported_at = EXCLUDED.last_imported_at,
              last_message_pk = EXCLUDED.last_message_pk,
              last_run_at = now()
            """,
            (config.DETECTOR_NAME, ts, psycopg2.extras.Json({"conversation_id": conv_id})),
        )
    conn.commit()


def _due_conversations(conn, since_ts: dt.datetime, since_conv: str, limit: int):
    """Conversations with messages at/after the watermark, ordered by the keyset
    (hwm, conversation_id), strictly greater than the cursor. The HAVING keyset
    is exact (no tie truncation); WHERE imported_at >= since_ts is a coarse
    index prefilter."""
    with dict_cur(conn) as cur:
        cur.execute(
            """
            SELECT conversation_id, max(imported_at) AS hwm
            FROM agent.messages
            WHERE imported_at >= %s AND conversation_id IS NOT NULL
            GROUP BY conversation_id
            HAVING (max(imported_at), conversation_id::text) > (%s, %s)
            ORDER BY hwm, conversation_id::text
            LIMIT %s
            """,
            (since_ts, since_ts, since_conv, limit),
        )
        return cur.fetchall()


def tick(conn, now: Optional[dt.datetime] = None) -> dict[str, int]:
    """One incremental pass: find conversations newer than the keyset watermark,
    reprocess each, and advance the cursor through the contiguous run of
    successes. A conversation that errors stops the watermark advance for this
    tick (it is retried next tick); it cannot be silently skipped. Processing
    more than BATCH_SIZE conversations simply continues on the next tick."""
    now = now or dt.datetime.now(UTC)
    reset_llm_budget()
    since_ts, since_conv = _get_cursor(conn)
    rows = _due_conversations(conn, since_ts, since_conv, config.BATCH_SIZE)

    touched = 0
    errors = 0
    last_ok: Optional[tuple[dt.datetime, str]] = None
    for r in rows:
        n = process_conversation(conn, str(r["conversation_id"]), now)
        if n is None:
            errors += 1
            break  # don't advance past a failure; retry it next tick
        touched += n
        last_ok = (r["hwm"], str(r["conversation_id"]))
    if last_ok is not None:
        _set_cursor(conn, last_ok[0], last_ok[1])

    # Re-evaluate already-open issues for SLA/idle drift even if no new message
    # arrived (an unanswered customer becomes "breached" purely by time passing).
    touched += sweep_open_issues(conn, now)

    return {"conversations": len(rows), "issues_touched": touched, "errors": errors}


def sweep_open_issues(conn, now: dt.datetime) -> int:
    """Re-derive non-closure on still-open issues so time-based breaches surface
    without a new inbound message. Also applies the closure grace auto-confirm.
    Only re-runs issues that have NOT been human-touched."""
    with dict_cur(conn) as cur:
        cur.execute(
            f"""
            SELECT DISTINCT conversation_id
            FROM {SCHEMA}.issues
            WHERE review_state = 'unreviewed'
              AND lifecycle_state NOT IN ('closed_confirmed','dismissed')
            LIMIT %s
            """,
            (config.BATCH_SIZE,),
        )
        conv_ids = [r["conversation_id"] for r in cur.fetchall()]
    touched = 0
    for cid in conv_ids:
        touched += process_conversation(conn, str(cid), now) or 0
    touched += apply_closure_grace(conn, now)
    return touched


def apply_closure_grace(conn, now: dt.datetime) -> int:
    """Auto-confirm closure ONLY for explicit-thanks inferred closures whose
    grace window has elapsed with no reopen. Silence-based closures are never
    touched here — they require a human. Returns count auto-confirmed."""
    cutoff = now - dt.timedelta(seconds=config.CLOSURE_GRACE_SECONDS)
    try:
        with dict_cur(conn) as cur:
            cur.execute(
                f"""
                SELECT id FROM {SCHEMA}.issues
                WHERE lifecycle_state = 'closed_inferred'
                  AND review_state = 'unreviewed'
                  AND closure_reason = 'customer_thanked'
                  AND closure_detected_at IS NOT NULL
                  AND closure_detected_at < %s
                LIMIT %s
                """,
                (cutoff, config.BATCH_SIZE),
            )
            ids = [r["id"] for r in cur.fetchall()]
            for iid in ids:
                cur.execute(
                    f"""
                    UPDATE {SCHEMA}.issues
                    SET lifecycle_state = 'closed_confirmed', closed_at = now(),
                        nonclosure_reason = NULL
                    WHERE id = %s AND lifecycle_state = 'closed_inferred'
                      AND review_state = 'unreviewed'
                    """,
                    (iid,),
                )
                _record_history(cur, iid, "closure_confirmed",
                                {"lifecycle_state": "closed_inferred"},
                                {"lifecycle_state": "closed_confirmed",
                                 "auto": True, "reason": "customer_thanked_grace"})
        conn.commit()
        return len(ids)
    except Exception:
        conn.rollback()
        log.exception("apply_closure_grace failed")
        return 0


def backfill(conn) -> dict[str, int]:
    """One-shot historical pass: walk agent.messages by the keyset watermark in
    BATCH_SIZE pages until caught up. Idempotent — re-running upserts the same
    issues. A conversation that errors does not advance the cursor past itself;
    the page stops there and the next page retries it (bounded by errors guard
    so a permanently-bad conversation can't loop forever)."""
    now = dt.datetime.now(UTC)
    total_conv = 0
    total_issues = 0
    pages = 0
    consecutive_stalls = 0
    while True:
        reset_llm_budget()
        since_ts, since_conv = _get_cursor(conn)
        rows = _due_conversations(conn, since_ts, since_conv, config.BATCH_SIZE)
        if not rows:
            break
        pages += 1
        last_ok: Optional[tuple[dt.datetime, str]] = None
        page_conv = 0
        for r in rows:
            n = process_conversation(conn, str(r["conversation_id"]), now)
            if n is None:
                break  # stop the page at the failure; don't skip it
            total_issues += n
            total_conv += 1
            page_conv += 1
            last_ok = (r["hwm"], str(r["conversation_id"]))
        if last_ok is not None:
            _set_cursor(conn, last_ok[0], last_ok[1])
            consecutive_stalls = 0
        else:
            # First conversation of the page failed and we couldn't advance.
            consecutive_stalls += 1
            if consecutive_stalls >= 3:
                log.error("backfill stalled on conversation %s after %d retries; aborting",
                          rows[0]["conversation_id"], consecutive_stalls)
                break
        log.info("backfill page %d: %d conversations this page, %d total, %d issues so far",
                 pages, page_conv, total_conv, total_issues)
    return {"pages": pages, "conversations": total_conv, "issues_touched": total_issues}
