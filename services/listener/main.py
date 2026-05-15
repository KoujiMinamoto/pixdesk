#!/usr/bin/env python3
"""PixDesk Listener — captures Matrix messages in real-time and fires webhooks."""

import hashlib
import hmac
import json
import os
import sys
import time
import urllib.parse
import urllib.request
import urllib.error

HOMESERVER = os.environ.get("MATRIX_HOMESERVER", "http://synapse:8008")
USER_ID = os.environ.get("MATRIX_USER_ID", "@agent:localhost")
ACCESS_TOKEN = os.environ["MATRIX_ACCESS_TOKEN"]
DATABASE_URL = os.environ["DATABASE_URL"]
SYNC_TIMEOUT = int(os.environ.get("SYNC_TIMEOUT_MS", "30000"))
STATE_FILE = os.environ.get("STATE_FILE", "/data/sync_token.txt")
CONVERSATION_GAP_SECONDS = int(os.environ.get("CONVERSATION_GAP_SECONDS", "1800"))

import psycopg2
import psycopg2.extras


def matrix_request(method, path, data=None):
    url = HOMESERVER + path
    sep = "&" if "?" in url else "?"
    url += f"{sep}access_token={ACCESS_TOKEN}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=SYNC_TIMEOUT // 1000 + 30) as resp:
        return json.loads(resp.read().decode())


def load_sync_token():
    try:
        with open(STATE_FILE) as f:
            return f.read().strip()
    except FileNotFoundError:
        return None


def save_sync_token(token):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    with open(STATE_FILE + ".tmp", "w") as f:
        f.write(token)
    os.replace(STATE_FILE + ".tmp", STATE_FILE)


def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    return conn


def detect_platform(room_id, sender, db):
    """Detect which platform a message came from based on the sender MXID."""
    if sender == USER_ID:
        return None
    localpart = sender.split(":")[0].lstrip("@")
    if localpart.startswith("discord_"):
        return "discord"
    if localpart.startswith("slack_"):
        return "slack"
    if localpart.startswith("telegram_"):
        return "telegram"
    return None


def find_or_create_conversation(db, platform, workspace_id, channel_id, thread_id, room_id):
    """Find an open conversation or create a new one based on time gap."""
    with db.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT id, last_activity_at FROM agent.conversations
            WHERE platform = %s AND workspace_id = %s AND channel_id = %s
              AND coalesce(thread_id, '') = coalesce(%s, '')
              AND status != 'resolved'
            ORDER BY last_activity_at DESC LIMIT 1
        """, (platform, workspace_id, channel_id, thread_id))
        row = cur.fetchone()

        if row:
            gap = (time.time() - row["last_activity_at"].timestamp())
            if gap < CONVERSATION_GAP_SECONDS:
                cur.execute("""
                    UPDATE agent.conversations SET last_activity_at = now()
                    WHERE id = %s
                """, (row["id"],))
                return str(row["id"])

        cur.execute("""
            INSERT INTO agent.conversations
              (platform, workspace_id, channel_id, thread_id, matrix_room_id)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (platform, workspace_id, channel_id, thread_id, room_id))
        return str(cur.fetchone()["id"])


def store_message(db, platform, room_id, event, conversation_id):
    """Store a message in agent.messages."""
    content = event.get("content", {})
    sender = event.get("sender", "")
    event_id = event.get("event_id", "")
    ts_ms = event.get("origin_server_ts", 0)
    ts_iso = time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime(ts_ms / 1000))
    text = content.get("body", "")
    msg_id = event_id

    localpart = sender.split(":")[0].lstrip("@")
    parts = localpart.split("_", 1)
    sender_name = parts[1] if len(parts) > 1 else localpart

    workspace_id = room_id
    channel_id = room_id

    with db.cursor() as cur:
        cur.execute("""
            INSERT INTO agent.messages
              (platform, workspace_id, channel_id, message_id, thread_id,
               sender_id, sender_name, text, ts, raw,
               status, conversation_id, matrix_event_id, matrix_room_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb,
                    'new', %s, %s, %s)
            ON CONFLICT (platform, workspace_id, channel_id, message_id) DO NOTHING
            RETURNING message_id
        """, (platform, workspace_id, channel_id, msg_id, None,
              sender, sender_name, text, ts_iso, json.dumps(event),
              conversation_id, event_id, room_id))
        return cur.fetchone() is not None


def fire_webhooks(db, event_type, payload):
    """Send webhook notifications to all matching endpoints."""
    with db.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT id, url, secret, filter_platforms, filter_channels
            FROM agent.webhook_config
            WHERE enabled = true AND %s = ANY(events)
        """, (event_type,))
        hooks = cur.fetchall()

    platform = payload.get("message", {}).get("platform")
    channel = payload.get("message", {}).get("channel_id")

    for hook in hooks:
        if hook["filter_platforms"] and platform not in hook["filter_platforms"]:
            continue
        if hook["filter_channels"] and channel not in hook["filter_channels"]:
            continue

        body = json.dumps(payload).encode()
        headers = {"Content-Type": "application/json"}
        if hook["secret"]:
            sig = hmac.HMAC(hook["secret"].encode(), body, hashlib.sha256).hexdigest()
            headers["X-Webhook-Signature"] = f"sha256={sig}"

        try:
            req = urllib.request.Request(hook["url"], data=body, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=10) as resp:
                status = resp.status
        except Exception as e:
            status = 0
            print(f"webhook {hook['id']} failed: {e}", file=sys.stderr, flush=True)


def process_event(db, room_id, event):
    """Process a single Matrix room event."""
    if event.get("type") != "m.room.message":
        return
    sender = event.get("sender", "")
    if sender == USER_ID:
        return

    platform = detect_platform(room_id, sender, db)
    if not platform:
        return

    conversation_id = find_or_create_conversation(
        db, platform, room_id, room_id, None, room_id
    )

    stored = store_message(db, platform, room_id, event, conversation_id)
    if not stored:
        return

    content = event.get("content", {})
    payload = {
        "event": "message.new",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "message": {
            "platform": platform,
            "workspace_id": room_id,
            "channel_id": room_id,
            "message_id": event.get("event_id"),
            "sender_name": content.get("displayname", sender),
            "text": content.get("body", ""),
            "matrix_room_id": room_id,
            "matrix_event_id": event.get("event_id"),
            "conversation_id": conversation_id,
        },
    }
    fire_webhooks(db, "message.new", payload)


def sync_loop():
    """Main /sync long-poll loop."""
    db = get_db()
    since = load_sync_token()
    print(f"listener started, user={USER_ID}, since={since}", flush=True)

    while True:
        try:
            params = {
                "timeout": str(SYNC_TIMEOUT),
                "filter": json.dumps({
                    "room": {
                        "timeline": {"limit": 50},
                        "state": {"lazy_load_members": True},
                    },
                    "presence": {"types": []},
                    "account_data": {"types": []},
                }),
            }
            if since:
                params["since"] = since

            resp = matrix_request("GET", "/_matrix/client/v3/sync?" + urllib.parse.urlencode(params))
            since = resp.get("next_batch")
            if since:
                save_sync_token(since)

            rooms = resp.get("rooms", {}).get("join", {})
            for room_id, room_data in rooms.items():
                events = room_data.get("timeline", {}).get("events", [])
                for event in events:
                    try:
                        process_event(db, room_id, event)
                    except Exception as e:
                        print(f"event error: {e}", file=sys.stderr, flush=True)

        except urllib.error.URLError as e:
            print(f"sync error: {e}", file=sys.stderr, flush=True)
            time.sleep(5)
        except Exception as e:
            print(f"unexpected error: {e}", file=sys.stderr, flush=True)
            time.sleep(5)
            try:
                db.close()
            except Exception:
                pass
            db = get_db()


if __name__ == "__main__":
    sync_loop()
