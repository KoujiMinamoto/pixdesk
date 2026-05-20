#!/usr/bin/env python3
"""Backfill Discord historical messages from agent.messages into the Matrix room.

Runs ON THE SERVER (same as import-discord-history.py).

Reads:
  - agent.messages (Postgres, via `docker compose exec postgres psql`)
  - mautrix-discord/discord.db (SQLite, for portal mxid + already-bridged dcids)
  - mautrix-discord/registration.yaml (AS token)

Writes:
  - m.room.message events into the target Matrix room, impersonating
    @discord_<sender_id>:<server_name> ghost users with origin_server_ts set
    to the original Discord timestamp.
  - agent.messages.matrix_event_id / matrix_room_id (so we can audit + skip on rerun)
"""

import argparse
import datetime as dt
import json
import os
import re
import sqlite3
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

PROJECT_DIR = os.environ.get(
    "PIXDESK_PROJECT_DIR",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..")),
)
DISCORD_DB = os.environ.get(
    "PIXDESK_DISCORD_DB",
    os.path.join(PROJECT_DIR, "data/mautrix-discord/discord.db"),
)
DISCORD_REGISTRATION = os.environ.get(
    "PIXDESK_DISCORD_REGISTRATION",
    os.path.join(PROJECT_DIR, "data/mautrix-discord/registration.yaml"),
)
HOMESERVER = os.environ.get("MATRIX_HOMESERVER", "http://localhost:8008")
SERVER_NAME = os.environ.get("MATRIX_SERVER_NAME", "192.168.72.185")
SLEEP_BETWEEN_SENDS = float(os.environ.get("BACKFILL_SLEEP_SECONDS", "0.05"))

PSQL = [
    "docker", "compose", "exec", "-T", "postgres",
    "psql", "-U", "synapse", "-d", "synapse",
    "-v", "ON_ERROR_STOP=1",
]


def run_psql(sql, want_output=False):
    args = PSQL[:]
    if want_output:
        args += ["-tA", "-F\t"]
    proc = subprocess.run(args, input=sql, text=True, cwd=PROJECT_DIR, capture_output=True)
    if proc.returncode != 0:
        print(proc.stdout, file=sys.stderr)
        print(proc.stderr, file=sys.stderr)
        raise SystemExit(proc.returncode)
    return proc.stdout


def sql_literal(value):
    if value is None:
        return "null"
    return "'" + str(value).replace("'", "''").replace("\x00", "") + "'"


def load_as_token():
    if os.environ.get("DISCORD_AS_TOKEN"):
        return os.environ["DISCORD_AS_TOKEN"]
    with open(DISCORD_REGISTRATION) as f:
        for line in f:
            m = re.match(r"^as_token:\s*(\S+)\s*$", line)
            if m:
                return m.group(1)
    raise SystemExit("Could not find AS token. Set DISCORD_AS_TOKEN or check registration.yaml")


def lookup_portal(channel_id):
    con = sqlite3.connect(DISCORD_DB)
    con.row_factory = sqlite3.Row
    row = con.execute(
        "select dcid, mxid, name from portal where dcid = ? and mxid != ''",
        (channel_id,),
    ).fetchone()
    con.close()
    if not row:
        raise SystemExit(f"No bridged portal for channel {channel_id}")
    return {"channel_id": row["dcid"], "room_id": row["mxid"], "name": row["name"]}


def lookup_bridged_dcids(channel_id):
    con = sqlite3.connect(DISCORD_DB)
    rows = con.execute(
        "select distinct dcid from message where dc_chan_id = ?",
        (channel_id,),
    ).fetchall()
    con.close()
    return {r[0] for r in rows}


def load_puppet_names():
    """Map Discord user ID -> display name from mautrix-discord puppet table."""
    con = sqlite3.connect(DISCORD_DB)
    rows = con.execute(
        "select id, name, global_name, username from puppet"
    ).fetchall()
    con.close()
    out = {}
    for row in rows:
        dcid, name, global_name, username = row
        display = name or global_name or username or dcid
        out[dcid] = display
    return out


MENTION_RE = re.compile(r"<@!?(\d+)>")


def resolve_mentions(text, puppet_names):
    if not text:
        return text
    def sub(m):
        uid = m.group(1)
        name = puppet_names.get(uid)
        return f"@{name}" if name else m.group(0)
    return MENTION_RE.sub(sub, text)


def fetch_messages(channel_id, limit=None):
    where = f"platform = 'discord' and channel_id = {sql_literal(channel_id)}"
    # Always send oldest -> newest (ts ASC) so each event's stream_ordering
    # in Synapse increases together with origin_server_ts. This is the only
    # way Element renders historical messages in the right chronological
    # position (Element timelines are ordered by stream_ordering, not by
    # origin_server_ts, so the API ?ts= alone isn't enough).
    cap = f"limit {int(limit)}" if limit else ""
    sql = f"""
\\pset format unaligned
\\pset tuples_only on
select to_jsonb(t)::text from (
  select
    message_id,
    sender_id,
    coalesce(sender_name, '') as sender_name,
    coalesce(text, '') as text,
    raw,
    (extract(epoch from ts) * 1000)::bigint as ts_ms,
    matrix_event_id
  from agent.messages
  where {where}
  order by ts asc
  {cap}
) t;
"""
    out = run_psql(sql, want_output=False)
    rows = []
    for line in out.split("\n"):
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError as e:
            print(f"  WARN failed to parse row: {e}: {line[:200]}", file=sys.stderr)
    return rows


def matrix_request(method, path, as_token, user_id=None, body=None, timeout=30):
    params = {"access_token": as_token}
    if user_id:
        params["user_id"] = user_id
    url = HOMESERVER + path + "?" + urllib.parse.urlencode(params)
    data = None
    if body is not None:
        data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method=method)
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as err:
        body_text = err.read().decode(errors="replace")
        raise RuntimeError(f"{method} {path} -> HTTP {err.code} {body_text}") from err


def matrix_request_with_ts(method, path, as_token, user_id, ts_ms, body):
    params = {"access_token": as_token, "user_id": user_id, "ts": ts_ms}
    url = HOMESERVER + path + "?" + urllib.parse.urlencode(params)
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as err:
        body_text = err.read().decode(errors="replace")
        raise RuntimeError(f"{method} {path} -> HTTP {err.code} {body_text}") from err


def joined_members(room_id, as_token):
    res = matrix_request(
        "GET",
        f"/_matrix/client/v3/rooms/{urllib.parse.quote(room_id)}/joined_members",
        as_token,
    )
    return set(res.get("joined", {}).keys())


def ensure_ghost_in_room(room_id, ghost_mxid, as_token):
    discordbot = f"@discordbot:{SERVER_NAME}"
    try:
        matrix_request(
            "POST",
            f"/_matrix/client/v3/rooms/{urllib.parse.quote(room_id)}/invite",
            as_token,
            user_id=discordbot,
            body={"user_id": ghost_mxid},
        )
    except RuntimeError as e:
        if "already in the room" not in str(e) and "M_FORBIDDEN" not in str(e):
            raise
    matrix_request(
        "POST",
        f"/_matrix/client/v3/rooms/{urllib.parse.quote(room_id)}/join",
        as_token,
        user_id=ghost_mxid,
    )


def format_body(msg, puppet_names):
    parts = []
    text = resolve_mentions(msg["text"], puppet_names)
    if text:
        parts.append(text)
    raw = msg.get("raw") or {}
    for att in raw.get("attachments") or []:
        name = att.get("filename") or "file"
        url = att.get("url") or ""
        parts.append(f"[attachment: {name}] {url}".strip())
    return "\n".join(p for p in parts if p)


def update_matrix_event_id(channel_id, message_id, room_id, event_id):
    sql = (
        "update agent.messages set matrix_event_id = "
        + sql_literal(event_id)
        + ", matrix_room_id = "
        + sql_literal(room_id)
        + " where platform = 'discord' and channel_id = "
        + sql_literal(channel_id)
        + " and message_id = "
        + sql_literal(message_id)
        + ";"
    )
    run_psql(sql)


def backfill(channel_id, limit, dry_run=False, txn_suffix=""):
    as_token = load_as_token()
    portal = lookup_portal(channel_id)
    room_id = portal["room_id"]
    bridged = lookup_bridged_dcids(channel_id)
    puppet_names = load_puppet_names()
    print(f"channel={channel_id} ({portal['name']}) room={room_id}")
    print(f"already bridged dcids: {len(bridged)}, puppet names loaded: {len(puppet_names)}")

    msgs = fetch_messages(channel_id, limit=limit)
    print(f"fetched {len(msgs)} messages from agent.messages")

    todo = [
        m for m in msgs
        if m["message_id"] not in bridged and not m["matrix_event_id"]
    ]
    print(
        f"to backfill: {len(todo)} "
        f"(skipped {len(msgs) - len(todo)} already-bridged or already-injected)"
    )

    if not todo:
        return

    senders_needed = {m["sender_id"] for m in todo if m["sender_id"]}
    members = joined_members(room_id, as_token)
    print(f"unique senders: {len(senders_needed)}, current room members: {len(members)}")

    if dry_run:
        print("[dry-run] would join missing ghosts and send messages")
        return

    for sid in sorted(senders_needed):
        ghost = f"@discord_{sid}:{SERVER_NAME}"
        if ghost in members:
            continue
        try:
            ensure_ghost_in_room(room_id, ghost, as_token)
            members.add(ghost)
            print(f"  joined {ghost}")
        except Exception as e:
            print(f"  WARN failed to join {ghost}: {e}", file=sys.stderr)

    sent = 0
    failed = 0
    for i, m in enumerate(todo, start=1):
        ghost = f"@discord_{m['sender_id']}:{SERVER_NAME}"
        body = format_body(m, puppet_names)
        if not body:
            body = "[empty message]"
        txnid = f"backfill-discord-{m['message_id']}{txn_suffix}"
        path = (
            f"/_matrix/client/v3/rooms/{urllib.parse.quote(room_id)}"
            f"/send/m.room.message/{txnid}"
        )
        try:
            res = matrix_request_with_ts(
                "PUT", path, as_token, ghost, m["ts_ms"],
                {"msgtype": "m.text", "body": body},
            )
            event_id = res.get("event_id")
            update_matrix_event_id(channel_id, m["message_id"], room_id, event_id)
            sent += 1
        except Exception as e:
            failed += 1
            print(f"  msg {m['message_id']} failed: {e}", file=sys.stderr)
        if i % 50 == 0:
            print(f"  progress: {i}/{len(todo)} sent={sent} failed={failed}")
        time.sleep(SLEEP_BETWEEN_SENDS)

    print(f"done: sent={sent} failed={failed}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--channel", required=True, help="Discord channel ID (dcid)")
    parser.add_argument("--limit", type=int, default=None,
                        help="Only backfill the last N messages (descending by ts). Default: all.")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--txn-suffix", default="",
                        help="Append to txn id; bump this if you redacted previous events with the same txn id.")
    args = parser.parse_args()
    backfill(args.channel, args.limit, dry_run=args.dry_run, txn_suffix=args.txn_suffix)
