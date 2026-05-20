#!/usr/bin/env python3
"""Redact (delete) Matrix events previously injected by backfill-to-matrix.py.

Reads agent.messages rows where matrix_event_id IS NOT NULL, calls Matrix
redact API using the AS token while impersonating the same ghost MXID that
sent the event, then clears matrix_event_id/matrix_room_id in Postgres.
"""

import argparse
import os
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request
import urllib.error
import json

PROJECT_DIR = os.environ.get(
    "PIXDESK_PROJECT_DIR",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..")),
)
DISCORD_REGISTRATION = os.environ.get(
    "PIXDESK_DISCORD_REGISTRATION",
    os.path.join(PROJECT_DIR, "data/mautrix-discord/registration.yaml"),
)
HOMESERVER = os.environ.get("MATRIX_HOMESERVER", "http://localhost:8008")
SERVER_NAME = os.environ.get("MATRIX_SERVER_NAME", "192.168.72.185")
SLEEP_BETWEEN = float(os.environ.get("REDACT_SLEEP_SECONDS", "0.03"))

PSQL = [
    "docker", "compose", "exec", "-T", "postgres",
    "psql", "-U", "synapse", "-d", "synapse",
    "-v", "ON_ERROR_STOP=1",
]


def run_psql(sql):
    proc = subprocess.run(PSQL, input=sql, text=True, cwd=PROJECT_DIR, capture_output=True)
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
    raise SystemExit("Could not find AS token")


def fetch_injected(channel_id):
    sql = f"""
\\pset format unaligned
\\pset tuples_only on
select message_id || '\t' || sender_id || '\t' || matrix_room_id || '\t' || matrix_event_id
from agent.messages
where platform = 'discord'
  and channel_id = {sql_literal(channel_id)}
  and matrix_event_id is not null
  and matrix_event_id != ''
order by ts asc;
"""
    out = run_psql(sql)
    rows = []
    for line in out.splitlines():
        if not line or "\t" not in line:
            continue
        parts = line.split("\t")
        if len(parts) < 4:
            continue
        rows.append({
            "message_id": parts[0],
            "sender_id": parts[1],
            "room_id": parts[2],
            "event_id": parts[3],
        })
    return rows


def redact_event(room_id, event_id, ghost_mxid, as_token, txn):
    path = (
        f"/_matrix/client/v3/rooms/{urllib.parse.quote(room_id)}"
        f"/redact/{urllib.parse.quote(event_id)}/{txn}"
    )
    params = {"access_token": as_token, "user_id": ghost_mxid}
    url = HOMESERVER + path + "?" + urllib.parse.urlencode(params)
    data = json.dumps({"reason": "backfill replay"}).encode()
    req = urllib.request.Request(url, data=data, method="PUT")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as err:
        body_text = err.read().decode(errors="replace")
        raise RuntimeError(f"redact -> HTTP {err.code} {body_text}") from err


def clear_matrix_columns(channel_id):
    sql = (
        "update agent.messages set matrix_event_id = null, matrix_room_id = null "
        "where platform = 'discord' and channel_id = "
        + sql_literal(channel_id)
        + " and matrix_event_id is not null;"
    )
    run_psql(sql)


def main(channel_id, dry_run):
    as_token = load_as_token()
    rows = fetch_injected(channel_id)
    print(f"injected events to redact: {len(rows)}")
    if not rows:
        return
    if dry_run:
        print("[dry-run] would redact:")
        for r in rows[:5]:
            print(f"  {r['event_id']} (sender={r['sender_id']})")
        if len(rows) > 5:
            print(f"  ... and {len(rows) - 5} more")
        return

    ok = 0
    failed = 0
    for i, r in enumerate(rows, 1):
        ghost = f"@discord_{r['sender_id']}:{SERVER_NAME}"
        txn = f"redact-backfill-{r['message_id']}-{int(time.time() * 1000)}"
        try:
            redact_event(r["room_id"], r["event_id"], ghost, as_token, txn)
            ok += 1
        except Exception as e:
            failed += 1
            print(f"  {r['event_id']} failed: {e}", file=sys.stderr)
        if i % 50 == 0:
            print(f"  progress: {i}/{len(rows)} ok={ok} failed={failed}")
        time.sleep(SLEEP_BETWEEN)

    print(f"done: redacted={ok} failed={failed}")
    if ok > 0:
        clear_matrix_columns(channel_id)
        print(f"cleared matrix_event_id columns for {channel_id}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--channel", required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    main(args.channel, args.dry_run)
