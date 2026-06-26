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
    "5b. The memory section is CONTEXT, not a closed set. Every distinct problem "
    "in the messages MUST appear in your output — whether it updates a known "
    "issue (reuse its external_id) or is BRAND NEW (fresh external_id). If the "
    "new messages contain a problem not present in memory, you MUST open a new "
    "issue for it. Never drop a real new problem just because memory didn't "
    "mention it.\n"
    "5c. OUTPUT ONLY issues that the CURRENT messages block creates or "
    "substantively changes. Do NOT re-output issues from the memory section that "
    "the current messages don't touch — they are already saved and will be kept. "
    "Your output is a delta, not the full list. (This keeps responses small; "
    "emitting the entire backlog every time overflows the response limit and "
    "loses data.)\n"
    "6. evidence_msg_ids: list every message_id from the input that belongs to "
    "this problem, in chronological order. Use the IDs verbatim as printed.\n"
    "7. ROLE JUDGEMENT — decide from the CONVERSATION CONTENT who each speaker "
    "is, NOT just from names:\n"
    "   - \"agent\" = OUR support side (Novita): triages, asks for repro/logs, "
    "gives solutions/workarounds, confirms fixes/deploys, speaks for the "
    "platform.\n"
    "   - \"customer\" = the external party: reports a problem, asks for help, "
    "requests changes, reacts to our answers.\n"
    "   - \"bot\" = automated/system posts (join/leave notices, announcement "
    "feeds, webhook bots).\n"
    "   ADDRESS RULE (decisive): whoever a message is ADDRESSED TO is the other "
    "side. If a speaker writes \"hey Novita\", \"@Novita Support\", \"can you "
    "guys...\", or otherwise asks OUR team for help, that speaker is a "
    "\"customer\" — never an agent — no matter how technical they sound or that "
    "other agent turns surround them. Conversely, a message addressed to the "
    "customer team / answering their request is an \"agent\" turn. Use the "
    "CHANNEL CONTEXT block to know which named team is the customer.\n"
    "   The KNOWN_AGENTS hint lists some of our staff names, but it is a HINT "
    "only — trust the content first. A known name used by someone clearly "
    "asking for help is still a customer turn, and an unlisted name clearly "
    "providing support is an agent turn.\n"
    "8. products: classify which product(s) this problem is about. Choose ZERO "
    "or more values ONLY from the PRODUCTS list given below; never invent new "
    "ones. Use \"Other\" if none fit.\n"
    "9. Output strictly valid JSON, nothing else, matching this shape exactly:\n"
    "   {\"issues\":[{\"external_id\":str,\"title\":str,\"status\":\"open\"|\"closed\","
    "\"summary\":str,\"summary_zh\":str,\"closure_reason\":str|null,"
    "\"products\":[str,...],"
    "\"roles\":{\"<msg_id>\":\"customer\"|\"agent\"|\"bot\"},"
    "\"evidence_msg_ids\":[str,...]}]}\n"
    "10. title is a single short sentence (<=80 chars) describing the problem. "
    "summary is in English; summary_zh is the SAME summary in Simplified "
    "Chinese (简体中文, <=80 字), faithful to summary — not a translation of the "
    "title, a real one-sentence problem summary.\n"
    "11. closure_reason is null when status=open. When closed, set it to "
    "\"customer_confirmed\" / \"agent_confirmed\" / \"resolution_proposed\" "
    "based on what actually happened in the messages.\n"
    "12. roles MUST cover every msg_id in evidence_msg_ids, keyed by the "
    "verbatim message_id.\n"
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


def _normalize_products(raw: Any) -> list[str]:
    """Map the LLM's products[] onto the canonical PRODUCT_TAGS enum,
    case-insensitively. Drop anything not in the whitelist, dedupe, preserve
    enum order so the dashboard renders consistently."""
    if not isinstance(raw, list):
        return []
    seen = set()
    for p in raw:
        canon = config.PRODUCT_TAGS_LC.get(str(p).strip().lower())
        if canon:
            seen.add(canon)
    return [t for t in config.PRODUCT_TAGS if t in seen]


def _customer_label(channel: dict[str, Any]) -> str:
    """Best-effort human name of the CUSTOMER side of this channel, to give the
    LLM channel context for role judgement. Slack ext-channels are named like
    `ext-<customer>-novita` / `ext-novita-<customer>`; Discord DMs like
    `<customer> <> Novita`. We strip our own brand tokens and separators so the
    LLM knows who the external party is. Falls back to the raw channel name."""
    name = (channel.get("channel_name") or "").strip()
    if not name:
        return "the external customer team"
    cleaned = re.sub(r"^[#\s]*ext[-_\s]+", "", name, flags=re.I)
    cleaned = re.sub(r"[-_\s]*\bnovita\b[-_\s]*", " ", cleaned, flags=re.I)
    cleaned = re.sub(r"<>|<\s*>|&", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" -_")
    return cleaned or name



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
                       *, bootstrap: bool, customer_label: str = "") -> str:
    parts = []
    # Channel context: who the customer side is. In mixed channels (customer
    # staff + our support both present) the LLM otherwise can't tell a
    # customer's colleague from one of ours.
    if customer_label:
        parts.append("=== CHANNEL CONTEXT ===")
        parts.append(
            f"This channel is between the CUSTOMER team \"{customer_label}\" and "
            "OUR support team (Novita). Anyone speaking FOR Novita / answering on "
            "Novita's behalf is an \"agent\"; everyone else (the customer's own "
            "people, including their engineers/managers) is a \"customer\" — even "
            "when they sound technical or collaborative. If a speaker ADDRESSES "
            "\"Novita\"/\"Novita Support\"/our team or asks us for help, they are a "
            "customer by definition.")
        parts.append("")
    # Hints (non-authoritative): known staff names + the closed product enum.
    # The model is told in SYSTEM_DISTILL to trust conversation content over
    # these, but they sharpen role/product calls on ambiguous turns.
    if config.AGENT_SENDERS:
        parts.append("=== KNOWN_AGENTS (our staff; HINT only, trust content first) ===")
        parts.append(", ".join(sorted(config.AGENT_SENDERS)))
        parts.append("")
    parts.append("=== PRODUCTS (pick products[] ONLY from these) ===")
    parts.append(", ".join(config.PRODUCT_TAGS))
    parts.append("")
    if bootstrap:
        parts.append("=== bootstrap run: no prior memory; build the full issue list ===\n")
    else:
        parts.append("=== current memory (issues already known — CONTEXT only, not a closed set) ===\n")
        parts.append(memory_text or "(empty)")
        parts.append("\n=== new messages since last distill — extract EVERY new "
                     "problem here; open a new issue for any problem not already "
                     "in memory ===\n")
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
                   *, bootstrap: bool, customer_label: str = "") -> tuple[list[dict[str, Any]], dict[str, int]]:
    """One GLM call. Returns (parsed issues list, token usage dict). On any
    failure returns ([], usage)."""
    if not llm.enabled():
        return [], {"prompt_tokens": 0, "completion_tokens": 0}
    user = _build_user_prompt(memory_text, msgs, bootstrap=bootstrap,
                              customer_label=customer_label)
    out = llm._ask(SYSTEM_DISTILL, user, max_tokens=32768,
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
    summary_zh = (item.get("summary_zh") or "").strip()[:500]
    closure_reason = item.get("closure_reason")
    evidence = [str(x) for x in (item.get("evidence_msg_ids") or []) if x]
    products = _normalize_products(item.get("products"))
    # LLM-judged per-message roles (content-based). Keyed by verbatim msg_id;
    # only customer/agent/bot are honored, anything else falls back to the
    # name-list heuristic below.
    raw_roles = item.get("roles") if isinstance(item.get("roles"), dict) else {}
    llm_roles = {str(k): str(v).strip().lower() for k, v in raw_roles.items()
                 if str(v).strip().lower() in ("customer", "agent", "bot")}
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

    # Real timestamps + last speaker, computed from the evidence messages
    # themselves (NOT distill run time). The dashboard relies on these to show
    # "last activity" and "ball in whose court". We join agent.messages for ts
    # and infer role with the same heuristic distill uses for the transcript.
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """SELECT message_id, sender_id, sender_name, ts
               FROM agent.messages
               WHERE platform=%s AND workspace_id=%s AND channel_id=%s
                 AND message_id = ANY(%s) AND ts IS NOT NULL
               ORDER BY ts""",
            (*pk, evidence),
        )
        ev_rows = cur.fetchall()
    opened_at = ev_rows[0]["ts"] if ev_rows else None
    last_activity_at = ev_rows[-1]["ts"] if ev_rows else None
    last_speaker = None
    last_customer_at = None
    last_agent_at = None
    resolved_roles: dict[str, str] = {}  # msg_id -> role, for issue_messages
    for r in ev_rows:
        # Prefer the LLM's content-based role; fall back to the name-list
        # heuristic when the model didn't cover this msg_id.
        role = llm_roles.get(str(r["message_id"]))
        if role not in ("customer", "agent", "bot"):
            role = _infer_role({"origin": "message", "sender_id": r.get("sender_id"),
                                "sender_name": r.get("sender_name")})
        resolved_roles[str(r["message_id"])] = role
        if role == "customer":
            last_customer_at = r["ts"]
        elif role == "agent":
            last_agent_at = r["ts"]
        if role in ("customer", "agent"):
            last_speaker = role  # ev_rows is ts-ordered, so last wins


    # Fallbacks so NOT NULL opened_at never breaks and a message-less issue
    # (shouldn't happen post-filter) still inserts.
    now = dt.datetime.now(UTC)
    opened_at = opened_at or now
    last_activity_at = last_activity_at or now

    conv_id = _conversation_for_message(conn, channel, first_msg)
    if conv_id is None:
        # Fall back to the channel's most recent conversation row — required
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
                      closure_reason, metadata
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
        # Open issue: who has the ball depends on who spoke last. If the
        # customer spoke last, it's on us (awaiting_agent + unanswered flag);
        # if we spoke last, we're waiting on them (awaiting_customer, no
        # unanswered flag — silence is theirs, not ours).
        if last_speaker == "agent":
            new_state = "awaiting_customer"
            nc = None
            cr = None
        else:
            new_state = "awaiting_agent"
            nc = "unanswered_customer"
            cr = None

    metadata = {"distill_external_id": ext, "summary": summary,
                "summary_zh": summary_zh,
                "distilled": True, "evidence_count": len(evidence),
                "products": products}


    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        if existing is None:
            cur.execute(
                f"""INSERT INTO {SCHEMA}.issues
                     (conversation_id, customer_platform, customer_workspace_id,
                      customer_channel_id, title, lifecycle_state, nonclosure_reason,
                      closure_reason, message_count, detector, opened_at,
                      last_activity_at, last_speaker, last_customer_at, last_agent_at,
                      closure_detected_at, signals, metadata)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                   RETURNING id""",
                (conv_id, channel["platform"], channel["workspace_id"],
                 channel["channel_id"], title or "(no title)", new_state, nc,
                 cr, len(evidence), "glm-distill",
                 opened_at, last_activity_at, last_speaker,
                 last_customer_at, last_agent_at,
                 last_activity_at if new_state == "closed_inferred" else None,
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
                     opened_at = LEAST(opened_at, %s),
                     last_activity_at = GREATEST(last_activity_at, %s),
                     last_speaker = %s, last_customer_at = %s, last_agent_at = %s,
                     closure_detected_at = CASE
                       WHEN %s = 'closed_inferred' AND closure_detected_at IS NULL THEN now()
                       WHEN %s <> 'closed_inferred' THEN NULL
                       ELSE closure_detected_at END,
                     signals = %s,
                     metadata = metadata || %s
                   WHERE id = %s""",
                (title or existing.get("title") or "(no title)", new_state, nc, cr,
                 len(evidence), opened_at, last_activity_at,
                 last_speaker, last_customer_at, last_agent_at,
                 new_state, new_state,
                 psycopg2.extras.Json({"summary": summary}),
                 psycopg2.extras.Json(metadata), issue_id),
            )
            if new_state != existing["lifecycle_state"]:
                _record_history(cur, issue_id, "distilled_state",
                                {"lifecycle_state": existing["lifecycle_state"]},
                                {"lifecycle_state": new_state})
            old_products = (existing.get("metadata") or {}).get("products") or []
            if old_products != products:
                _record_history(cur, issue_id, "products", old_products, products)


        # Evidence rows: idempotent upsert of every msg the GLM listed. Filter
        # against agent.messages first because the model can hallucinate IDs
        # that don't exist (Sonnet has been observed to invent timestamps);
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
            # Role: resolved map (LLM-first, heuristic fallback) for msgs we had
            # a ts row for; else the LLM's own call; else NULL.
            row_role = resolved_roles.get(msg_id) or llm_roles.get(msg_id)
            cur.execute(
                f"""INSERT INTO {SCHEMA}.issue_messages
                     (issue_id, platform, workspace_id, channel_id, message_id,
                      role, signal_kind, is_segment_start, ts, added_by)
                   VALUES (%s,%s,%s,%s,%s,%s,NULL,%s,%s, 'glm-distillf')
                   ON CONFLICT (issue_id, platform, workspace_id, channel_id, message_id)
                   DO UPDATE SET role = COALESCE(EXCLUDED.role, {SCHEMA}.issue_messages.role)""",
                (issue_id, channel["platform"], channel["workspace_id"],
                 channel["channel_id"], msg_id, row_role, msg_id == first_msg, None),
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
# Channel auto-discovery
# ---------------------------------------------------------------------------

# Minimum customer messages a channel needs before auto-discovery seeds it, to
# skip pure-bot/system/near-empty noise channels.
DISCOVER_MIN_CUSTOMER_MSGS = int(os.environ.get("ISSUE_DISCOVER_MIN_CUSTOMER_MSGS", "2"))


def _is_customer_channel(name: Optional[str]) -> bool:
    """Whether a channel NAME looks like a customer support channel, used to
    keep auto-discovery from pulling in internal/community/DM noise. Patterns
    seen in this deployment:
      keep: 'ext-<x>-novita', '<customer><>Novita', '<x> Novita_Support',
            anything containing 'novita' / 'external'
      drop: Discord topic channels (#general, #announcements, #random, ...),
            'internal-*', and bare personal-name DMs (Aka, David R., Rex, ...)
    Set ISSUE_DISCOVER_REQUIRE_CUSTOMER_NAME=0 to disable and discover by
    customer-message count alone (old behavior)."""
    if not name or not name.strip():
        return False
    n = name.strip()
    low = n.lower()
    if "internal" in low:
        return False
    if n.startswith("#"):
        # Discord topic channels: only the explicitly-external ones are customer.
        return ("ext-" in low) or ("external" in low)
    if "ext-" in low or "ex-" in low or "external" in low:
        return True
    if "<>" in n or "< >" in n:
        return True
    if "novita" in low:
        return True
    if low.endswith("support") or "_support" in low or " support" in low:
        return True
    return False


REQUIRE_CUSTOMER_NAME = os.environ.get("ISSUE_DISCOVER_REQUIRE_CUSTOMER_NAME", "1") != "0"


def _time_floor_dt() -> Optional[dt.datetime]:
    """config.TIME_FLOOR ('YYYY-MM-DD' or '') parsed to an aware UTC datetime,
    or None when unset. Used to skip discovering channels that went quiet before
    the dashboard window."""
    raw = (getattr(config, "TIME_FLOOR", "") or "").strip()
    if not raw:
        return None
    try:
        return dt.datetime.fromisoformat(raw).replace(tzinfo=UTC)
    except ValueError:
        return None


def discover_channels(conn) -> list[dict[str, Any]]:
    """Channels that have customer traffic but no channel_memory row yet, so the
    distill loop can bootstrap them automatically. New customer groups thus show
    up on the dashboard without manual CLI seeding.

    A channel qualifies when it has >= DISCOVER_MIN_CUSTOMER_MSGS messages that
    role-infer to 'customer' (not our staff, not bots) AND its most recent
    CUSTOMER message is on/after config.TIME_FLOOR — i.e. the channel is still
    active in the dashboard's window. Dead channels whose last customer activity
    predates TIME_FLOOR are skipped entirely (no point spending LLM on history
    that would never surface on the dashboard). NOTE: this gates on the channel
    being *recently active*; once a channel qualifies, distill.run still reads
    its FULL history so a problem spanning late-May into June keeps its May
    context intact — we filter channels, never truncate a conversation."""
    candidates: list[dict[str, Any]] = []
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"""SELECT m.platform, m.workspace_id, m.channel_id,
                       max(ch.channel_name) AS channel_name,
                       m.sender_id, m.sender_name, count(*) AS n,
                       max(m.ts) AS last_ts
               FROM agent.messages m
               LEFT JOIN agent.channels ch
                 ON ch.platform = m.platform AND ch.workspace_id = m.workspace_id
                AND ch.channel_id = m.channel_id
               WHERE NOT EXISTS (
                       SELECT 1 FROM {SCHEMA}.channel_memory cm
                       WHERE cm.platform = m.platform
                         AND cm.workspace_id = m.workspace_id
                         AND cm.channel_id = m.channel_id)
               GROUP BY m.platform, m.workspace_id, m.channel_id,
                        m.sender_id, m.sender_name"""
        )
        rows = cur.fetchall()
    # Fold per-(channel) customer-message counts + latest customer activity.
    agg: dict[tuple, dict[str, Any]] = {}
    for r in rows:
        key = (r["platform"], r["workspace_id"], r["channel_id"])
        slot = agg.setdefault(key, {"platform": key[0], "workspace_id": key[1],
                                    "channel_id": key[2], "channel_name": None,
                                    "cust_msgs": 0, "last_customer_ts": None})
        if r.get("channel_name"):
            slot["channel_name"] = r["channel_name"]
        role = _infer_role({"origin": "message", "sender_id": r.get("sender_id"),
                            "sender_name": r.get("sender_name")})
        if role == "customer":
            slot["cust_msgs"] += int(r["n"])
            lt = r.get("last_ts")
            if lt and (slot["last_customer_ts"] is None or lt > slot["last_customer_ts"]):
                slot["last_customer_ts"] = lt
    floor = _time_floor_dt()
    for slot in agg.values():
        if slot["cust_msgs"] < DISCOVER_MIN_CUSTOMER_MSGS:
            continue
        # Name gate: skip internal/community/DM noise unless disabled.
        if REQUIRE_CUSTOMER_NAME and not _is_customer_channel(slot.get("channel_name")):
            continue
        # Recency gate: skip channels with no customer activity since TIME_FLOOR.
        if floor is not None:
            lt = slot.get("last_customer_ts")
            if lt is None or lt < floor:
                continue
        candidates.append(slot)
    return candidates


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
    customer_label = _customer_label(channel)
    log.info("distill: %s bootstrap=%s msgs=%d windows=%d customer=%r",
             channel.get("channel_name"), bootstrap, len(msgs), len(wins),
             customer_label)

    total_tokens = 0
    issues_emitted = 0
    failed_windows = 0
    # Earliest ts among messages in any window that FAILED at the LLM (503 etc.).
    # The watermark must not advance past this, or those messages are lost.
    first_failed_ts: Optional[dt.datetime] = None
    last_msg = msgs[-1]
    for i, w in enumerate(wins):
        items, usage = call_distiller(memory_text, w, bootstrap=bootstrap,
                                      customer_label=customer_label)
        win_tokens = usage["prompt_tokens"] + usage["completion_tokens"]
        total_tokens += win_tokens
        # A window that returned no items AND spent no tokens is an LLM failure
        # (503/timeout/etc.), NOT a genuinely empty window — distinguish so we
        # don't advance the watermark over chat we never actually read.
        if not items and win_tokens == 0 and llm.enabled():
            failed_windows += 1
            w_ts = [m["ts"] for m in w if m.get("ts") is not None]
            if w_ts:
                wmin = min(w_ts)
                if first_failed_ts is None or wmin < first_failed_ts:
                    first_failed_ts = wmin
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
                 len(items), win_tokens)
        # Re-render memory after each window so the next window sees issues
        # opened by this one (avoids cross-window dup/drop). Rule 5c keeps the
        # model from re-emitting unchanged memory issues, so this context growth
        # does NOT bloat the RESPONSE — only the prompt, which has ample room.
        open_text, closed_text = render_memory(conn, channel)
        memory_text = ("OPEN ISSUES:\n" + (open_text or "(none)") +
                       "\n\nRECENTLY CLOSED:\n" + (closed_text or "(none)"))
        bootstrap = False  # later windows behave like incremental

    # If EVERY window failed at the LLM (proxy down / all 503), do NOT persist
    # memory: leave the channel un-seeded (or its watermark unmoved) so the next
    # pass retries it instead of silently skipping the unread history.
    if wins and failed_windows == len(wins) and issues_emitted == 0:
        log.warning("distill: %s ALL %d windows failed at LLM — not advancing "
                    "watermark, will retry next pass", channel.get("channel_name"),
                    len(wins))
        return {"channel": channel.get("channel_name"), "windows": len(wins),
                "issues_emitted": 0, "tokens": total_tokens, "all_failed": True}

    # Refresh memory + watermark.
    open_text, closed_text = render_memory(conn, channel)
    # Advance the watermark to the last message — EXCEPT do not advance past the
    # first message of any window that failed at the LLM (503/timeout), so those
    # un-read messages are retried next pass instead of being silently skipped.
    # (With the prompt now instructing the model to emit every new problem, a
    # window that succeeded but emitted nothing genuinely had no trackable
    # problem, so advancing past it is correct.)
    new_wm = last_msg["ts"]
    new_wm_id = last_msg["message_id"]
    if first_failed_ts is not None:
        # hold just before the earliest failed message
        survivors = [m for m in msgs if m.get("ts") is not None and m["ts"] < first_failed_ts]
        if survivors:
            new_wm = survivors[-1]["ts"]
            new_wm_id = survivors[-1]["message_id"]
        else:
            new_wm = mem.get("last_distilled_ts")
            new_wm_id = mem.get("last_message_id")
    mem.update({
        "channel_name": channel.get("channel_name"),
        "last_distilled_ts": new_wm,
        "last_message_id": new_wm_id,
        "open_issues_summary": open_text,
        "recent_closed_summary": closed_text,
        "total_distill_runs": (mem.get("total_distill_runs") or 0) + 1,
        "total_tokens_used": (mem.get("total_tokens_used") or 0) + total_tokens,
    })
    save_memory(conn, mem)
    return {"channel": channel.get("channel_name"),
            "windows": len(wins), "issues_emitted": issues_emitted,
            "tokens": total_tokens}
