#!/usr/bin/env python3
"""PixDesk Sender — polls agent.replies and delivers via Matrix API."""

import json
import os
import sys
import time
import urllib.request
import urllib.error

HOMESERVER = os.environ.get("MATRIX_HOMESERVER", "http://synapse:8008")
USER_ID = os.environ.get("MATRIX_USER_ID", "@agent:localhost")
ACCESS_TOKEN = os.environ["MATRIX_ACCESS_TOKEN"]
DATABASE_URL = os.environ["DATABASE_URL"]
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL_SECONDS", "2"))

import psycopg2
import psycopg2.extras


def matrix_send(room_id, text, reply_to_event_id=None):
    """Send a message to a Matrix room. Returns the event_id."""
    url = HOMESERVER + f"/_matrix/client/v3/rooms/{urllib.parse.quote(room_id)}/send/m.room.message/{int(time.time()*1000)}"
    url += f"?access_token={ACCESS_TOKEN}"

    body = {"msgtype": "m.text", "body": text}
    if reply_to_event_id:
        body["m.relates_to"] = {
            "m.in_reply_to": {"event_id": reply_to_event_id}
        }

    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method="PUT")
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read().decode())
    return result.get("event_id")


def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    return conn


def process_pending_replies(db):
    """Find pending replies and send them."""
    with db.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT id, matrix_room_id, reply_text, in_reply_to_message_id,
                   conversation_id, agent_id, platform
            FROM agent.replies
            WHERE status = 'pending'
            ORDER BY created_at
            LIMIT 10
        """)
        replies = cur.fetchall()

    for reply in replies:
        try:
            if not reply["matrix_room_id"]:
                raise ValueError("no matrix_room_id")

            event_id = matrix_send(
                reply["matrix_room_id"],
                reply["reply_text"],
                reply.get("in_reply_to_message_id"),
            )

            with db.cursor() as cur:
                cur.execute("""
                    UPDATE agent.replies
                    SET status = 'sent', matrix_event_id = %s, sent_at = now()
                    WHERE id = %s
                """, (event_id, reply["id"]))

                cur.execute("""
                    INSERT INTO agent.team_actions
                      (actor_mxid, action, conversation_id, message_id, details)
                    VALUES (%s, 'reply', %s, %s, %s)
                """, (
                    USER_ID,
                    reply["conversation_id"],
                    event_id,
                    json.dumps({"agent_id": reply["agent_id"], "reply_type": "auto"}),
                ))

            print(f"sent reply {reply['id']} -> {event_id}", flush=True)

        except Exception as e:
            error_msg = str(e)
            print(f"reply {reply['id']} failed: {error_msg}", file=sys.stderr, flush=True)
            with db.cursor() as cur:
                cur.execute("""
                    UPDATE agent.replies SET status = 'failed', error = %s
                    WHERE id = %s
                """, (error_msg, reply["id"]))

    return len(replies)


def run():
    db = get_db()
    print(f"sender started, user={USER_ID}", flush=True)

    while True:
        try:
            count = process_pending_replies(db)
            if count == 0:
                time.sleep(POLL_INTERVAL)
        except Exception as e:
            print(f"sender error: {e}", file=sys.stderr, flush=True)
            time.sleep(5)
            try:
                db.close()
            except Exception:
                pass
            db = get_db()


if __name__ == "__main__":
    import urllib.parse
    run()
