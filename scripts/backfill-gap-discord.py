#!/usr/bin/env python3
"""Backfill the Discord message gap after a bridge logout.

Unlike import-discord-history.py (single channel, paginates backward with no
lower bound), this walks every *monitored* channel — those that already have
rows in agent.messages — and pulls only messages newer than each channel's
last stored message, forward-paginating with Discord's `after` cursor until it
catches up to now. Overlap with live messages is deduped by the upsert.

Run from the deployment dir (where docker-compose.yml lives) so
`docker compose exec postgres` works, and on a host with Discord egress.
"""
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
    "docker", "compose", "exec", "-T", "postgres",
    "psql", "-U", "synapse", "-d", "synapse", "-v", "ON_ERROR_STOP=1",
]
DISCORD_API = "https://discord.com/api/v9"
PAGE_SLEEP = float(os.environ.get("BACKFILL_PAGE_SLEEP", "1.0"))

# Force IPv4 for Discord hosts (matches the bridge's extra_hosts pins).
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


def run_psql(sql, capture=True):
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
    query = "?" + urllib.parse.urlencode(params) if params else ""
    req = urllib.request.Request(DISCORD_API + path + query)
    req.add_header("Authorization", token)
    req.add_header("User-Agent", "Mozilla/5.0")
    req.add_header("Accept", "application/json")
    for attempt in range(1, 6):
        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as err:
            body = err.read().decode(errors="replace")
            if err.code == 429 and attempt < 5:
                try:
                    retry_after = float(json.loads(body).get("retry_after", 2))
                except Exception:
                    retry_after = 2
                time.sleep(retry_after + 0.5)
                continue
            if err.code in (403, 404):
                # No access to this channel anymore (left guild, deleted, DM closed).
                return {"__error__": err.code}
            raise RuntimeError(f"Discord API {path} failed: HTTP {err.code} {body}") from err
        except urllib.error.URLError:
            if attempt == 5:
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
    return {"mxid": row["mxid"], "discord_id": row["dcid"], "token": row["discord_token"]}


def monitored_channels(before_ts):
    """Channels in agent.messages, each with the last message id stored *before*
    the logout boundary as the forward-pagination cursor.

    Using max(message_id) overall would be wrong: after the bridge reconnected,
    live messages (ids far above the gap) landed in the table. Anchoring the
    `after` cursor to the pre-logout boundary lets us page across the whole gap;
    the overlap with live messages is deduped by the upsert."""
    out = run_psql(
        "\\pset format unaligned\n"
        "\\pset fieldsep '|'\n"
        "\\pset tuples_only on\n"
        "select channel_id, workspace_id, "
        "  max(message_id::numeric) filter (where ts < " + sql_literal(before_ts) + ")::text, "
        "  max(ts) "
        "from agent.messages where platform='discord' "
        "group by channel_id, workspace_id "
        "having max(message_id::numeric) filter (where ts < " + sql_literal(before_ts) + ") is not null "
        "order by max(ts) desc;"
    )
    rows = []
    for line in out.splitlines():
        line = line.strip()
        if not line or "|" not in line:
            continue
        parts = line.split("|")
        if len(parts) < 4:
            continue
        rows.append({
            "channel_id": parts[0],
            "workspace_id": parts[1],
            "after_id": parts[2],
            "last_ts": parts[3],
        })
    return rows


def message_text(msg):
    parts = []
    if msg.get("content"):
        parts.append(msg["content"])
    for attachment in msg.get("attachments") or []:
        name = attachment.get("filename") or attachment.get("url")
        if name:
            parts.append(f"[attachment: {name}]")
    for embed in msg.get("embeds") or []:
        if embed.get("title"):
            parts.append(embed["title"])
        if embed.get("description"):
            parts.append(embed["description"])
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
        thread_id = (msg.get("message_reference") or {}).get("message_id") or msg_id
        values.append(
            "(" + ",".join([
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
            ]) + ")"
        )
    if not values:
        return 0
    sql = (
        "insert into agent.messages"
        "(platform, workspace_id, channel_id, message_id, thread_id, sender_id, "
        "sender_name, text, ts, raw) values\n"
        + ",".join(values)
        + "\non conflict (platform, workspace_id, channel_id, message_id) do update set\n"
        "  thread_id = excluded.thread_id, sender_id = excluded.sender_id,\n"
        "  sender_name = excluded.sender_name, text = excluded.text,\n"
        "  ts = excluded.ts, raw = excluded.raw;"
    )
    run_psql(sql)
    return len(values)


def backfill_channel(login, ch, max_pages):
    """Forward-paginate from ch['after_id'] until caught up. Discord returns
    messages newest-first even with `after`, so we page by advancing `after`
    to the max id we've seen."""
    after = ch["after_id"]
    channel_id = ch["channel_id"]
    workspace_id = ch["workspace_id"]
    total = 0
    for _ in range(max_pages):
        page = discord_call(
            login["token"],
            f"/channels/{channel_id}/messages",
            {"limit": 100, "after": after},
        )
        if isinstance(page, dict) and page.get("__error__"):
            return total, page["__error__"]
        if not page:
            break
        inserted = insert_messages(workspace_id, channel_id, page)
        total += inserted
        # `after` paging returns up to 100 newest-after-cursor; advance cursor.
        max_id = max(int(m["id"]) for m in page if m.get("id"))
        after = str(max_id)
        if len(page) < 100:
            break
        time.sleep(PAGE_SLEEP)
    return total, None


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Backfill Discord gap after bridge logout")
    parser.add_argument("--max-pages", type=int, default=20,
                        help="max 100-message pages per channel (default 20 = up to 2000 msgs/channel)")
    parser.add_argument("--before", default="2026-06-04 05:50:00+00",
                        help="logout boundary: cursor is the last message id stored before this "
                             "timestamp, so paging covers the gap (default = the 6/4 logout)")
    parser.add_argument("--only-since", default=None,
                        help="skip channels whose last stored ts is older than this ISO date "
                             "(e.g. 2026-05-20); avoids touching long-dead channels")
    parser.add_argument("--dry-run", action="store_true",
                        help="list channels that would be backfilled, fetch nothing")
    args = parser.parse_args()

    login = get_login()
    channels = monitored_channels(args.before)
    if args.only_since:
        cutoff = args.only_since
        channels = [c for c in channels if c["last_ts"] >= cutoff]

    print(f"login=@{login['discord_id']}  monitored_channels={len(channels)}", flush=True)
    if args.dry_run:
        for c in channels:
            print(f"  would backfill {c['channel_id']} (last={c['last_ts']})")
        return

    grand_total = 0
    skipped = []
    for i, ch in enumerate(channels, 1):
        try:
            n, err = backfill_channel(login, ch, args.max_pages)
        except Exception as e:  # noqa: BLE001 — one bad channel shouldn't abort the run
            print(f"[{i}/{len(channels)}] {ch['channel_id']} ERROR {e}", flush=True)
            skipped.append((ch["channel_id"], str(e)))
            continue
        grand_total += n
        tag = f" (no-access {err})" if err else ""
        if n or err:
            print(f"[{i}/{len(channels)}] {ch['channel_id']} +{n}{tag}", flush=True)

    print(json.dumps({"channels": len(channels), "inserted": grand_total,
                      "skipped": len(skipped)}, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()

