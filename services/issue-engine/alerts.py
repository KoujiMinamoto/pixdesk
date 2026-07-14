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

def _eligible(conn) -> list[dict]:
    """Open issues where the ball is in our court (nonclosure_reason=
    'unanswered_customer') and the customer has waited > SLA. Newest-waiting
    first is least urgent, so order by last_customer_at ASC (stalest first).
    Carries the last alert time so run() can apply the cooldown."""
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
            ORDER BY i.last_customer_at ASC
            """,
            (config.ALERT_SLA_MINUTES,),
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
        return f"{base}/thread/{chan}-{msg}" if msg else base
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

def _item_line(row: dict) -> str:
    cust = _cust_name(row)
    zh = (row.get("summary_zh") or row.get("title") or "").strip()
    todo = (row.get("next_action_zh") or "").strip()
    wait = _fmt_wait(row.get("wait_min"))
    link = _deeplink(row)
    head = f"**{cust}** · 等待 {wait} · `{row['code']}`"
    if link:
        head += f" · [打开对话]({link})"
    parts = [head]
    if zh:
        parts.append(f"　{zh}")
    if todo:
        parts.append(f"　🔧 TODO：{todo}")
    return "\n".join(parts)


def _single_card(row: dict, person, open_id) -> dict:
    return {
        "config": {"wide_screen_mode": True},
        "header": {"template": "orange",
                   "title": {"tag": "plain_text",
                             "content": f"⏰ 超时未回复 · {_fmt_wait(row.get('wait_min'))}"}},
        "elements": [
            {"tag": "div", "text": {"tag": "lark_md", "content": _item_line(row)}},
            {"tag": "hr"},
            {"tag": "div", "text": {"tag": "lark_md",
                                    "content": f"{_mention(person, open_id)} 请跟进"}},
        ],
    }


_SUMMARY_SHOW_MAX = 20


def _summary_card(rows: list[dict], person, open_id) -> dict:
    """Digest card for the bootstrap/backlog. Shows the stalest _SUMMARY_SHOW_MAX
    (rows are already stalest-first) and notes the remainder — the whole backlog
    is silenced by the caller regardless of what's shown."""
    shown = rows[:_SUMMARY_SHOW_MAX]
    body = ("\n\n").join(_item_line(r) for r in shown)
    elements = [
        {"tag": "div", "text": {"tag": "lark_md",
                                "content": f"{_mention(person, open_id)} 以下客户仍在等待我方回复："}},
        {"tag": "hr"},
        {"tag": "div", "text": {"tag": "lark_md", "content": body}},
    ]
    if len(rows) > len(shown):
        rest = len(rows) - len(shown)
        elements.append({"tag": "div", "text": {"tag": "lark_md",
            "content": f"…以及其余 {rest} 条（已记录，稍后按实时单条逐个跟进）"}})
    return {
        "config": {"wide_screen_mode": True},
        "header": {"template": "red",
                   "title": {"tag": "plain_text",
                             "content": f"📋 待回复客户汇总 · 共 {len(rows)} 条"}},
        "elements": elements,
    }


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
                    VALUES (%s, 'sla', now(), %s, %s)
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
    rows = _eligible(conn)
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

    # Realtime: only issues past the cooldown (or never alerted), capped.
    cutoff_secs = config.ALERT_COOLDOWN_HOURS * 3600
    due = []
    for r in rows:
        last = r.get("last_alert_at")
        if last is None:
            due.append(r)
        else:
            age = time.time() - last.timestamp()
            if age >= cutoff_secs:
                due.append(r)
    due = due[: config.ALERT_MAX_PER_TICK]
    sent = []
    for r in due:
        if _send_card(config.ALERT_CHAT_ID, _single_card(r, person, open_id)):
            sent.append(r)
    _record(conn, sent, person)
    return {"eligible": len(rows), "due": len(due), "sent": len(sent),
            "on_duty": person}
