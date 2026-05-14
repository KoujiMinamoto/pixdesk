#!/usr/bin/env python3
import argparse
import datetime as dt
import json
import os
import socket
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
DISCORD_API = "https://discord.com/api/v9"
_orig_getaddrinfo = socket.getaddrinfo


def _getaddrinfo_ipv4(host, port, family=0, type=0, proto=0, flags=0):
    if host in {"discord.com", "discordapp.com", "cdn.discordapp.com"}:
        family = socket.AF_INET
    return _orig_getaddrinfo(host, port, family, type, proto, flags)


socket.getaddrinfo = _getaddrinfo_ipv4


def sql_literal(value):
    if value is None:
        return "null"
    return "'" + str(value).replace("'", "''").replace("\x00", "") + "'"


def run_psql(sql):
    proc = subprocess.run(PSQL, input=sql, text=True, cwd=PROJECT_DIR, capture_output=True)
    if proc.returncode != 0:
        print(proc.stdout, file=sys.stderr)
        print(proc.stderr, file=sys.stderr)
        raise SystemExit(proc.returncode)
    return proc.stdout


def discord_timestamp_to_iso(value):
    if not value:
        return None
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    return dt.datetime.fromisoformat(value).astimezone(dt.timezone.utc).isoformat()


def discord_call(token, path, params=None):
    query = ""
    if params:
        query = "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(DISCORD_API + path + query)
    req.add_header("Authorization", token)
    req.add_header("User-Agent", "Mozilla/5.0")
    req.add_header("Accept", "application/json")
    for attempt in range(1, 5):
        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as err:
            body = err.read().decode(errors="replace")
            if err.code == 429 and attempt < 4:
                try:
                    retry_after = float(json.loads(body).get("retry_after", 2))
                except Exception:
                    retry_after = 2
                time.sleep(retry_after)
                continue
            raise RuntimeError(f"Discord API {path} failed: HTTP {err.code} {body}") from err
        except urllib.error.URLError:
            if attempt == 4:
                raise
            time.sleep(attempt * 2)


def get_login():
    con = sqlite3.connect(DISCORD_DB)
    con.row_factory = sqlite3.Row
    row = con.execute(
        "select mxid, dcid, discord_token from user where discord_token is not null limit 1"
    ).fetchone()
    if not row:
        raise RuntimeError("No Discord login found in mautrix-discord database")
    return {
        "mxid": row["mxid"],
        "discord_id": row["dcid"],
        "token": row["discord_token"],
    }


def find_portal(identifier):
    con = sqlite3.connect(DISCORD_DB)
    con.row_factory = sqlite3.Row
    rows = con.execute(
        """
        select dcid, receiver, other_user_id, type, dc_guild_id, dc_parent_id,
               plain_name, name, topic, mxid
        from portal
        where dcid = ?
           or lower(name) like lower(?)
           or lower(plain_name) like lower(?)
        order by
          case when dcid = ? then 0 else 1 end,
          case when mxid is not null and mxid != '' then 0 else 1 end,
          name
        """,
        (identifier, f"%{identifier}%", f"%{identifier}%", identifier),
    ).fetchall()
    if not rows:
        raise RuntimeError(f"Discord portal not found: {identifier}")
    row = rows[0]
    return {
        "channel_id": row["dcid"],
        "receiver": row["receiver"] or "",
        "other_user_id": row["other_user_id"],
        "type": row["type"],
        "guild_id": row["dc_guild_id"],
        "parent_id": row["dc_parent_id"],
        "plain_name": row["plain_name"],
        "name": row["name"],
        "topic": row["topic"],
        "mxid": row["mxid"],
    }


def workspace_id_for(portal, login):
    if portal["guild_id"]:
        return portal["guild_id"]
    if portal["receiver"]:
        return portal["receiver"]
    return f"direct:{login['discord_id']}"


def upsert_channel(workspace_id, portal, channel_raw):
    raw = dict(channel_raw or {})
    raw["portal"] = portal
    sql = f"""
insert into agent.channels(platform, workspace_id, channel_id, channel_name, matrix_room_id, raw, updated_at)
values (
  'discord',
  {sql_literal(workspace_id)},
  {sql_literal(portal["channel_id"])},
  {sql_literal(portal["name"])},
  {sql_literal(portal["mxid"])},
  {sql_literal(json.dumps(raw, ensure_ascii=False))}::jsonb,
  now()
)
on conflict (platform, workspace_id, channel_id) do update set
  channel_name = excluded.channel_name,
  matrix_room_id = excluded.matrix_room_id,
  raw = excluded.raw,
  updated_at = now();
"""
    run_psql(sql)


def message_text(msg):
    content = msg.get("content") or ""
    attachments = msg.get("attachments") or []
    embeds = msg.get("embeds") or []
    parts = [content] if content else []
    for attachment in attachments:
        name = attachment.get("filename") or attachment.get("url")
        if name:
            parts.append(f"[attachment: {name}]")
    for embed in embeds:
        title = embed.get("title")
        description = embed.get("description")
        if title:
            parts.append(title)
        if description:
            parts.append(description)
    return "\n".join(parts)


def insert_messages(workspace_id, channel_id, messages):
    values = []
    for msg in messages:
        msg_id = msg.get("id")
        if not msg_id:
            continue
        author = msg.get("author") or {}
        sender_name = author.get("global_name") or author.get("username")
        ts_iso = discord_timestamp_to_iso(msg.get("timestamp"))
        thread_id = msg.get("message_reference", {}).get("message_id") or msg_id
        values.append(
            "("
            + ",".join(
                [
                    "'discord'",
                    sql_literal(workspace_id),
                    sql_literal(channel_id),
                    sql_literal(msg_id),
                    sql_literal(thread_id),
                    sql_literal(author.get("id")),
                    sql_literal(sender_name),
                    sql_literal(message_text(msg)),
                    sql_literal(ts_iso),
                    sql_literal(json.dumps(msg, ensure_ascii=False)) + "::jsonb",
                ]
            )
            + ")"
        )
    if not values:
        return 0
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
    return len(values)


def import_history(identifier, limit, max_pages):
    login = get_login()
    portal = find_portal(identifier)
    workspace_id = workspace_id_for(portal, login)
    channel_raw = discord_call(login["token"], f"/channels/{portal['channel_id']}")
    upsert_channel(workspace_id, portal, channel_raw)

    total = 0
    before = None
    for page in range(1, max_pages + 1):
        page_limit = min(100, limit - total)
        if page_limit <= 0:
            break
        params = {"limit": page_limit}
        if before:
            params["before"] = before
        messages = discord_call(login["token"], f"/channels/{portal['channel_id']}/messages", params)
        if not messages:
            break
        inserted = insert_messages(workspace_id, portal["channel_id"], messages)
        total += inserted
        before = messages[-1].get("id")
        print(f"page={page} fetched={len(messages)} upserted={inserted} total={total}")
        if len(messages) < page_limit:
            break
        time.sleep(1)

    print(
        json.dumps(
            {
                "workspace_id": workspace_id,
                "channel_id": portal["channel_id"],
                "channel_name": portal["name"],
                "matrix_room_id": portal["mxid"],
                "imported": total,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("portal", help="Discord channel ID or portal name")
    parser.add_argument("--limit", type=int, default=500)
    parser.add_argument("--max-pages", type=int, default=10)
    args = parser.parse_args()
    import_history(args.portal, args.limit, args.max_pages)
