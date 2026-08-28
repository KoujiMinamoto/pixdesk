#!/usr/bin/env python3
"""Bridge connection-status probe (runs on 185, where the mautrix bridges live).

Parses the mautrix-discord / mautrix-slack container logs for real gateway
connection lifecycle events ("Connected to Discord", "Disconnected from Discord",
"successfully reconnected to gateway", etc.) and pushes the *true* connection
state to the Tencent pixdesk-pg `agent.bridge_status` table via the existing
185->Tencent SSH-out trust (same plumbing as nova-sync.py).

This is distinct from message-freshness: a channel can be silent for hours while
the bridge's websocket is perfectly healthy (Discord keeps heartbeating). Reading
the lifecycle log tells us whether the bridge is actually connected.

Env (all optional, sane defaults):
  BRIDGE_DISCORD_CONTAINER  default beeper-matrix-mautrix-discord-1
  BRIDGE_SLACK_CONTAINER    default beeper-matrix-mautrix-slack-1
  NOVA_TENCENT_SSH          default root@124.221.98.230
  NOVA_TENCENT_SSH_KEY      default /root/.ssh/pixdesk-pg-tunnel
  NOVA_TENCENT_SSH_KNOWN    default /root/.ssh/pixdesk-pg-tunnel.known_hosts
  NOVA_PG_CONTAINER/USER/DB default pixdesk-pg / synapse / synapse
"""
import os
import re
import subprocess
import sys
from datetime import datetime, timezone

SSH_HOST = os.environ.get("NOVA_TENCENT_SSH", "root@124.221.98.230")
SSH_KEY = os.environ.get("NOVA_TENCENT_SSH_KEY", "/root/.ssh/pixdesk-pg-tunnel")
SSH_KNOWN = os.environ.get("NOVA_TENCENT_SSH_KNOWN", "/root/.ssh/pixdesk-pg-tunnel.known_hosts")
PG_CONTAINER = os.environ.get("NOVA_PG_CONTAINER", "pixdesk-pg")
PG_USER = os.environ.get("NOVA_PG_USER", "synapse")
PG_DB = os.environ.get("NOVA_PG_DB", "synapse")

BRIDGES = {
    "discord": os.environ.get("BRIDGE_DISCORD_CONTAINER", "beeper-matrix-mautrix-discord-1"),
    "slack": os.environ.get("BRIDGE_SLACK_CONTAINER", "beeper-matrix-mautrix-slack-1"),
}

# Lifecycle markers. (regex, connected?, label). Order doesn't matter; we keep the
# latest by timestamp. Covers both discord and slack mautrix phrasings.
MARKERS = [
    (re.compile(r"Connected to (Discord|Slack)", re.I), True, "connected"),
    (re.compile(r"connection resumed", re.I), True, "resumed"),
    (re.compile(r"successfully reconnected to gateway", re.I), True, "reconnected"),
    (re.compile(r"Disconnected from (Discord|Slack)", re.I), False, "disconnected"),
    (re.compile(r"closing gateway websocket", re.I), False, "ws_closing"),
    (re.compile(r"Websocket closed|connection error|failed to connect", re.I), False, "ws_error"),
]
# Leading RFC3339 timestamp the bridges print (with optional ANSI color codes).
# discord: ...T07:03:28Z  slack(bridgev2): ...T07:15:01.604Z (millis) — millis optional.
TS_RE = re.compile(r"(?:\x1b\[[0-9;]*m)?(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.\d+)?Z")
RECONNECT_RE = re.compile(r"reconnect|reconnected|connection resumed", re.I)
# Slack's mautrix (bridgev2) doesn't log "Connected" lifecycle lines — it streams
# RTM / event-loop activity instead. A recent line of any of these means the RTM
# socket is live. Used as the liveness signal when no lifecycle marker is found.
ACTIVITY_RE = re.compile(
    r"handle slack event|handle remote event|RTM|event_loop_index|"
    r"user resync loop|Sent message part|Handling remote event", re.I)


def log(msg):
    print(f"[bridge-status] {msg}", flush=True)


def _parse_ts(line):
    m = TS_RE.search(line)
    if not m:
        return None
    try:
        return datetime.strptime(m.group(1), "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def probe(container):
    """Return (connected, last_event, last_event_at_iso, reconnects_24h, detail)."""
    try:
        out = subprocess.run(
            ["docker", "logs", "--since", "24h", container],
            capture_output=True, timeout=60,
        )
    except Exception as e:
        return (None, "probe_error", None, 0, str(e)[:200])
    text = (out.stdout + out.stderr).decode("utf-8", "replace")
    lines = text.splitlines()
    latest = None        # (ts, connected, label) — newest lifecycle marker
    last_activity = None  # newest RTM / event-loop activity line
    reconnects = 0
    for ln in lines:
        if RECONNECT_RE.search(ln) and "trying to reconnect" not in ln.lower():
            reconnects += 1
        matched = False
        for rx, conn, label in MARKERS:
            if rx.search(ln):
                ts = _parse_ts(ln)
                if ts and (latest is None or ts >= latest[0]):
                    latest = (ts, conn, label)
                matched = True
                break
        if not matched and ACTIVITY_RE.search(ln):
            ts = _parse_ts(ln)
            if ts and (last_activity is None or ts > last_activity):
                last_activity = ts

    now = datetime.now(timezone.utc)
    up = subprocess.run(
        ["docker", "inspect", "-f", "{{.State.Running}}", container],
        capture_output=True, timeout=15,
    ).stdout.decode().strip() == "true"

    # Activity (real traffic) beats a stale lifecycle marker. mautrix bridgev2
    # (slack) logs a "Disconnected" but recovers silently — if RTM traffic is
    # newer than the last marker, the socket is back. Pick whichever is newer.
    act_age = (now - last_activity).total_seconds() if last_activity else None
    if last_activity is not None and (latest is None or last_activity >= latest[0]):
        if act_age <= 3600:
            return (True, "rtm_active", last_activity.isoformat(), reconnects, None)
        # traffic but stale (>1h): fall through to marker if it's connected,
        # else report quiet.
        if latest is None or not latest[1]:
            return (up or None, "rtm_quiet", last_activity.isoformat(),
                    reconnects, "no RTM activity >1h")
    if latest is not None:
        return (latest[1], latest[2], latest[0].isoformat(), reconnects, None)
    if last_activity is not None:
        conn = True if act_age <= 3600 else (up or None)
        return (conn, "rtm_active" if act_age <= 3600 else "rtm_quiet",
                last_activity.isoformat(), reconnects,
                None if act_age <= 3600 else "no RTM activity >1h")
    return (up or None, "no_lifecycle_event", None,
            reconnects, "running" if up else "container_down")
    return (latest[1], latest[2], latest[0].isoformat(), reconnects, None)


def _sql_str(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, int):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def run_sql(sql):
    ssh = [
        "ssh", "-i", SSH_KEY, "-o", "IdentitiesOnly=yes",
        "-o", f"UserKnownHostsFile={SSH_KNOWN}", "-o", "BatchMode=yes",
        "-o", "ConnectTimeout=15", SSH_HOST,
        f"docker exec -i {PG_CONTAINER} psql -U {PG_USER} -d {PG_DB} -v ON_ERROR_STOP=1",
    ]
    p = subprocess.run(ssh, input=sql.encode(), capture_output=True)
    if p.returncode != 0:
        log(f"psql failed rc={p.returncode}: {p.stderr.decode()[:400]}")
        return False
    return True


def main():
    rows = []
    for platform, container in BRIDGES.items():
        connected, last_event, last_at, reconnects, detail = probe(container)
        log(f"{platform}: connected={connected} event={last_event} at={last_at} "
            f"reconnects24h={reconnects} detail={detail}")
        rows.append((platform, connected, last_event, last_at, reconnects, detail))
    values = []
    for platform, connected, last_event, last_at, reconnects, detail in rows:
        # NULL connected -> store as false with detail, so the dashboard can show "unknown".
        conn_sql = _sql_str(False if connected is None else connected)
        at_sql = "NULL" if not last_at else f"'{last_at}'::timestamptz"
        det = detail if connected is not None else (detail or "unknown")
        values.append(
            f"({_sql_str(platform)}, {conn_sql}, {_sql_str(last_event)}, {at_sql}, "
            f"{int(reconnects)}, {_sql_str(det)}, now())"
        )
    sql = (
        "INSERT INTO agent.bridge_status "
        "(platform, connected, last_event, last_event_at, reconnects_24h, detail, reported_at) "
        "VALUES " + ", ".join(values) + " "
        "ON CONFLICT (platform) DO UPDATE SET "
        "connected=EXCLUDED.connected, last_event=EXCLUDED.last_event, "
        "last_event_at=EXCLUDED.last_event_at, reconnects_24h=EXCLUDED.reconnects_24h, "
        "detail=EXCLUDED.detail, reported_at=now();"
    )
    ok = run_sql(sql)
    log("pushed OK" if ok else "push FAILED")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
