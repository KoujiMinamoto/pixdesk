"""Proactive SLA alerts to Feishu.

When a customer's issue has been waiting on us longer than ALERT_SLA_MINUTES and
is still open, push an interactive card into the ops group and @-mention whoever
is on duty (from agent.shift_roster → issue_tc.roster_identity → Feishu open_id).

Dedup: issue_tc.sla_alert_log holds one row per (issue, 'sla'); sent_at is the
last push, so we re-alert only after ALERT_COOLDOWN_HOURS. Capped at
ALERT_MAX_PER_TICK cards per pass so a backlog can't flood the group.

Bootstrap: on the very first run (empty log) we DON'T fire a card per backlog
item. We send ONE summary card listing the outstanding items and silence them
(write them to the log as already-alerted). From then on each newly-breaching
issue gets its own realtime card.

The group lead (蝙蝠侠) is intentionally NOT escalated to — silent for now.
"""
from __future__ import annotations

import logging
import threading
import time
from typing import Any, Optional

import httpx
import psycopg2.extras

import config
from config import SCHEMA, TIME_FLOOR

log = logging.getLogger("issue.alerts")

_FEISHU = "https://open.feishu.cn/open-apis"
TIME_FLOOR_ALIAS = f"i.last_activity_at >= '{TIME_FLOOR}'" if TIME_FLOOR else "TRUE"

# --- Feishu send -----------------------------------------------------------

_token: dict[str, Any] = {"value": None, "exp": 0.0}


def _tenant_token() -> Optional[str]:
    """tenant_access_token, cached until ~2min before Feishu's expiry."""
    now = time.time()
    if _token["value"] and now < _token["exp"]:
        return _token["value"]
    if not config.FEISHU_APP_ID or not config.FEISHU_APP_SECRET:
        log.warning("alerts: no Feishu creds — cannot send")
        return None
    r = httpx.post(
        f"{_FEISHU}/auth/v3/tenant_access_token/internal",
        json={"app_id": config.FEISHU_APP_ID,
              "app_secret": config.FEISHU_APP_SECRET},
        timeout=15,
    )
    d = r.json()
    if d.get("code") != 0:
        log.error("alerts: token fetch failed: %s", d)
        return None
    _token["value"] = d["tenant_access_token"]
    _token["exp"] = now + int(d.get("expire", 7200)) - 120
    return _token["value"]


def _send_card(chat_id: str, card: dict) -> bool:
    tok = _tenant_token()
    if not tok:
        return False
    r = httpx.post(
        f"{_FEISHU}/im/v1/messages",
        params={"receive_id_type": "chat_id"},
        headers={"Authorization": f"Bearer {tok}"},
        json={"receive_id": chat_id, "msg_type": "interactive",
              "content": _json(card)},
        timeout=15,
    )
    d = r.json()
    if d.get("code") != 0:
        log.error("alerts: send failed: %s", d)
        return False
    return True


def _json(obj: Any) -> str:
    import json
    return json.dumps(obj, ensure_ascii=False)


# --- roster / on-duty ------------------------------------------------------

def _on_duty(conn) -> tuple[Optional[str], Optional[str]]:
    """(person, open_id) currently on shift, or (None, None). If the person has
    no roster_identity row we still return their name so the card can name them
    in plain text (no @, but still actionable)."""
    with conn.cursor() as cur:
        cur.execute(
            """SELECT r.person, ri.feishu_user_id
                 FROM agent.shift_roster r
                 LEFT JOIN issue_tc.roster_identity ri ON ri.person = r.person
                WHERE now() >= r.start_ts AND now() < r.end_ts
                ORDER BY r.start_ts DESC LIMIT 1"""
        )
        row = cur.fetchone()
    if not row:
        return None, None
    return row[0], row[1]


def _mention(person: Optional[str], open_id: Optional[str]) -> str:
    """lark_md mention: real @ when we have an open_id, else bold name."""
    if open_id:
        return f"<at id={open_id}></at>"
    if person:
        return f"**@{person}**"
    return "**@当班同事**"


# --- eligible issues -------------------------------------------------------

def _eligible(conn, min_wait_minutes: Optional[int] = None,
              max_wait_days: Optional[int] = None) -> list[dict]:
    """Open issues where the ball is in our court (nonclosure_reason=
    'unanswered_customer') and the customer has waited > min_wait_minutes.
    Defaults to the SLA threshold; the handoff digest passes 0 to include every
    open unanswered issue regardless of wait. When max_wait_days is set (> 0),
    issues the customer has been waiting on for longer than that are excluded —
    realtime SLA alerts stop nagging on stale issues (they belong in dashboard
    manual review); the handoff digest passes None so a handover still lists
    them. Stalest-first (last_customer_at ASC). Carries the last alert time so
    run() can apply the cooldown."""
    if min_wait_minutes is None:
        min_wait_minutes = config.ALERT_SLA_MINUTES
    params: list[Any] = [min_wait_minutes]
    max_clause = ""
    if max_wait_days and max_wait_days > 0:
        max_clause = "AND i.last_customer_at >= now() - (%s * interval '1 day')"
        params.append(max_wait_days)
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"""
            SELECT i.id, i.code, i.title,
                   i.customer_platform, i.customer_workspace_id,
                   i.customer_channel_id, i.external_party_name,
                   i.last_customer_at,
                   EXTRACT(EPOCH FROM (now() - i.last_customer_at)) / 60.0
                       AS wait_min,
                   ch.channel_name,
                   i.metadata->>'summary_zh'     AS summary_zh,
                   i.metadata->>'next_action_zh' AS next_action_zh,
                   (SELECT im.message_id FROM {SCHEMA}.issue_messages im
                     WHERE im.issue_id = i.id AND im.is_segment_start
                     ORDER BY im.ts ASC LIMIT 1) AS opening_msg,
                   -- Slack /thread/ links must anchor at the thread ROOT; a
                   -- reply's ts shows "Couldn't load thread" (same fix as
                   -- main._chat_deeplink).
                   (SELECT am.thread_id FROM {SCHEMA}.issue_messages im2
                      JOIN agent.messages am
                        ON am.platform = im2.platform
                       AND am.workspace_id = im2.workspace_id
                       AND am.channel_id = im2.channel_id
                       AND am.message_id = im2.message_id
                     WHERE im2.issue_id = i.id AND im2.is_segment_start
                     ORDER BY im2.ts ASC LIMIT 1) AS opening_thread,
                   -- 重点客户 tier (L5/L6/L7); NULL for regular customers.
                   (SELECT ka.level
                      FROM {SCHEMA}.key_account_channels kac
                      JOIN {SCHEMA}.key_accounts ka ON ka.uuid = kac.uuid
                     WHERE kac.platform = i.customer_platform
                       AND kac.workspace_id = i.customer_workspace_id
                       AND kac.channel_id = i.customer_channel_id
                     ORDER BY ka.level DESC LIMIT 1) AS tier,
                   a.sent_at AS last_alert_at
            FROM {SCHEMA}.issues i
            LEFT JOIN agent.channels ch
              ON ch.platform = i.customer_platform
             AND ch.workspace_id = i.customer_workspace_id
             AND ch.channel_id = i.customer_channel_id
            LEFT JOIN {SCHEMA}.sla_alert_log a
              ON a.issue_id = i.id AND a.alert_type = 'sla'
            WHERE i.nonclosure_reason = 'unanswered_customer'
              AND i.review_state <> 'rejected'
              AND i.lifecycle_state NOT IN ('closed_confirmed','dismissed')
              AND {TIME_FLOOR_ALIAS}
              AND i.last_customer_at IS NOT NULL
              AND i.last_customer_at <= now() - (%s * interval '1 minute')
              {max_clause}
            ORDER BY i.last_customer_at ASC
            """,
            params,
        )
        return [dict(r) for r in cur.fetchall()]


def _deeplink(row: dict) -> Optional[str]:
    """Same anchoring as main._chat_deeplink but from a flat eligible row."""
    plat = row.get("customer_platform")
    ws = row.get("customer_workspace_id")
    chan = row.get("customer_channel_id")
    msg = row.get("opening_msg")
    if not plat or not chan:
        return None
    if plat == "slack":
        if not ws:
            return None
        base = f"https://app.slack.com/client/{ws}/{chan}"
        root = row.get("opening_thread") or msg
        return f"{base}/thread/{chan}-{root}" if root else base
    if plat == "discord":
        base = f"https://discord.com/channels/@me/{chan}"
        return f"{base}/{msg}" if msg else base
    return None


def _cust_name(row: dict) -> str:
    return (row.get("channel_name") or row.get("external_party_name")
            or row.get("customer_channel_id") or "未知客户")


def _fmt_wait(minutes: float) -> str:
    m = int(minutes or 0)
    if m < 60:
        return f"{m} 分钟"
    h, mm = divmod(m, 60)
    if h < 24:
        return f"{h} 小时{mm} 分" if mm else f"{h} 小时"
    d, hh = divmod(h, 24)
    return f"{d} 天{hh} 小时" if hh else f"{d} 天"


# --- cards -----------------------------------------------------------------

_TIER_NAME = {"L7": "白金", "L6": "金", "L5": "银"}


def _tier_tag(row: dict) -> str:
    """'⭐L7 ' prefix for key accounts (重点客户), empty otherwise."""
    t = row.get("tier")
    return f"⭐{t} " if t else ""


def _key_first(rows: list[dict]) -> list[dict]:
    """重点客户置顶: tier desc (L7 > L6 > L5 > none), stalest-first within each
    tier — the digest's stalest-first ordering is preserved inside groups."""
    def k(r):
        t = r.get("tier") or ""
        lvl = int(t[1:]) if t.startswith("L") and t[1:].isdigit() else 0
        return (-lvl, r.get("last_customer_at"))
    return sorted(rows, key=k)


def _item_line(row: dict) -> str:
    cust = _cust_name(row)
    zh = (row.get("summary_zh") or row.get("title") or "").strip()
    todo = (row.get("next_action_zh") or "").strip()
    wait = _fmt_wait(row.get("wait_min"))
    link = _deeplink(row)
    head = f"{_tier_tag(row)}**{cust}** · 等待 {wait} · `{row['code']}`"
    if link:
        head += f" · [打开对话]({link})"
    parts = [head]
    if zh:
        parts.append(f"　{zh}")
    if todo:
        parts.append(f"　🔧 TODO：{todo}")
    return "\n".join(parts)


def _single_card(row: dict, person, open_id) -> dict:
    tier = row.get("tier")
    head = f"⏰ 超时未回复 · {_fmt_wait(row.get('wait_min'))}"
    if tier:
        head += f" · ⭐{tier}重点客户（{_TIER_NAME.get(tier, '')}）"
    return {
        "config": {"wide_screen_mode": True},
        "header": {"template": "red" if tier else "orange",
                   "title": {"tag": "plain_text", "content": head}},
        "elements": [
            {"tag": "div", "text": {"tag": "lark_md", "content": _item_line(row)}},
            {"tag": "hr"},
            {"tag": "div", "text": {"tag": "lark_md",
                                    "content": f"{_mention(person, open_id)} 请跟进"}},
        ],
    }


_SUMMARY_SHOW_MAX = 20


def _digest_card(rows: list[dict], person, open_id, *, title: str, intro: str,
                 template: str, rest_note: str) -> dict:
    """Shared multi-item card (bootstrap backlog + shift handoff). Shows the
    stalest _SUMMARY_SHOW_MAX (rows already stalest-first) and notes the
    remainder. Empty rows → a clean ✅ line so a handoff still confirms 'nothing
    pending' rather than sending a blank card."""
    shown = rows[:_SUMMARY_SHOW_MAX]
    body = ("\n\n").join(_item_line(r) for r in shown) if shown \
        else "✅ 当前没有等待我方回复的未闭环客户。"
    elements = [
        {"tag": "div", "text": {"tag": "lark_md",
                                "content": f"{_mention(person, open_id)} {intro}"}},
        {"tag": "hr"},
        {"tag": "div", "text": {"tag": "lark_md", "content": body}},
    ]
    if len(rows) > len(shown):
        elements.append({"tag": "div", "text": {"tag": "lark_md",
            "content": rest_note.format(rest=len(rows) - len(shown))}})
    return {
        "config": {"wide_screen_mode": True},
        "header": {"template": template,
                   "title": {"tag": "plain_text", "content": title}},
        "elements": elements,
    }


def _summary_card(rows: list[dict], person, open_id) -> dict:
    """Bootstrap/backlog digest — the whole backlog is silenced by the caller."""
    return _digest_card(
        rows, person, open_id,
        title=f"📋 待回复客户汇总 · 共 {len(rows)} 条",
        intro="以下客户仍在等待我方回复：",
        template="red",
        rest_note="…以及其余 {rest} 条（已记录，稍后按实时单条逐个跟进）")


def _handoff_card(rows: list[dict], person, open_id, shift_name: str) -> dict:
    """Shift-handoff digest — @the person who just came on duty. 重点客户置顶
    (tier desc), then stalest-first within each tier."""
    rows = _key_first(rows)
    tail = f" · {shift_name}" if shift_name else ""
    n_key = sum(1 for r in rows if r.get("tier"))
    key_note = f"（含 ⭐重点客户 {n_key} 条，已置顶）" if n_key else ""
    return _digest_card(
        rows, person, open_id,
        title=f"🔄 接班简报{tail} · 共 {len(rows)} 条待跟进",
        intro=f"你已接班，以下客户仍未闭环、等待我方跟进{key_note}：",
        template="blue",
        rest_note="…以及其余 {rest} 条（完整清单见看板 · 班次复盘）")


# --- log -------------------------------------------------------------------

def _record(conn, rows: list[dict], person: Optional[str]) -> None:
    """Upsert sla_alert_log for the given rows, bumping sent_at to now."""
    if not rows:
        return
    with conn.cursor() as cur:
        for r in rows:
            cur.execute(
                f"""INSERT INTO {SCHEMA}.sla_alert_log
                        (issue_id, alert_type, sent_at, on_duty, wait_minutes)
                    VALUES (%s::uuid, 'sla', now(), %s, %s)
                    ON CONFLICT (issue_id, alert_type)
                    DO UPDATE SET sent_at = now(), on_duty = EXCLUDED.on_duty,
                                  wait_minutes = EXCLUDED.wait_minutes""",
                (r["id"], person, int(r.get("wait_min") or 0)),
            )
    conn.commit()


def _log_is_empty(conn) -> bool:
    with conn.cursor() as cur:
        cur.execute(f"SELECT 1 FROM {SCHEMA}.sla_alert_log LIMIT 1")
        return cur.fetchone() is None


# --- tick ------------------------------------------------------------------

def run(conn) -> dict:
    """One alert pass. Returns a small dict for logging."""
    if not config.ALERT_ENABLED:
        return {"skipped": "disabled"}
    if not config.ALERT_CHAT_ID:
        return {"skipped": "no_chat_id"}

    person, open_id = _on_duty(conn)
    rows = _eligible(conn, max_wait_days=config.ALERT_MAX_WAIT_DAYS)
    if not rows:
        return {"eligible": 0, "sent": 0}

    # Bootstrap: first ever run — one summary card, silence the rest.
    if _log_is_empty(conn):
        ok = _send_card(config.ALERT_CHAT_ID,
                        _summary_card(rows, person, open_id))
        if ok:
            _record(conn, rows, person)
        return {"bootstrap": True, "eligible": len(rows),
                "summarized": len(rows) if ok else 0, "on_duty": person}

    # Realtime: a card fires for an issue that has NEVER been alerted (a newly
    # breaching problem). An already-alerted issue is only RE-pushed if the
    # customer has spoken again since our last alert (they're still waiting) AND
    # the cooldown has passed — so silenced backlog the customer hasn't chased
    # never gets re-@'d, but a live "还在等" thread isn't dropped. Capped per tick.
    cutoff_secs = config.ALERT_COOLDOWN_HOURS * 3600
    now_ts = time.time()
    due = []
    for r in rows:
        last = r.get("last_alert_at")
        if last is None:
            due.append(r)
            continue
        lca = r.get("last_customer_at")
        if (lca and lca.timestamp() > last.timestamp()
                and (now_ts - last.timestamp()) >= cutoff_secs):
            due.append(r)
    due = due[: config.ALERT_MAX_PER_TICK]
    sent = []
    for r in due:
        if _send_card(config.ALERT_CHAT_ID, _single_card(r, person, open_id)):
            sent.append(r)
    _record(conn, sent, person)
    return {"eligible": len(rows), "due": len(due), "sent": len(sent),
            "on_duty": person}


# --- shift handoff ---------------------------------------------------------

def _handoff_due(conn) -> Optional[dict]:
    """The shift that just started (now within ALERT_HANDOFF_WINDOW_MINUTES of
    its start_ts) and hasn't had a handoff digest sent yet, or None. Joins the
    incoming person's Feishu open_id so run_handoff can @ them."""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """SELECT r.start_ts, r.end_ts, r.person, r.shift_name,
                      ri.feishu_user_id
                 FROM agent.shift_roster r
                 LEFT JOIN issue_tc.roster_identity ri ON ri.person = r.person
                 LEFT JOIN issue_tc.handoff_log h
                        ON h.shift_start = r.start_ts AND h.person = r.person
                WHERE now() >= r.start_ts
                  AND now() < r.start_ts + (%s * interval '1 minute')
                  AND h.shift_start IS NULL
                ORDER BY r.start_ts DESC LIMIT 1""",
            (config.ALERT_HANDOFF_WINDOW_MINUTES,),
        )
        row = cur.fetchone()
    return dict(row) if row else None


def _record_handoff(conn, shift_start, person: str, count: int) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """INSERT INTO issue_tc.handoff_log
                   (shift_start, person, sent_at, issue_count)
               VALUES (%s, %s, now(), %s)
               ON CONFLICT (shift_start, person)
               DO UPDATE SET sent_at = now(), issue_count = EXCLUDED.issue_count""",
            (shift_start, person, count),
        )
    conn.commit()


def run_handoff(conn) -> dict:
    """Once per shift, near its start, @-mention the incoming person with every
    still-open unanswered issue they're inheriting (no SLA threshold — full
    handover). Deduped via handoff_log so a shift gets exactly one digest."""
    if not config.ALERT_ENABLED or not config.ALERT_CHAT_ID:
        return {"skipped": "disabled"}
    due = _handoff_due(conn)
    if not due:
        return {"handoff": 0}
    person = due["person"]
    oid = due.get("feishu_user_id")
    shift = due.get("shift_name") or ""
    rows = _eligible(conn, min_wait_minutes=0)
    ok = _send_card(config.ALERT_CHAT_ID,
                    _handoff_card(rows, person, oid, shift))
    if ok:
        # Record even on an empty backlog, so we don't re-check this shift.
        _record_handoff(conn, due["start_ts"], person, len(rows))
    return {"handoff": 1, "person": person, "shift": shift,
            "issues": len(rows), "sent": ok}
