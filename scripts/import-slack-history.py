#!/usr/bin/env python3
import argparse
import datetime as dt
import json
import os
import sqlite3
import subprocess
import sys
import time
import urllib.parse
import urllib.request

PROJECT_DIR = os.environ.get(
    "PIXDESK_PROJECT_DIR",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..")),
)
SLACK_DB = os.environ.get(
    "PIXDESK_SLACK_DB",
    os.path.join(PROJECT_DIR, "data/mautrix-slack/slack.db"),
)
PSQL = [
    "docker",
    "compose",
    "exec",
    "-T",
    "postgres",
    "psql",
    "-U",
    "synapse",
    "-d",
    "synapse",
    "-v",
    "ON_ERROR_STOP=1",
]


def sql_literal(value):
    if value is None:
        return "null"
    return "'" + str(value).replace("'", "''").replace("\x00", "") + "'"


def slack_call(token, method, params, cookie_token=None):
    params = dict(params)
    params["token"] = token
    data = urllib.parse.urlencode(params).encode()
    req = urllib.request.Request(f"https://slack.com/api/{method}", data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    req.add_header("Authorization", f"Bearer {token}")
    if cookie_token:
        req.add_header("Cookie", f"d={urllib.parse.quote(cookie_token, safe='')}")
    with urllib.request.urlopen(req, timeout=45) as resp:
        out = json.loads(resp.read().decode())
    if not out.get("ok"):
        raise RuntimeError(f"Slack API {method} failed: {out}")
    return out


def slack_ts_to_iso(ts):
    if not ts:
        return None
    return dt.datetime.fromtimestamp(float(ts), tz=dt.timezone.utc).isoformat()


def run_psql(sql):
    proc = subprocess.run(PSQL, input=sql, text=True, cwd=PROJECT_DIR, capture_output=True)
    if proc.returncode != 0:
        print(proc.stdout, file=sys.stderr)
        print(proc.stderr, file=sys.stderr)
        raise SystemExit(proc.returncode)
    return proc.stdout


def get_login():
    con = sqlite3.connect(SLACK_DB)
    con.row_factory = sqlite3.Row
    row = con.execute("select id, metadata from user_login limit 1").fetchone()
    if not row:
        raise RuntimeError("No Slack login found in mautrix-slack database")
    meta = json.loads(row["metadata"])
    token = meta.get("token")
    cookie_token = meta.get("cookie_token")
    if not token:
        raise RuntimeError("Slack login metadata has no token")
    workspace_id, user_id = row["id"].split("-", 1)
    return token, cookie_token, workspace_id, user_id


def find_channel(channel_name):
    con = sqlite3.connect(SLACK_DB)
    con.row_factory = sqlite3.Row
    plain = channel_name.lstrip("#")
    candidates = (plain, f"#{plain}")
    rows = con.execute(
        "select id, name, mxid, metadata from portal where name in (?, ?)",
        candidates,
    ).fetchall()
    if not rows:
        rows = con.execute(
            "select id, name, mxid, metadata from portal where name like ? order by name",
            (f"%{plain}%",),
        ).fetchall()
    if not rows:
        raise RuntimeError(f"Channel not found in portal table: {channel_name}")
    exact = [r for r in rows if r["name"].lstrip("#") == plain]
    row = exact[0] if exact else rows[0]
    channel_id = row["id"].split("-")[-1]
    return {
        "portal_id": row["id"],
        "channel_id": channel_id,
        "name": row["name"],
        "mxid": row["mxid"],
        "raw": json.loads(row["metadata"] or "{}"),
    }


def upsert_channel(workspace_id, channel):
    sql = f"""
insert into agent.channels(platform, workspace_id, channel_id, channel_name, matrix_room_id, raw, updated_at)
values (
  'slack',
  {sql_literal(workspace_id)},
  {sql_literal(channel["channel_id"])},
  {sql_literal(channel["name"])},
  {sql_literal(channel["mxid"])},
  {sql_literal(json.dumps(channel["raw"], ensure_ascii=False))}::jsonb,
  now()
)
on conflict (platform, workspace_id, channel_id) do update set
  channel_name = excluded.channel_name,
  matrix_room_id = excluded.matrix_room_id,
  raw = excluded.raw,
  updated_at = now();
"""
    run_psql(sql)


def insert_messages(workspace_id, channel_id, messages):
    rows = []
    for msg in messages:
        msg_id = msg.get("ts") or msg.get("client_msg_id")
        if not msg_id:
            continue
        thread_id = msg.get("thread_ts") or msg_id
        sender_id = msg.get("user") or msg.get("bot_id") or msg.get("username")
        profile = msg.get("user_profile") or {}
        sender_name = msg.get("username") or profile.get("real_name") or profile.get("name")
        text = msg.get("text") or ""
        ts_iso = slack_ts_to_iso(msg.get("ts"))
        raw = json.dumps(msg, ensure_ascii=False)
        rows.append((workspace_id, channel_id, msg_id, thread_id, sender_id, sender_name, text, ts_iso, raw))
    if not rows:
        return 0

    values = []
    for row in rows:
        workspace, channel, msg_id, thread_id, sender_id, sender_name, text, ts_iso, raw = row
        values.append(
            "("
            + ",".join(
                [
                    "'slack'",
                    sql_literal(workspace),
                    sql_literal(channel),
                    sql_literal(msg_id),
                    sql_literal(thread_id),
                    sql_literal(sender_id),
                    sql_literal(sender_name),
                    sql_literal(text),
                    sql_literal(ts_iso),
                    sql_literal(raw) + "::jsonb",
                ]
            )
            + ")"
        )

    sql = f"""
insert into agent.messages(platform, workspace_id, channel_id, message_id, thread_id, sender_id, sender_name, text, ts, raw)
values
{",".join(values)}
on conflict (platform, workspace_id, channel_id, message_id) do update set
  thread_id = excluded.thread_id,
  sender_id = excluded.sender_id,
  sender_name = excluded.sender_name,
  text = excluded.text,
  ts = excluded.ts,
  raw = excluded.raw;
"""
    run_psql(sql)
    return len(rows)


def import_history(channel_name, limit, max_pages):
    token, cookie_token, workspace_id, _ = get_login()
    channel = find_channel(channel_name)
    upsert_channel(workspace_id, channel)

    cursor = None
    total = 0
    pages = 0
    thread_parents = []

    while total < limit and pages < max_pages:
        page_limit = min(200, limit - total)
        params = {"channel": channel["channel_id"], "limit": page_limit, "inclusive": "true"}
        if cursor:
            params["cursor"] = cursor
        out = slack_call(token, "conversations.history", params, cookie_token=cookie_token)
        messages = out.get("messages", [])
        inserted = insert_messages(workspace_id, channel["channel_id"], messages)
        total += inserted
        pages += 1
        print(f"page={pages} fetched={len(messages)} upserted={inserted} total={total}")

        for msg in messages:
            if msg.get("reply_count") and msg.get("thread_ts") == msg.get("ts"):
                thread_parents.append(msg["ts"])

        cursor = out.get("response_metadata", {}).get("next_cursor")
        if not cursor or not messages:
            break
        time.sleep(1)

    thread_total = 0
    for i, thread_ts in enumerate(thread_parents, 1):
        replies_cursor = None
        while True:
            params = {"channel": channel["channel_id"], "ts": thread_ts, "limit": 200, "inclusive": "true"}
            if replies_cursor:
                params["cursor"] = replies_cursor
            try:
                out = slack_call(token, "conversations.replies", params, cookie_token=cookie_token)
            except RuntimeError as e:
                print(f"  thread {thread_ts} error: {e}")
                break
            replies = out.get("messages", [])
            if len(replies) > 1:
                inserted = insert_messages(workspace_id, channel["channel_id"], replies[1:])
                thread_total += inserted
            replies_cursor = out.get("response_metadata", {}).get("next_cursor")
            if not replies_cursor or len(replies) < 200:
                break
            time.sleep(1)
        if i % 10 == 0:
            print(f"  threads: {i}/{len(thread_parents)} processed, {thread_total} replies imported")
        time.sleep(1)

    total += thread_total
    if thread_parents:
        print(f"threads: {len(thread_parents)} threads, {thread_total} replies imported")

    print(
        json.dumps(
            {
                "workspace_id": workspace_id,
                "channel_id": channel["channel_id"],
                "channel_name": channel["name"],
                "matrix_room_id": channel["mxid"],
                "imported": total,
                "thread_replies": thread_total,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("channel")
    parser.add_argument("--limit", type=int, default=200)
    parser.add_argument("--max-pages", type=int, default=5)
    args = parser.parse_args()
    import_history(args.channel, args.limit, args.max_pages)
