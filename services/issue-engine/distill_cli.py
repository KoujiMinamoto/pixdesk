"""Command-line: distill one channel.

Usage:
  python3 distill_cli.py "<channel_name_substring>"          # one channel
  python3 distill_cli.py --pk slack T0700DDQN3E C098Y1T1A79  # exact PK
  python3 distill_cli.py --reset "<channel_name>"            # wipe issues + memory first
  python3 distill_cli.py --force-full "<channel_name>"       # ignore memory, re-bootstrap
"""
from __future__ import annotations

import os
import sys

import psycopg2
import psycopg2.extras

import distill
from config import SCHEMA

DATABASE_URL = os.environ["DATABASE_URL"]


def find_channels(conn, key: str) -> list[dict]:
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """SELECT platform, workspace_id, channel_id, channel_name
               FROM agent.channels
               WHERE channel_name ILIKE %s
               ORDER BY channel_name""",
            (f"%{key}%",),
        )
        return [dict(r) for r in cur.fetchall()]


def reset_channel(conn, channel: dict) -> None:
    """Wipe ALL issues + channel memory for this channel. Used to re-bootstrap
    a channel that was previously processed with the (worse) heuristic path.
    Cleans merge_links first because its FK to issues is deferrable but
    psycopg2's autocommit-off + commit on each statement defeats the deferral."""
    pk = (channel["platform"], channel["workspace_id"], channel["channel_id"])
    with conn.cursor() as cur:
        # 1. delete merge_links rows referencing any issue in this channel
        cur.execute(
            f"""DELETE FROM {SCHEMA}.merge_links ml
               WHERE EXISTS (SELECT 1 FROM {SCHEMA}.issues i
                             WHERE i.id IN (ml.kept_issue_id, ml.merged_issue_id)
                               AND i.customer_platform=%s AND i.customer_workspace_id=%s
                               AND i.customer_channel_id=%s)""",
            pk,
        )
        # 2. null out any cross-issue self-FK (merged_into_issue_id) within the channel
        cur.execute(
            f"""UPDATE {SCHEMA}.issues SET merged_into_issue_id = NULL
               WHERE customer_platform=%s AND customer_workspace_id=%s
                 AND customer_channel_id=%s""",
            pk,
        )
        # 3. delete the issues themselves (cascades to issue_messages, _signals, _history)
        cur.execute(
            f"""DELETE FROM {SCHEMA}.issues
               WHERE customer_platform=%s AND customer_workspace_id=%s
                 AND customer_channel_id=%s""",
            pk,
        )
        deleted = cur.rowcount
        cur.execute(
            f"""DELETE FROM {SCHEMA}.channel_memory
               WHERE platform=%s AND workspace_id=%s AND channel_id=%s""",
            pk,
        )
    conn.commit()
    print(f"  reset: deleted {deleted} issues + memory row")


def main() -> int:
    args = sys.argv[1:]
    do_reset = "--reset" in args
    force_full = "--force-full" in args
    args = [a for a in args if a not in ("--reset", "--force-full")]

    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False

    channels: list[dict]
    if args and args[0] == "--pk":
        if len(args) < 4:
            print("usage: --pk <platform> <workspace_id> <channel_id>", file=sys.stderr)
            return 2
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """SELECT platform, workspace_id, channel_id, channel_name
                   FROM agent.channels WHERE platform=%s AND workspace_id=%s AND channel_id=%s""",
                tuple(args[1:4]),
            )
            row = cur.fetchone()
        if not row:
            print(f"no channel for pk={args[1:4]}", file=sys.stderr)
            return 2
        channels = [dict(row)]
    elif args:
        channels = find_channels(conn, args[0])
        if not channels:
            print(f"no channels matching {args[0]!r}", file=sys.stderr)
            return 2
    else:
        print(__doc__, file=sys.stderr)
        return 2

    print(f"matched {len(channels)} channel(s):")
    for c in channels:
        print(f"  {c['platform']}/{c['workspace_id']}/{c['channel_id']}  {c.get('channel_name')!r}")

    for c in channels:
        print(f"\n=== distilling {c.get('channel_name')!r} ===")
        if do_reset:
            reset_channel(conn, c)
        result = distill.run(conn, c, force_full=force_full)
        print(f"  result: {result}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
