"""Closure Agent — autonomous closure-state judge (tier-1 tool-use loop).

Instead of distill's mechanical "who spoke last -> awaiting_agent" mapping
(which mislabels a customer's closing reply as "waiting on us"), this is a
real agent: it's given a set of tools and decides for itself what to read
before judging whether an issue is closed. Same model as distill (sonnet via
the OpenAI-compatible proxy), but with autonomy + full auditability.

Hard guardrails (the agent CANNOT override these — enforced in set_verdict):
  * may only write lifecycle_state in {closed_inferred, awaiting_agent,
    awaiting_customer, active, reopened}. NEVER closed_confirmed — that stays
    a human action in the dashboard.
  * refuses to touch issues a human already reviewed (review_state != unreviewed).
  * silence alone never closes (enforced by prompt AND by the fact that the
    agent reasons over real transcript evidence).
  * every verdict writes an issue_signals row (evaluator='closure-agent') with
    the model's reason + token cost, so the dashboard can show "why".

Tools the agent can call:
  get_transcript(issue_id)        -> full evidence messages (role, ts, text)
  get_channel_recent(issue_id)    -> messages in the channel AFTER this issue's
                                     last evidence ts (detect follow-up / reopen)
  set_verdict(issue_id, state, reason)  -> write the judgment

Run:
  python3 closure_agent.py            # judge a batch (default 40)
  python3 closure_agent.py 100        # batch size 100
  python3 closure_agent.py --dry-run  # judge but don't write
"""
from __future__ import annotations

import json
import os
import sys
import time
from typing import Any, Optional

import httpx
import psycopg2
import psycopg2.extras

import config
from config import SCHEMA, TIME_FLOOR

DATABASE_URL = os.environ["DATABASE_URL"]
MODEL = config.LLM_MODEL
BASE = config.LLM_BASE_URL
KEY = config.LLM_API_KEY
SYSTEM_ACTOR = config.SYSTEM_ACTOR

BATCH = 40
DRY_RUN = "--dry-run" in sys.argv
for a in sys.argv[1:]:
    if a.isdigit():
        BATCH = int(a)

WRITABLE_STATES = {"closed_inferred", "awaiting_agent", "awaiting_customer",
                   "active", "reopened"}
MAX_TOOL_TURNS = 6           # per issue, cap the agent's tool round-trips
PER_RUN_ISSUE_CAP = BATCH

SYSTEM_PROMPT = (
    "You are a customer-support closure auditor for Novita (a GPU/inference "
    "cloud). For ONE issue at a time you decide its current lifecycle state by "
    "reading the actual conversation. You have tools; call them as needed.\n\n"
    "Decide ONE of:\n"
    "  closed_inferred   — the problem is resolved: a fix was delivered AND the "
    "customer confirmed/acknowledged, OR the customer's own last message clearly "
    "ends the matter (answers our question, says it's fine, withdraws the ask). "
    "A support agent proactively flagging something the customer then explains "
    "away ('that was intentional') is closed_inferred.\n"
    "  awaiting_agent    — the ball is genuinely in OUR court: the customer asked "
    "something or reported a problem and we have NOT answered. This is the only "
    "state that means 'we are failing to respond'.\n"
    "  awaiting_customer — we answered or asked something and are waiting on the "
    "customer; the conversation is paused on their side.\n"
    "  active            — an ongoing back-and-forth, neither side stalled.\n"
    "  reopened          — was resolved but the customer came back saying it's "
    "still broken / regressed.\n\n"
    "RULES:\n"
    "1. NEVER decide closed_confirmed — that is a human-only action.\n"
    "2. Silence alone NEVER means closed. If the last thing that happened is the "
    "customer asking with no reply, it is awaiting_agent, not closed.\n"
    "3. A customer's reply that ANSWERS our question or closes the loop "
    "('normal rotation', 'it works now', 'thanks') is closed_inferred — NOT "
    "awaiting_agent. Do not treat the customer having the last word as 'waiting "
    "on us'.\n"
    "4. If unsure whether a later follow-up changed things, call "
    "get_channel_recent before deciding.\n"
    "5. When confident, call set_verdict exactly once with a one-sentence "
    "reason citing the evidence. Then stop.\n"
)

TOOLS = [
    {"type": "function", "function": {
        "name": "get_transcript",
        "description": "Full evidence messages of the issue, chronological.",
        "parameters": {"type": "object", "properties": {
            "issue_id": {"type": "string"}}, "required": ["issue_id"]}}},
    {"type": "function", "function": {
        "name": "get_channel_recent",
        "description": "Messages in the same channel AFTER this issue's last "
                       "evidence message — to detect a later follow-up or reopen.",
        "parameters": {"type": "object", "properties": {
            "issue_id": {"type": "string"},
            "limit": {"type": "integer"}}, "required": ["issue_id"]}}},
    {"type": "function", "function": {
        "name": "set_verdict",
        "description": "Record the closure judgment for the issue and stop.",
        "parameters": {"type": "object", "properties": {
            "issue_id": {"type": "string"},
            "state": {"type": "string",
                      "enum": sorted(WRITABLE_STATES)},
            "reason": {"type": "string"}},
            "required": ["issue_id", "state", "reason"]}}},
]


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------

def _conn():
    c = psycopg2.connect(DATABASE_URL)
    c.autocommit = False
    return c


def fetch_pending(conn, limit: int) -> list[dict]:
    """Issues worth (re)judging: unreviewed, not terminal, active since the
    time floor. Skip ones the agent already judged unless they have newer
    activity than the last agent verdict."""
    floor = f"AND i.last_activity_at >= '{TIME_FLOOR}'" if TIME_FLOOR else ""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"""SELECT i.id::text AS id, i.code, i.title, i.lifecycle_state,
                       (i.metadata->>'summary') AS summary,
                       i.customer_platform, i.customer_workspace_id, i.customer_channel_id,
                       i.last_activity_at
                FROM {SCHEMA}.issues i
                WHERE i.review_state = 'unreviewed'
                  AND i.lifecycle_state NOT IN ('closed_confirmed','dismissed')
                  {floor}
                  AND NOT EXISTS (
                    SELECT 1 FROM {SCHEMA}.issue_signals s
                    WHERE s.issue_id = i.id AND s.evaluator = 'closure-agent'
                      AND s.evaluated_at >= i.last_activity_at)
                ORDER BY i.last_activity_at DESC
                LIMIT %s""",
            (limit,),
        )
        return [dict(r) for r in cur.fetchall()]


def tool_get_transcript(conn, issue_id: str) -> dict:
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"""SELECT am.sender_name, am.sender_id, am.ts, am.text
                FROM {SCHEMA}.issue_messages im
                JOIN agent.messages am ON am.platform=im.platform
                  AND am.workspace_id=im.workspace_id AND am.channel_id=im.channel_id
                  AND am.message_id=im.message_id
                WHERE im.issue_id = %s AND am.ts IS NOT NULL
                ORDER BY am.ts""",
            (issue_id,),
        )
        rows = cur.fetchall()
    msgs = [{"sender": r["sender_name"] or r["sender_id"] or "?",
             "ts": r["ts"].strftime("%Y-%m-%d %H:%M") if r["ts"] else None,
             "text": (r["text"] or "")[:500]} for r in rows]
    return {"issue_id": issue_id, "message_count": len(msgs), "messages": msgs}


def tool_get_channel_recent(conn, issue_id: str, limit: int = 30) -> dict:
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"""SELECT customer_platform, customer_workspace_id, customer_channel_id,
                       last_activity_at
                FROM {SCHEMA}.issues WHERE id = %s""",
            (issue_id,),
        )
        iss = cur.fetchone()
        if not iss:
            return {"error": "issue not found"}
        cur.execute(
            """SELECT sender_name, sender_id, ts, text
               FROM agent.messages
               WHERE platform=%s AND workspace_id=%s AND channel_id=%s
                 AND ts > %s
               ORDER BY ts LIMIT %s""",
            (iss["customer_platform"], iss["customer_workspace_id"],
             iss["customer_channel_id"], iss["last_activity_at"], limit),
        )
        rows = cur.fetchall()
    return {"issue_id": issue_id, "newer_message_count": len(rows),
            "messages": [{"sender": r["sender_name"] or r["sender_id"] or "?",
                          "ts": r["ts"].strftime("%Y-%m-%d %H:%M") if r["ts"] else None,
                          "text": (r["text"] or "")[:400]} for r in rows]}


def tool_set_verdict(conn, issue_id: str, state: str, reason: str,
                     usage: dict) -> dict:
    if state not in WRITABLE_STATES:
        return {"error": f"state must be one of {sorted(WRITABLE_STATES)}"}
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"""SELECT lifecycle_state, review_state FROM {SCHEMA}.issues WHERE id=%s""",
            (issue_id,),
        )
        cur_row = cur.fetchone()
        if not cur_row:
            return {"error": "issue not found"}
        if cur_row["review_state"] != "unreviewed":
            return {"error": "issue already human-reviewed; not touching"}
        if DRY_RUN:
            return {"ok": True, "dry_run": True, "would_set": state}
        old_state = cur_row["lifecycle_state"]
        nc = "unanswered_customer" if state == "awaiting_agent" else None
        cur.execute(
            f"""UPDATE {SCHEMA}.issues
                SET lifecycle_state=%s, nonclosure_reason=%s,
                    closure_reason = CASE WHEN %s='closed_inferred'
                      THEN COALESCE(closure_reason,'agent_judged') ELSE closure_reason END,
                    closure_detected_at = CASE WHEN %s='closed_inferred'
                      AND closure_detected_at IS NULL THEN now() ELSE closure_detected_at END
                WHERE id=%s AND review_state='unreviewed'""",
            (state, nc, state, state, issue_id),
        )
        # audit row
        cur.execute(
            f"""INSERT INTO {SCHEMA}.issue_signals
                  (issue_id, evaluator, verdict, signals, cost_micros)
                VALUES (%s, 'closure-agent', %s, %s, %s)""",
            (issue_id,
             "likely_closed" if state == "closed_inferred"
             else ("likely_open" if state in ("awaiting_agent", "reopened") else "uncertain"),
             psycopg2.extras.Json({"state": state, "reason": reason,
                                   "old_state": old_state, "model": MODEL,
                                   "prompt_tokens": usage.get("pt", 0),
                                   "completion_tokens": usage.get("ct", 0)}),
             usage.get("pt", 0) + usage.get("ct", 0)),
        )
        # history row
        cur.execute(
            f"""INSERT INTO {SCHEMA}.issue_history
                  (issue_id, field, old_value, new_value, actor_mxid)
                VALUES (%s, 'closure_agent', %s, %s, %s)""",
            (issue_id, psycopg2.extras.Json({"lifecycle_state": old_state}),
             psycopg2.extras.Json({"lifecycle_state": state, "reason": reason}),
             SYSTEM_ACTOR),
        )
    conn.commit()
    return {"ok": True, "set_state": state}


# ---------------------------------------------------------------------------
# Agent loop (one issue)
# ---------------------------------------------------------------------------

def _chat(messages: list[dict]) -> dict:
    resp = httpx.post(
        f"{BASE}/chat/completions",
        headers={"Authorization": f"Bearer {KEY}"},
        json={"model": MODEL, "messages": messages,
              "tools": TOOLS, "tool_choice": "auto",
              "temperature": 0, "max_tokens": 1024},
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def judge_issue(conn, issue: dict) -> dict:
    """Run the tool-use loop for ONE issue. Returns {verdict, reason, turns,
    pt, ct} or {error}."""
    iid = issue["id"]
    seed = (f"Judge this issue.\n"
            f"id: {iid}\ncode: {issue.get('code')}\n"
            f"title: {issue.get('title')}\n"
            f"current_state: {issue.get('lifecycle_state')}\n"
            f"summary: {issue.get('summary')}\n\n"
            f"Read the transcript first, then decide and call set_verdict.")
    messages = [{"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": seed}]
    pt = ct = 0
    for turn in range(MAX_TOOL_TURNS):
        try:
            data = _chat(messages)
        except Exception as exc:
            return {"error": f"chat_failed:{type(exc).__name__}", "pt": pt, "ct": ct}
        u = data.get("usage") or {}
        pt += int(u.get("prompt_tokens", 0) or 0)
        ct += int(u.get("completion_tokens", 0) or 0)
        msg = data["choices"][0]["message"]
        calls = msg.get("tool_calls") or []
        if not calls:
            # model answered without a tool call — treat as no verdict
            return {"error": "no_tool_call", "pt": pt, "ct": ct,
                    "text": (msg.get("content") or "")[:200]}
        # append assistant turn
        messages.append({"role": "assistant", "content": msg.get("content") or "",
                         "tool_calls": calls})
        for call in calls:
            fn = call["function"]["name"]
            try:
                args = json.loads(call["function"]["arguments"] or "{}")
            except json.JSONDecodeError:
                args = {}
            if fn == "get_transcript":
                result = tool_get_transcript(conn, iid)
            elif fn == "get_channel_recent":
                result = tool_get_channel_recent(conn, iid, int(args.get("limit", 30)))
            elif fn == "set_verdict":
                result = tool_set_verdict(conn, iid, args.get("state", ""),
                                          args.get("reason", ""),
                                          {"pt": pt, "ct": ct})
                if result.get("ok"):
                    return {"verdict": args.get("state"), "reason": args.get("reason"),
                            "turns": turn + 1, "pt": pt, "ct": ct}
                # verdict rejected (bad state / reviewed) — feed error back
            else:
                result = {"error": f"unknown tool {fn}"}
            messages.append({"role": "tool", "tool_call_id": call["id"],
                             "content": json.dumps(result, ensure_ascii=False)})
    return {"error": "max_turns_exhausted", "pt": pt, "ct": ct}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    if not (BASE and KEY and MODEL):
        print("LLM not configured (ISSUE_LLM_BASE_URL/API_KEY/MODEL)", file=sys.stderr)
        return 1
    conn = _conn()
    pending = fetch_pending(conn, PER_RUN_ISSUE_CAP)
    print(f"closure-agent: {len(pending)} pending issues  "
          f"model={MODEL}  {'DRY-RUN' if DRY_RUN else 'APPLY'}")
    counts: dict[str, int] = {}
    tot_pt = tot_ct = 0
    for i, issue in enumerate(pending, 1):
        res = judge_issue(conn, issue)
        tot_pt += res.get("pt", 0); tot_ct += res.get("ct", 0)
        if res.get("verdict"):
            v = res["verdict"]; counts[v] = counts.get(v, 0) + 1
            print(f"  [{i:3d}/{len(pending)}] {issue['code']:>10s} "
                  f"{issue['lifecycle_state']:>16s} -> {v:16s}  {res['reason'][:70]}")
        else:
            counts["_err"] = counts.get("_err", 0) + 1
            print(f"  [{i:3d}/{len(pending)}] {issue['code']:>10s} "
                  f"ERROR: {res.get('error')}")
        time.sleep(0.1)
    print(f"\n=== verdicts: {dict(counts)}  tokens: {tot_pt}+{tot_ct} ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
