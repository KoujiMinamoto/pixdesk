#!/usr/bin/env python3
"""PixDesk Listener — capture bridged Matrix messages and ingest into agent.*.

Reads m.room.message events via /sync, then resolves platform-native IDs and
display names by joining against the mautrix bridge SQLite databases. Output
shape matches scripts/import-*-history.py so the two ingestion paths converge
on the same (platform, workspace_id, channel_id, message_id) primary key.
"""

import json
import os
import sqlite3
import sys
import time
import urllib.parse
import urllib.request
import urllib.error

import psycopg2
import psycopg2.extras

HOMESERVER = os.environ.get("MATRIX_HOMESERVER", "http://synapse:8008")
USER_ID = os.environ.get("MATRIX_USER_ID", "@admin:localhost")
ACCESS_TOKEN = os.environ["MATRIX_ACCESS_TOKEN"]
DATABASE_URL = os.environ["DATABASE_URL"]
SYNC_TIMEOUT_MS = int(os.environ.get("SYNC_TIMEOUT_MS", "30000"))
STATE_FILE = os.environ.get("STATE_FILE", "/data/sync_token.txt")
SLACK_DB = os.environ.get("SLACK_DB", "/bridges/slack/slack.db")
DISCORD_DB = os.environ.get("DISCORD_DB", "/bridges/discord/discord.db")
CONVERSATION_GAP_SECONDS = int(os.environ.get("CONVERSATION_GAP_SECONDS", "1800"))

# Auto-accept invites from bridge bots and puppet ghosts so newly-bridged
# rooms (channels, DMs from a Discord/Slack/Telegram user) show up without
# manual intervention.
BRIDGE_BOT_LOCALPARTS = {"slackbot", "discordbot", "telegrambot"}
BRIDGE_PUPPET_PREFIXES = ("slack_", "discord_", "telegram_")


def is_bridge_inviter(sender):
    """True if `sender` is a bridge bot or platform puppet ghost."""
    if not sender:
        return False
    localpart = sender.split(":")[0].lstrip("@")
    if localpart in BRIDGE_BOT_LOCALPARTS:
        return True
    return any(localpart.startswith(p) for p in BRIDGE_PUPPET_PREFIXES)


def matrix_request(method, path, data=None):
    url = HOMESERVER + path
    sep = "&" if "?" in url else "?"
    url += f"{sep}access_token={ACCESS_TOKEN}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=SYNC_TIMEOUT_MS // 1000 + 30) as resp:
        return json.loads(resp.read().decode())


def load_sync_token():
    try:
        with open(STATE_FILE) as f:
            return f.read().strip() or None
    except FileNotFoundError:
        return None


def save_sync_token(token):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    tmp = STATE_FILE + ".tmp"
    with open(tmp, "w") as f:
        f.write(token)
    os.replace(tmp, STATE_FILE)


def open_bridge_db(path):
    """Open a mautrix bridge SQLite read-only. Returns None if missing."""
    if not os.path.exists(path):
        print(f"bridge DB not found: {path}", file=sys.stderr, flush=True)
        return None
    uri = f"file:{path}?mode=ro&immutable=0"
    con = sqlite3.connect(uri, uri=True, timeout=5.0)
    con.row_factory = sqlite3.Row
    return con


def discord_login_dcid(discord_db):
    """Cache the logged-in Discord user's dcid. Used to label group DMs
    (type=3) with no guild and no receiver, matching the import script's
    `direct:{login.discord_id}` rule.
    """
    if discord_db is None:
        return ""
    try:
        row = discord_db.execute(
            'select dcid from "user" where discord_token is not null limit 1'
        ).fetchone()
        return row["dcid"] if row and row["dcid"] else ""
    except Exception as e:
        print(f"discord login lookup failed: {e}", file=sys.stderr, flush=True)
        return ""


def detect_platform(sender):
    if sender == USER_ID:
        return None
    localpart = sender.split(":")[0].lstrip("@")
    if localpart.startswith("slack_"):
        return "slack"
    if localpart.startswith("discord_"):
        return "discord"
    if localpart.startswith("telegram_"):
        return "telegram"
    return None


def lookup_slack(slack_db, event_id):
    """Look up a Matrix event in mautrix-slack's message table.

    message.id is "TEAMID-CHANNELID-TS"; sender_id is "teamid-userid"
    (lowercase). We split those apart to get platform-native fields that
    match the import script's row shape exactly.
    """
    if slack_db is None:
        return None
    cur = slack_db.execute(
        """
        select m.id as compound_id,
               m.sender_id as ghost_id,
               m.timestamp as ts_ns,
               m.thread_root_id,
               g.name as ghost_name,
               p.name as channel_name
        from message m
        left join ghost g on g.id = m.sender_id
        left join portal p on p.id = m.room_id and p.receiver = m.room_receiver
        where m.mxid = ?
        """,
        (event_id,),
    )
    row = cur.fetchone()
    if not row:
        return None
    parts = (row["compound_id"] or "").split("-", 2)
    if len(parts) != 3:
        return None
    workspace_id, channel_id, message_id = parts
    sender_compound = (row["ghost_id"] or "").split("-", 1)
    sender_id = sender_compound[1].upper() if len(sender_compound) == 2 else ""
    thread_id = None
    if row["thread_root_id"]:
        # thread_root_id looks like the same compound triple; we want only the ts.
        troot = row["thread_root_id"].split("-", 2)
        thread_id = troot[2] if len(troot) == 3 else None
    return {
        "workspace_id": workspace_id,
        "channel_id": channel_id,
        "message_id": message_id,
        "thread_id": thread_id,
        "sender_id": sender_id,
        "sender_name": row["ghost_name"] or "",
        "channel_name": row["channel_name"] or "",
        "ts": (row["ts_ns"] or 0) / 1_000_000_000.0,
    }


def lookup_discord(discord_db, event_id, login_dcid=""):
    """Look up a Matrix event in mautrix-discord's message table.

    Discord puppet table has discord-side display names. portal joins
    channel_id back to its parent guild for workspace_id. Group DMs
    (type=3) have neither guild nor receiver — fall back to
    `direct:{login_dcid}` to match the import script.
    """
    if discord_db is None:
        return None
    cur = discord_db.execute(
        """
        select m.dcid, m.dc_chan_id, m.dc_sender, m.timestamp, m.dc_thread_id,
               p.dc_guild_id, p.receiver as portal_receiver,
               p.name as channel_name,
               pu.name as puppet_name, pu.username
        from message m
        left join portal p on p.dcid = m.dc_chan_id and p.receiver = m.dc_chan_receiver
        left join puppet pu on pu.id = m.dc_sender
        where m.mxid = ?
        """,
        (event_id,),
    )
    row = cur.fetchone()
    if not row:
        return None
    workspace_id = row["dc_guild_id"] or row["portal_receiver"] or ""
    if not workspace_id and login_dcid:
        workspace_id = f"direct:{login_dcid}"
    return {
        "workspace_id": workspace_id,
        "channel_id": row["dc_chan_id"] or "",
        "message_id": row["dcid"] or "",
        "thread_id": row["dc_thread_id"] or None,
        "sender_id": row["dc_sender"] or "",
        "sender_name": row["puppet_name"] or row["username"] or "",
        "channel_name": row["channel_name"] or "",
        "ts": (row["timestamp"] or 0) / 1000.0,
    }


# Cache of (channel_name, matrix_room_id) we've already pushed to agent.channels,
# keyed by (platform, workspace_id, channel_id). Skips redundant writes when a
# channel's name and room mapping haven't changed since we last saw it.
_channel_cache = {}


def upsert_channel(db, platform, workspace_id, channel_id, channel_name, room_id):
    if not channel_id:
        return
    key = (platform, workspace_id, channel_id)
    desired = (channel_name or "", room_id or "")
    if _channel_cache.get(key) == desired:
        return
    with db.cursor() as cur:
        cur.execute(
            """
            insert into agent.channels
              (platform, workspace_id, channel_id, channel_name, matrix_room_id, updated_at)
            values (%s, %s, %s, %s, %s, now())
            on conflict (platform, workspace_id, channel_id) do update set
              channel_name = coalesce(nullif(excluded.channel_name, ''), agent.channels.channel_name),
              matrix_room_id = coalesce(excluded.matrix_room_id, agent.channels.matrix_room_id),
              updated_at = now()
            where agent.channels.channel_name is distinct from coalesce(nullif(excluded.channel_name, ''), agent.channels.channel_name)
               or agent.channels.matrix_room_id is distinct from coalesce(excluded.matrix_room_id, agent.channels.matrix_room_id)
            """,
            (platform, workspace_id, channel_id, channel_name or "", room_id),
        )
    _channel_cache[key] = desired


def find_or_create_conversation(db, platform, workspace_id, channel_id, thread_id, room_id):
    with db.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """
            select id, last_activity_at
            from agent.conversations
            where platform = %s and workspace_id = %s and channel_id = %s
              and coalesce(thread_id, '') = coalesce(%s, '')
              and status != 'resolved'
            order by last_activity_at desc limit 1
            """,
            (platform, workspace_id, channel_id, thread_id),
        )
        row = cur.fetchone()
        if row:
            gap = time.time() - row["last_activity_at"].timestamp()
            if gap < CONVERSATION_GAP_SECONDS:
                cur.execute(
                    "update agent.conversations set last_activity_at = now() where id = %s",
                    (row["id"],),
                )
                return str(row["id"])
        cur.execute(
            """
            insert into agent.conversations
              (platform, workspace_id, channel_id, thread_id, matrix_room_id)
            values (%s, %s, %s, %s, %s)
            returning id
            """,
            (platform, workspace_id, channel_id, thread_id, room_id),
        )
        return str(cur.fetchone()["id"])


def store_message(db, platform, room_id, event, info, conversation_id):
    """INSERT into agent.messages. Returns True if a new row was created."""
    ts_iso = time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime(info["ts"]))
    text = (event.get("content") or {}).get("body", "")
    with db.cursor() as cur:
        cur.execute(
            """
            insert into agent.messages
              (platform, workspace_id, channel_id, message_id, thread_id,
               sender_id, sender_name, text, ts, raw,
               status, conversation_id, matrix_event_id, matrix_room_id)
            values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb,
                    'new', %s, %s, %s)
            on conflict (platform, workspace_id, channel_id, message_id) do update set
              sender_name = coalesce(nullif(excluded.sender_name, ''), agent.messages.sender_name),
              matrix_event_id = excluded.matrix_event_id,
              matrix_room_id = excluded.matrix_room_id
            returning xmax = 0 as is_insert
            """,
            (
                platform,
                info["workspace_id"],
                info["channel_id"],
                info["message_id"],
                info["thread_id"],
                info["sender_id"],
                info["sender_name"],
                text,
                ts_iso,
                json.dumps(event),
                conversation_id,
                event.get("event_id"),
                room_id,
            ),
        )
        result = cur.fetchone()
        return bool(result and result[0])


def lookup_with_retry(platform, slack_db, discord_db, event_id, login_dcid):
    """The bridge writes its SQLite row asynchronously around the same time
    Matrix delivers the event. Most rows are visible on the first try; for
    the rest, a brief backoff catches them.
    """
    delays = (0, 0.5, 1.5, 4.0)
    for delay in delays:
        if delay:
            time.sleep(delay)
        if platform == "slack":
            info = lookup_slack(slack_db, event_id)
        elif platform == "discord":
            info = lookup_discord(discord_db, event_id, login_dcid)
        else:
            return None
        if info:
            return info
    return None


def process_event(db, slack_db, discord_db, login_dcid, room_id, event):
    if event.get("type") != "m.room.message":
        return
    sender = event.get("sender", "")
    platform = detect_platform(sender)
    if not platform:
        return
    event_id = event.get("event_id")
    if not event_id:
        return

    info = lookup_with_retry(platform, slack_db, discord_db, event_id, login_dcid)
    if not info:
        # Row never appeared after backoff. Either Telegram (no lookup yet)
        # or the bridge dropped the event upstream. Logging keeps it visible
        # without re-driving sync.
        print(
            f"no bridge row for {platform} event {event_id} in {room_id}; dropping",
            file=sys.stderr,
            flush=True,
        )
        return
    if not info["workspace_id"] or not info["channel_id"] or not info["message_id"]:
        print(f"incomplete bridge row for {event_id}: {info}", file=sys.stderr, flush=True)
        return

    conversation_id = find_or_create_conversation(
        db, platform, info["workspace_id"], info["channel_id"],
        info["thread_id"], room_id,
    )
    upsert_channel(
        db, platform, info["workspace_id"], info["channel_id"],
        info.get("channel_name", ""), room_id,
    )
    store_message(db, platform, room_id, event, info, conversation_id)


def join_room(room_id):
    try:
        matrix_request(
            "POST",
            f"/_matrix/client/v3/rooms/{urllib.parse.quote(room_id)}/join",
            data={},
        )
        return True
    except Exception as e:
        print(f"join {room_id} failed: {e}", file=sys.stderr, flush=True)
        return False


def handle_invite(room_id, invite_data):
    """Auto-accept invites from known bridge bots and puppet ghosts.

    Matrix delivers invites in rooms.invite[].invite_state.events. We scan
    for the m.room.member event addressed to our user and check the
    inviter against the bridge namespace.
    """
    events = ((invite_data or {}).get("invite_state") or {}).get("events", [])
    for ev in events:
        if ev.get("type") != "m.room.member":
            continue
        if ev.get("state_key") != USER_ID:
            continue
        if (ev.get("content") or {}).get("membership") != "invite":
            continue
        sender = ev.get("sender", "")
        if not is_bridge_inviter(sender):
            print(
                f"invite to {room_id} from {sender}; not a bridge sender, skipping",
                file=sys.stderr, flush=True,
            )
            return
        if join_room(room_id):
            print(f"auto-joined {room_id} (invited by {sender})", flush=True)
        return


def drain_pending_invites():
    """Fetch a fresh /sync (no since) at startup just to enumerate invites
    that arrived while the listener was offline. The response is discarded
    apart from the invite section; the persisted next_batch token still
    drives the main loop.
    """
    try:
        params = {
            "filter": json.dumps({
                "room": {
                    "timeline": {"limit": 0},
                    "state": {"types": ["m.room.member"]},
                    "ephemeral": {"types": []},
                    "account_data": {"types": []},
                },
                "presence": {"types": []},
                "account_data": {"types": []},
            }),
        }
        resp = matrix_request(
            "GET", "/_matrix/client/v3/sync?" + urllib.parse.urlencode(params),
        )
    except Exception as e:
        print(f"startup invite drain failed: {e}", file=sys.stderr, flush=True)
        return
    invites = resp.get("rooms", {}).get("invite", {})
    if not invites:
        return
    print(f"draining {len(invites)} pending invite(s) at startup", flush=True)
    for room_id, invite_data in invites.items():
        try:
            handle_invite(room_id, invite_data)
        except Exception as e:
            print(f"invite drain error for {room_id}: {e}", file=sys.stderr, flush=True)


def get_pg():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    return conn


def sync_loop():
    pg = get_pg()
    slack_db = open_bridge_db(SLACK_DB)
    discord_db = open_bridge_db(DISCORD_DB)
    login_dcid = discord_login_dcid(discord_db)
    since = load_sync_token()
    print(
        f"listener started, user={USER_ID}, since={since}, "
        f"slack_db={'yes' if slack_db else 'no'}, "
        f"discord_db={'yes' if discord_db else 'no'}, "
        f"discord_login={login_dcid or 'none'}",
        flush=True,
    )
    drain_pending_invites()

    while True:
        try:
            params = {
                "timeout": str(SYNC_TIMEOUT_MS),
                "filter": json.dumps({
                    "room": {
                        "timeline": {"limit": 50},
                        "state": {"types": ["m.room.member"]},
                        "ephemeral": {"types": []},
                        "account_data": {"types": []},
                    },
                    "presence": {"types": []},
                    "account_data": {"types": []},
                }),
            }
            if since:
                params["since"] = since
            resp = matrix_request(
                "GET", "/_matrix/client/v3/sync?" + urllib.parse.urlencode(params),
            )
            since = resp.get("next_batch")
            if since:
                save_sync_token(since)
            invites = resp.get("rooms", {}).get("invite", {})
            for room_id, invite_data in invites.items():
                try:
                    handle_invite(room_id, invite_data)
                except Exception as e:
                    print(f"invite error for {room_id}: {e}", file=sys.stderr, flush=True)
            rooms = resp.get("rooms", {}).get("join", {})
            for room_id, room_data in rooms.items():
                events = (room_data.get("timeline") or {}).get("events", [])
                for event in events:
                    try:
                        process_event(pg, slack_db, discord_db, login_dcid, room_id, event)
                    except Exception as e:
                        print(f"event error: {e}", file=sys.stderr, flush=True)
        except urllib.error.URLError as e:
            print(f"sync error: {e}", file=sys.stderr, flush=True)
            time.sleep(5)
        except Exception as e:
            print(f"unexpected error: {e}", file=sys.stderr, flush=True)
            time.sleep(5)
            try:
                pg.close()
            except Exception:
                pass
            pg = get_pg()


if __name__ == "__main__":
    sync_loop()
