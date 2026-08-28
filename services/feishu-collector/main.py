"""Feishu internal-group message collector — long-connection (WebSocket) mode.

`support` uses Slack/Discord for external customer chat; our staff also discuss
each customer in an internal Feishu group. This service captures those internal
messages so they can be analysed alongside the external chat.

Uses the Feishu long-connection client (lark_oapi.ws.Client) exactly like
openclaw's feishu-claw does — the bot dials OUT to the Feishu gateway and events
are pushed down that socket. No public HTTPS callback, no open port, no webhook.
So it works from behind NAT / inside restricted networks; the app only needs the
event subscribed and delivery set to "long connection" in the Feishu console.

Capture-only: every im.message.receive_v1 is deduped on message_id and stored
into feishu.messages (raw event kept for re-parse). It never replies. Not wired
into distill yet.

Env:
  FEISHU_APP_ID / FEISHU_APP_SECRET   the app pulled into the internal groups
  DATABASE_URL                        Postgres (same DB as the engine)
"""
import json
import os
import sys

import psycopg2
import lark_oapi as lark
from lark_oapi.api.im.v1 import P2ImMessageReceiveV1

APP_ID = os.environ["FEISHU_APP_ID"]
APP_SECRET = os.environ["FEISHU_APP_SECRET"]
DATABASE_URL = os.environ["DATABASE_URL"]

_conn = None


def log(msg: str) -> None:
    print(f"[feishu-collector] {msg}", flush=True)


def _pg():
    global _conn
    if _conn is None or _conn.closed:
        _conn = psycopg2.connect(DATABASE_URL)
        _conn.autocommit = True
    return _conn


def _extract_text(msg_type: str, content_raw: str) -> str:
    """Best-effort plain text from a Feishu message content JSON string."""
    try:
        c = json.loads(content_raw) if content_raw else {}
    except Exception:
        return ""
    if msg_type == "text":
        return (c.get("text") or "").strip()
    if msg_type == "post":
        out, blocks = [], c.get("content")
        if blocks is None and c:  # wrapped by language e.g. {"zh_cn":{...}}
            first = next(iter(c.values()), {})
            out.append(first.get("title") or "")
            blocks = first.get("content")
        for line in (blocks or []):
            for seg in (line or []):
                if isinstance(seg, dict) and seg.get("text"):
                    out.append(seg["text"])
        return " ".join(t for t in out if t).strip()
    return ""


def on_message(data: P2ImMessageReceiveV1) -> None:
    try:
        ev = data.event
        msg = ev.message
        sender = ev.sender
        message_id = msg.message_id
        if not message_id:
            return
        sid = getattr(sender, "sender_id", None)
        sender_open = (getattr(sid, "open_id", None) or getattr(sid, "union_id", None)
                       or getattr(sid, "user_id", None)) if sid else None
        create_ms = msg.create_time  # string ms epoch
        try:
            create_ts = int(create_ms) / 1000.0 if create_ms else None
        except (TypeError, ValueError):
            create_ts = None
        text = _extract_text(msg.message_type or "", msg.content or "")
        # lark models serialise to dict for the raw column
        raw = lark.JSON.marshal(data) if hasattr(lark, "JSON") else json.dumps(
            {"message_id": message_id}, ensure_ascii=False)
        with _pg().cursor() as cur:
            cur.execute(
                """INSERT INTO feishu.messages
                     (message_id, chat_id, chat_type, sender_id, sender_type,
                      msg_type, text, create_time, raw, received_at)
                   VALUES (%s,%s,%s,%s,%s,%s,%s, to_timestamp(%s), %s, now())
                   ON CONFLICT (message_id) DO NOTHING""",
                (message_id, msg.chat_id, msg.chat_type, sender_open,
                 getattr(sender, "sender_type", None), msg.message_type, text,
                 create_ts, raw),
            )
        log(f"stored {message_id} chat={msg.chat_id} type={msg.message_type} "
            f"text={text[:40]!r}")
    except Exception as exc:
        log(f"ERROR handling message: {exc}")


def main() -> None:
    handler = (
        lark.EventDispatcherHandler.builder("", "")
        .register_p2_im_message_receive_v1(on_message)
        .build()
    )
    client = lark.ws.Client(APP_ID, APP_SECRET, event_handler=handler,
                            log_level=lark.LogLevel.INFO)
    log(f"starting long-connection for app {APP_ID[:12]}… (capture-only)")
    client.start()  # blocks forever, auto-reconnects


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(0)
