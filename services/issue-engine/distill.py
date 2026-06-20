"""Channel-level GLM distillation (P5).

The post-backfill heuristic + cleanup approach (heuristic time-gap segments +
pairwise GLM merge) was wrong for this product: support follow-ups span days,
so heuristic cuts every long thread into many "issues" and the pairwise merge
only collapses adjacent pairs. The right model is **read the whole channel
through GLM** and let it output the actual problem list — one row per real
problem, however many messages it spans.

Two operating modes per channel:
  * Bootstrap (first run): channel_memory empty -> walk full history in
    windows, GLM emits the full issue list, we write it.
  * Incremental: subsequent runs read channel_memory.last_distilled_ts and
    feed the GLM ONLY new messages plus the running summary of currently-
    open issues. GLM either updates an existing issue, opens a new one,
    closes one, or reopens a closed one.

Closure rule (per user 2026-06-17): customer OR agent saying "fixed/resolved/
solved" => closed_inferred (still NOT closed_confirmed; that requires a
human). Pure silence still does NOT close — explicitly stated in the prompt.

This module owns the `distilled` channels entirely. detector.py SKIPS any
channel that has a row in <SCHEMA>.channel_memory (P5c).
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import logging
import os
import re
from typing import Any, Optional

import psycopg2
import psycopg2.extras

import config
from config import SCHEMA
import llm

log = logging.getLogger("issue-engine.distill")
UTC = dt.timezone.utc

# Maximum chars per window sent to GLM. Smoke-tested with GLM-5.1: 7.5k chars
# returns clean JSON in ~30s with 4k completion tokens. 25k chars consistently
# times out or returns truncated output. Stick to ~10k for headroom.
WINDOW_MAX_CHARS = int(os.environ.get("ISSUE_DISTILL_WINDOW_CHARS", "10000"))

# Timeout for one distill GLM call. Probed real ourdream windows take 95-150s,
# so 300s gives 2x headroom; on heavy load GLM still occasionally goes past
# 180s. Failures are logged and the window is simply skipped (its messages
# survive in agent.messages and the next incremental run will retry).
DISTILL_TIMEOUT_SECONDS = float(os.environ.get("ISSUE_DISTILL_TIMEOUT_SECONDS", "300"))

# Keep memory summaries bounded so old runs don't bloat the prompt.
MAX_OPEN_SUMMARY_CHARS = 8000
MAX_CLOSED_SUMMARY_CHARS = 4000

SYSTEM_DISTILL = (
    "You are a customer support QA distiller. You read a chat channel between "
    "a customer team and our support team and produce a clean list of distinct "
    "customer PROBLEMS — actual support issues, change requests, or escalations "
    "that warrant tracking.\n\n"
    "RULES (strict, follow ALL):\n"
    "1. ONE problem per real underlying issue. A multi-day back-and-forth on "
    "the same topic = ONE problem, not many. Do not split by day or by speaker.\n"
    "2. Status is one of: \"open\" (still ongoing or no resolution stated) or "
    "\"closed\" (someone — customer OR agent — explicitly stated the problem "
    "is fixed, resolved, working, deployed, or the customer thanked confirming "
    "it works).\n"
    "3. SILENCE alone NEVER closes a problem. If the last activity is the "
    "customer asking and nobody answered, status is \"open\".\n"
    "4. Greetings, social chatter, scheduling pings, generic check-ins, and "
    "FYIs that don't ask for anything are NOT problems — omit them.\n"
    "5. external_id MUST be a stable string identifying this problem. If the "
    "memory section already has an entry for this problem, REUSE its "
    "external_id. Otherwise generate one as `p-<first-evidence-msg-id>`.\n"
    "6. evidence_msg_ids: list every message_id from the input that belongs to "
    "this problem, in chronological order. Use the IDs verbatim as printed.\n"
    "7. Output strictly valid JSON, nothing else, matching this shape exactly:\n"
    "   {\"issues\":[{\"external_id\":str,\"title\":str,\"status\":\"open\"|\"closed\","
    "\"summary\":str,\"closure_reason\":str|null,\"evidence_msg_ids\":[str,...]}]}\n"
    "8. title is a single short sentence (<=80 chars) describing the problem.\n"
    "9. closure_reason is null when status=open. When closed, set it to "
    "\"customer_confirmed\" / \"agent_confirmed\" / \"resolution_proposed\" "
    "based on what actually happened in the messages.\n"
)


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------

def _channel_pk(channel: dict[str, Any]) -> tuple[str, str, str]:
    return (channel["platform"], channel["workspace_id"], channel["channel_id"])


def load_memory(conn, channel: dict[str, Any]) -> dict[str, Any]:
    pk = _channel_pk(channel)
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"""SELECT * FROM {SCHEMA}.channel_memory
               WHERE platform=%s AND workspace_id=%s AND channel_id=%s""",
            pk,
        )
        row = cur.fetchone()
    if row:
        return dict(row)
    return {
        "platform": pk[0], "workspace_id": pk[1], "channel_id": pk[2],
        "channel_name": channel.get("channel_name"),
        "last_distilled_ts": None, "last_message_id": None,
        "open_issues_summary": "", "recent_closed_summary": "",
        "total_distill_runs": 0, "total_tokens_used": 0,
        "metadata": {},
    }


def save_memory(conn, mem: dict[str, Any]) -> None:
    with conn.cursor() as cur:
        cur.execute(
            f"""INSERT INTO {SCHEMA}.channel_memory
                 (platform, workspace_id, channel_id, channel_name,
                  last_distilled_ts, last_message_id,
                  open_issues_summary, recent_closed_summary,
                  total_distill_runs, total_tokens_used, last_run_at, metadata)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,now(),%s)
               ON CONFLICT (platform, workspace_id, channel_id) DO UPDATE SET
                 channel_name = EXCLUDED.channel_name,
                 last_distilled_ts = EXCLUDED.last_distilled_ts,
                 last_message_id = EXCLUDED.last_message_id,
                 open_issues_summary = EXCLUDED.open_issues_summary,
                 recent_closed_summary = EXCLUDED.recent_closed_summary,
                 total_distill_runs = EXCLUDED.total_distill_runs,
                 total_tokens_used = EXCLUDED.total_tokens_used,
                 last_run_at = now(),
                 metadata = EXCLUDED.metadata""",
            (mem["platform"], mem["workspace_id"], mem["channel_id"],
             mem.get("channel_name"),
             mem.get("last_distilled_ts"), mem.get("last_message_id"),
             mem.get("open_issues_summary", "")[:MAX_OPEN_SUMMARY_CHARS],
             mem.get("recent_closed_summary", "")[:MAX_CLOSED_SUMMARY_CHARS],
             mem.get("total_distill_runs", 0),
             mem.get("total_tokens_used", 0),
             psycopg2.extras.Json(mem.get("metadata") or {})),
        )
    conn.commit()


def fetch_channel_messages(conn, channel: dict[str, Any],
                           since_ts: Optional[dt.datetime] = None,
                           since_msg_id: Optional[str] = None) -> list[dict[str, Any]]:
    """Pull ALL messages (agent.messages + agent.replies) for this channel
    after the watermark, ordered by ts then message_id. Adds a synthesized
    'role' field (customer/agent/bot/system) using the same heuristics as
    detector.infer_role."""
    pk = _channel_pk(channel)
    rows: list[dict[str, Any]] = []
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """SELECT platform, workspace_id, channel_id, message_id, thread_id,
                      sender_id, sender_name, text, ts, 'message' AS origin,
                      conversation_id
               FROM agent.messages
               WHERE platform=%s AND workspace_id=%s AND channel_id=%s
                 AND (%s IS NULL OR ts > %s
                      OR (ts = %s AND message_id > COALESCE(%s, '')))""",
            (*pk, since_ts, since_ts, since_ts, since_msg_id),
        )
        rows.extend(dict(r) for r in cur.fetchall())
        # agent.replies are not channel-keyed by listener; they're conversation-
        # keyed. Pull any replies whose conversation_id is in this channel.
        cur.execute(
            """SELECT r.platform, r.workspace_id, r.channel_id,
                      COALESCE(r.matrix_event_id, r.id::text) AS message_id,
                      NULL::text AS thread_id,
                      COALESCE(r.agent_id, 'agent') AS sender_id,
                      COALESCE(r.agent_id, 'agent') AS sender_name,
                      r.reply_text AS text,
                      COALESCE(r.sent_at, r.created_at) AS ts,
                      'reply' AS origin,
                      r.conversation_id
               FROM agent.replies r
               WHERE r.platform=%s AND r.workspace_id=%s AND r.channel_id=%s
                 AND (%s IS NULL OR COALESCE(r.sent_at, r.created_at) > %s)""",
            (*pk, since_ts, since_ts),
        )
        rows.extend(dict(r) for r in cur.fetchall())
    rows.sort(key=lambda r: (r["ts"] is None, r["ts"] or dt.datetime.min.replace(tzinfo=UTC),
                              r["message_id"] or ""))
    for r in rows:
        r["role"] = _infer_role(r)
    return rows


def _infer_role(r: dict[str, Any]) -> str:
    if r["origin"] == "reply":
        return "agent"
    sid = (r.get("sender_id") or "")
    name = (r.get("sender_name") or "").lower()
    if not sid and not name:
        return "system"
    if "bot" in name:
        return "bot"
    if sid.upper().startswith("B") and len(sid) >= 6 and sid[1:].isalnum():
        return "bot"
    if config.AGENT_SENDERS:
        if sid.lower() in config.AGENT_SENDERS or name in config.AGENT_SENDERS:
            return "agent"
    return "customer"

# ---------------------------------------------------------------------------
# Window splitting
# ---------------------------------------------------------------------------

def _format_message(m: dict[str, Any]) -> str:
    role = m.get("role", "?")
    name = m.get("sender_name") or m.get("sender_id") or ""
    ts = m.get("ts").strftime("%Y-%m-%d %H:%M") if m.get("ts") else "?"
    text = (m.get("text") or "").replace("\n", " ").strip()
    if len(text) > 600:
        text = text[:600] + "…"
    return f"[id={m['message_id']}] [{ts}] [{role}|{name}] {text}"


def windows(messages: list[dict[str, Any]], max_chars: int = WINDOW_MAX_CHARS,
            overlap: int = 30) -> list[list[dict[str, Any]]]:
    """Greedy windows of <= max_chars, with `overlap` last messages of the
    previous window prepended to the next so a problem spanning a boundary is
    visible in both windows. The merge in apply_ops dedupes via external_id."""
    out: list[list[dict[str, Any]]] = []
    cur: list[dict[str, Any]] = []
    cur_chars = 0
    for m in messages:
        line = _format_message(m)
        added = len(line) + 1
        if cur and cur_chars + added > max_chars:
            out.append(cur)
            tail = cur[-overlap:] if overlap > 0 else []
            cur = list(tail)
            cur_chars = sum(len(_format_message(x)) + 1 for x in cur)
        cur.append(m)
        cur_chars += added
    if cur:
        out.append(cur)
    return out


# ---------------------------------------------------------------------------
# GLM call + JSON parse
# ---------------------------------------------------------------------------

def _build_user_prompt(memory_text: str, msgs: list[dict[str, Any]],
                       *, bootstrap: bool) -> str:
    parts = []
    if bootstrap:
        parts.append("=== bootstrap run: no prior memory; build the full issue list ===\n")
    else:
        parts.append("=== current memory (issues already known) ===\n")
        parts.append(memory_text or "(empty)")
        parts.append("\n=== new messages since last distill ===\n")
    parts.append("\n".join(_format_message(m) for m in msgs))
    return "\n".join(parts)


_JSON_BLOCK_RE = re.compile(r"\{.*\}", re.S)


def _parse_distill_response(raw: str) -> dict[str, Any]:
    """Pull the JSON object out of GLM's response. GLM-5.1 may wrap with
    reasoning prose or markdown fences; try strict parse first, then a regex
    fallback that grabs the largest {...} block."""
    raw = raw.strip()
    # Strip markdown fences if present.
    if raw.startswith("```"):
        raw = raw.split("```", 2)[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.rsplit("```", 1)[0].strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    m = _JSON_BLOCK_RE.search(raw)
    if not m:
        raise ValueError("no JSON object in GLM response")
    return json.loads(m.group(0))


def call_distiller(memory_text: str, msgs: list[dict[str, Any]],
                   *, bootstrap: bool) -> tuple[list[dict[str, Any]], dict[str, int]]:
    """One GLM call. Returns (parsed issues list, token usage dict). On any
    failure returns ([], usage)."""
    if not llm.enabled():
        return [], {"prompt_tokens": 0, "completion_tokens": 0}
    user = _build_user_prompt(memory_text, msgs, bootstrap=bootstrap)
    out = llm._ask(SYSTEM_DISTILL, user, max_tokens=16384,
                   timeout=DISTILL_TIMEOUT_SECONDS)
    usage = {"prompt_tokens": int(out.get("prompt_tokens", 0)),
             "completion_tokens": int(out.get("completion_tokens", 0))}
    # _ask returns verdict="uncertain" on any failure (timeout/http error/bad
    # response). raw is "" in that case — short-circuit so we don't log
    # "bad JSON" for what is really a network failure.
    if out.get("verdict") == "uncertain":
        log.warning("distiller call failed: %s", out.get("reason"))
        return [], usage
    if "raw" not in out:
        log.warning("distiller call failed: %s", out.get("reason"))
        return [], usage
    try:
        data = _parse_distill_response(out["raw"])
    except Exception as exc:
        log.warning("distiller bad JSON (%s): raw[:600]=%r  raw[-300:]=%r",
                    exc, (out.get("raw") or "")[:600], (out.get("raw") or "")[-300:])
        return [], usage
    issues = data.get("issues") if isinstance(data, dict) else None
    if not isinstance(issues, list):
        log.warning("distiller: missing 'issues' array in %s", str(data)[:300])
        return [], usage
    return issues, usage


# ---------------------------------------------------------------------------
# Apply distilled issues to the DB
# ---------------------------------------------------------------------------

def _conversation_for_message(conn, channel: dict[str, Any],
                              msg_id: str) -> Optional[str]:
    pk = _channel_pk(channel)
    with conn.cursor() as cur:
        cur.execute(
            """SELECT conversation_id FROM agent.messages
               WHERE platform=%s AND workspace_id=%s AND channel_id=%s AND message_id=%s""",
            (*pk, msg_id),
        )
        row = cur.fetchone()
    return str(row[0]) if row and row[0] else None


def _record_history(cur, issue_id: str, field: str, old: Any, new: Any) -> None:
    if old == new:
        return
    cur.execute(
        f"""INSERT INTO {SCHEMA}.issue_history (issue_id, field, old_value, new_value, actor_mxid)
           VALUES (%s, %s, %s, %s, %s)""",
        (issue_id, field,
         psycopg2.extras.Json(old) if old is not None else None,
         psycopg2.extras.Json(new) if new is not None else None,
         config.SYSTEM_ACTOR),
    )


def _upsert_issue(conn, channel: dict[str, Any], item: dict[str, Any]) -> Optional[str]:
    """Idempotent on (platform, workspace_id, channel_id, external_id) which
    we stash in metadata. status maps: open -> awaiting_agent (heuristic
    can refine), closed -> closed_inferred. """
    ext = item.get("external_id")
    title = (item.get("title") or "").strip()[:120]
    status = item.get("status") or "open"
    summary = (item.get("summary") or "").strip()[:2000]
    closure_reason = item.get("closure_reason")
    evidence = [str(x) for x in (item.get("evidence_msg_ids") or []) if x]
    if not ext or not evidence:
        return None
    # Filter hallucinated msg_ids upfront so first_msg + the FK insert later
    # both work on a clean set.
    pk = _channel_pk(channel)
    with conn.cursor() as cur:
        cur.execute(
            """SELECT message_id FROM agent.messages
               WHERE platform=%s AND workspace_id=%s AND channel_id=%s
                 AND message_id = ANY(%s)""",
            (*pk, evidence),
        )
        valid_ids = {row[0] for row in cur.fetchall()}
    evidence = [m for m in evidence if m in valid_ids]
    if not evidence:
        log.warning("distill: skipping issue %r — all %d evidence msg_ids hallucinated",
                    ext, len(item.get("evidence_msg_ids") or []))
        return None
    first_msg = evidence[0]
    last_msg = evidence[-1]

    conv_id = _conversation_for_message(conn, channel, first_msg)
    if conv_id is None:
        # Fall back to the channelf's most recent conversation row — required
        # because {SCHEMA}.issues.conversation_id is NOT NULL.
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id FROM agent.conversations
                   WHERE platform=%s AND workspace_id=%s AND channel_id=%s
                   ORDER BY last_activity_at DESC LIMIT 1""",
                _channel_pk(channel),
            )
            row = cur.fetchone()
        if not row:
            return None
        conv_id = str(row[0])

    # Look up existing issue by external_id stored in metadata.
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"""SELECT id, lifecycle_state, review_state, nonclosure_reason,
                      closure_reason
               FROM {SCHEMA}.issues
               WHERE customer_platform=%s AND customer_workspace_id=%s
                 AND customer_channel_id=%s AND metadata->>'distill_external_id'=%s
               LIMIT 1""",
            (channel["platform"], channel["workspace_id"], channel["channel_id"], ext),
        )
        existing = cur.fetchone()

    if status == "closed":
        new_state = "closed_inferred"
        nc = None
        cr = closure_reason or "distilled_closed"
    else:
        # Heuristic for "ball in whose court" we leave to the dashboard's
        # last_speaker logic — distill just says open, defaulting to
        # awaiting_agent.
        new_state = "awaiting_agent"
        nc = "unanswered_customer"
        cr = None

    metadata = {"distill_external_id": ext, "summary": summary,
                "distilled": True, "evidence_count": len(evidence)}

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        if existing is None:
            cur.execute(
                f"""INSERT INTO {SCHEMA}.issues
                     (conversation_id, customer_platform, customer_workspace_id,
                      customer_channel_id, title, lifecycle_state, nonclosure_reason,
                      closure_reason, message_count, detector, opened_at,
                      last_activity_at, closure_detected_at, signals, metadata)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                   RETURNING id""",
                (conv_id, channel["platform"], channel["workspace_id"],
                 channel["channel_id"], title or "(no title)", new_state, nc,
                 cr, len(evidence), "glm-distill",
                 dt.datetime.now(UTC), dt.datetime.now(UTC),
                 dt.datetime.now(UTC) if new_state == "closed_inferred" else None,
                 psycopg2.extras.Json({"summary": summary}),
                 psycopg2.extras.Json(metadata)),
            )
            issue_id = str(cur.fetchone()["id"])
            _record_history(cur, issue_id, "distilled", None,
                            {"lifecycle_state": new_state, "title": title})
        else:
            if existing["review_state"] in ("confirmed", "rejected", "merged", "promoted"):
                return str(existing["id"])
            issue_id = str(existing["id"])
            cur.execute(
                f"""UPDATE {SCHEMA}.issues SET
                     title = %s, lifecycle_state = %s, nonclosure_reason = %s,
                     closure_reason = %s, message_count = %s,
                     last_activity_at = now(),
                     closure_detected_at = CASE
                       WHEN %s = 'closed_inferred' AND closure_detected_at IS NULL THEN now()
                       WHEN %s <> 'closed_inferred' THEN NULL
                       ELSE closure_detected_at END,
                     signals = %s,
                     metadata = metadata || %s
                   WHERE id = %s""",
                (title or existing.get("title") or "(no title)", new_state, nc, cr,
                 len(evidence), new_state, new_state,
                 psycopg2.extras.Json({"summary": summary}),
                 psycopg2.extras.Json(metadata), issue_id),
            )
            if new_state != existing["lifecycle_state"]:
                _record_history(cur, issue_id, "distilled_state",
                                {"lifecycle_state": existing["lifecycle_state"]},
                                {"lifecycle_state": new_state})

        # Evidence rows: idempotent upsert of every msg the GLM listed. Filter
        # against agent.messages first because the model can hallucinate IDs
        # that donf't exist (Sonnet has been observed to invent timestamps);
        # the FK on issue_messages would otherwise abort the whole transaction.
        cur.execute(
            """SELECT message_id FROM agent.messages
               WHERE platform=%s AND workspace_id=%s AND channel_id=%s
                 AND message_id = ANY(%s)""",
            (channel["platform"], channel["workspace_id"], channel["channel_id"],
             evidence),
        )
        valid = {row["message_id"] for row in cur.fetchall()}
        skipped = [m for m in evidence if m not in valid]
        if skipped:
            log.warning("distill: dropping %d hallucinated msg_ids for issue %s "
                        "(e.g. %r)", len(skipped), issue_id, skipped[:3])
        for msg_id in evidence:
            if msg_id not in valid:
                continue
            cur.execute(
                f"""INSERT INTO {SCHEMA}.issue_messages
                     (issue_id, platform, workspace_id, channel_id, message_id,
                      role, signal_kind, is_segment_start, ts, added_by)
                   VALUES (%s,%s,%s,%s,%s,NULL,NULL,%s,%s, 'glm-distillf')
                   ON CONFLICT (issue_id, platform, workspace_id, channel_id, message_id)
                   DO NOTHING""",
                (issue_id, channel["platform"], channel["workspace_id"],
                 channel["channel_id"], msg_id, msg_id == first_msg, None),
            )
    return issue_id


# ---------------------------------------------------------------------------
# Memory rendering
# ---------------------------------------------------------------------------

def render_memory(conn, channel: dict[str, Any]) -> tuple[str, str]:
    """Build the open + closed summaries from current issue.* state. Used as
    GLM input for the next incremental run."""
    pk = _channel_pk(channel)
    open_lines: list[str] = []
    closed_lines: list[str] = []
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"""SELECT id, title, lifecycle_state, metadata, last_activity_at,
                      message_count
               FROM {SCHEMA}.issues
               WHERE customer_platform=%s AND customer_workspace_id=%s
                 AND customer_channel_id=%s
                 AND review_state='unreviewed'
                 AND lifecycle_state NOT IN ('dismissed')
               ORDER BY last_activity_at DESC LIMIT 60""",
            pk,
        )
        for r in cur.fetchall():
            ext = (r["metadata"] or {}).get("distill_external_id") or f"id-{r['id']}"
            line = f"- [{ext}] [{r['lifecycle_state']}] {r['title']}  ({r['message_count']} msgs, last {r['last_activity_at']:%Y-%m-%d})"
            if r["lifecycle_state"] in ("closed_inferred", "closed_confirmed"):
                closed_lines.append(line)
            else:
                open_lines.append(line)
    open_text = "\n".join(open_lines)[:MAX_OPEN_SUMMARY_CHARS]
    closed_text = "\n".join(closed_lines)[:MAX_CLOSED_SUMMARY_CHARS]
    return open_text, closed_text


# ---------------------------------------------------------------------------
# Top-level run
# ---------------------------------------------------------------------------

def run(conn, channel: dict[str, Any], *, force_full: bool = False) -> dict[str, Any]:
    """Distill ONE channel. Bootstrap on first run (memory empty), incremental
    afterward. Returns a stats dict."""
    mem = load_memory(conn, channel)
    bootstrap = force_full or not mem.get("last_distilled_ts")
    since_ts = None if bootstrap else mem["last_distilled_ts"]
    since_id = None if bootstrap else mem.get("last_message_id")
    msgs = fetch_channel_messages(conn, channel, since_ts, since_id)
    # Drop bot/system from the distill input — they pollute and don't help.
    msgs = [m for m in msgs if m["role"] in ("customer", "agent")]
    if not msgs:
        log.info("distill: %s no new messages", channel.get("channel_name"))
        save_memory(conn, mem)
        return {"channel": channel.get("channel_name"), "windows": 0,
                "issues_emitted": 0, "tokens": 0}

    if bootstrap:
        memory_text = ""
    else:
        open_text, closed_text = render_memory(conn, channel)
        memory_text = (
            "OPEN ISSUES:\n" + (open_text or "(none)") +
            "\n\nRECENTLY CLOSED:\n" + (closed_text or "(none)")
        )

    wins = windows(msgs)
    log.info("distill: %s bootstrap=%s msgs=%d windows=%d",
             channel.get("channel_name"), bootstrap, len(msgs), len(wins))

    total_tokens = 0
    issues_emitted = 0
    last_msg = msgs[-1]
    for i, w in enumerate(wins):
        items, usage = call_distiller(memory_text, w, bootstrap=bootstrap)
        total_tokens += usage["prompt_tokens"] + usage["completion_tokens"]
        for it in items:
            try:
                if _upsert_issue(conn, channel, it):
                    issues_emitted += 1
            except Exception:
                conn.rollback()
                log.exception("upsert failed for %s", it.get("external_id"))
                continue
        conn.commit()
        log.info("  window %d/%d: %d issues, %d tokens", i + 1, len(wins),
                 len(items), usage["prompt_tokens"] + usage["completion_tokens"])
        # On bootstrap the second window's "memory" should reflect what we
        # just emitted, so successive windows update existing issues rather
        # than spawn new ones for the overlap region.
        if bootstrap:
            open_text, closed_text = render_memory(conn, channel)
            memory_text = ("OPEN ISSUES:\n" + (open_text or "(none)") +
                           "\n\nRECENTLY CLOSED:\n" + (closed_text or "(none)"))
            bootstrap = False  # later windows behave like incremental

    # Refresh memory + watermark.
    open_text, closed_text = render_memory(conn, channel)
    mem.update({
        "channel_name": channel.get("channel_name"),
        "last_distilled_ts": last_msg["ts"],
        "last_message_id": last_msg["message_id"],
        "open_issues_summary": open_text,
        "recent_closed_summary": closed_text,
        "total_distill_runs": (mem.get("total_distill_runs") or 0) + 1,
        "total_tokens_used": (mem.get("total_tokens_used") or 0) + total_tokens,
    })
    save_memory(conn, mem)
    return {"channel": channel.get("channel_name"),
            "windows": len(wins), "issues_emitted": issues_emitted,
            "tokens": total_tokens}
