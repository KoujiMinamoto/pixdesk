"""One-shot historical backfill for the Feishu internal-group collector.

The long-connection listener (main.py) only receives NEW messages pushed after
it connected — it never sees history. This script walks every chat the app is a
member of (im/v1/chats) and pages through that chat's full history
(im/v1/messages, container_id_type=chat), extracting text the same way the live
listener does and writing into feishu.messages with the same dedup key
(ON CONFLICT (message_id) DO NOTHING), so it is idempotent and safe to re-run.

Only text/post carry usable content; interactive cards from OTHER apps (e.g. the
WO ticket bot) are not returned by the API and are simply absent here.

Run inside the collector container (has env + deps):
    docker cp backfill.py pixdesk-feishu-collector:/app/backfill.py
    docker exec pixdesk-feishu-collector python3 /app/backfill.py
"""
import os
import sys
import time

import psycopg2
import lark_oapi as lark
from lark_oapi.api.im.v1 import ListChatRequest, ListMessageRequest

# Reuse the live listener's text extraction + PG helpers so backfilled rows are
# byte-identical to what the long-connection path would have stored.
from main import _extract_text, _pg, log

APP_ID = os.environ["FEISHU_APP_ID"]
APP_SECRET = os.environ["FEISHU_APP_SECRET"]

_client = (
    lark.Client.builder().app_id(APP_ID).app_secret(APP_SECRET).build()
)


def _list_chats() -> list[tuple[str, str]]:
    """Return [(chat_id, name)] for every chat the app belongs to."""
    out, token = [], None
    while True:
        b = ListChatRequest.builder().page_size(100)
        if token:
            b = b.page_token(token)
        r = _client.im.v1.chat.list(b.build())
        if not r.success():
            log(f"chat.list failed: {r.code} {r.msg}")
            break
        d = r.data
        for it in (d.items or []):
            out.append((it.chat_id, it.name or ""))
        if not getattr(d, "has_more", False):
            break
        token = d.page_token
    return out


def _sender_open_id(sender) -> str | None:
    if not sender:
        return None
    sid = getattr(sender, "id", None)
    # Feishu list-message sender carries a flat id + id_type.
    return sid


def backfill_chat(chat_id: str, name: str) -> tuple[int, int]:
    """Page through one chat's full history. Returns (seen, inserted)."""
    token = None
    seen = inserted = 0
    while True:
        b = (ListMessageRequest.builder()
             .container_id_type("chat").container_id(chat_id).page_size(50))
        if token:
            b = b.page_token(token)
        r = _client.im.v1.message.list(b.build())
        if not r.success():
            log(f"message.list {chat_id} failed: {r.code} {r.msg}")
            break
        d = r.data
        rows = []
        for m in (d.items or []):
            seen += 1
            mid = m.message_id
            if not mid:
                continue
            msg_type = m.msg_type or ""
            content = m.body.content if m.body else ""
            text = _extract_text(msg_type, content or "")
            create_ms = m.create_time
            try:
                create_ts = int(create_ms) / 1000.0 if create_ms else None
            except (TypeError, ValueError):
                create_ts = None
            sender = getattr(m, "sender", None)
            raw = lark.JSON.marshal(m) if hasattr(lark, "JSON") else "{}"
            rows.append((
                mid, chat_id, "group", _sender_open_id(sender),
                getattr(sender, "sender_type", None) if sender else None,
                msg_type, text, create_ts, raw,
            ))
        if rows:
            with _pg().cursor() as cur:
                for row in rows:
                    cur.execute(
                        """INSERT INTO feishu.messages
                             (message_id, chat_id, chat_type, sender_id,
                              sender_type, msg_type, text, create_time, raw,
                              received_at)
                           VALUES (%s,%s,%s,%s,%s,%s,%s, to_timestamp(%s),
                                   %s, now())
                           ON CONFLICT (message_id) DO NOTHING""",
                        row,
                    )
                    inserted += cur.rowcount
        if not getattr(d, "has_more", False):
            break
        token = d.page_token
        time.sleep(0.2)  # be gentle on the im API
    return seen, inserted


def main() -> None:
    chats = _list_chats()
    log(f"backfill: {len(chats)} chats to walk")
    grand_seen = grand_ins = 0
    for chat_id, name in chats:
        seen, ins = backfill_chat(chat_id, name)
        grand_seen += seen
        grand_ins += ins
        log(f"backfill: {name!r} ({chat_id}) seen={seen} inserted={ins}")
    log(f"backfill DONE: total seen={grand_seen} inserted={grand_ins}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(0)
