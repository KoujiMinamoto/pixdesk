"""Weekly summary metrics — computed on a schedule (Thu 15:00 Asia/Shanghai).

Writes one row per (window, metric) into <SCHEMA>.weekly_stats. Re-running the
same window overwrites (ON CONFLICT). Currently computes:

  first_response_p50_minutes — median (P50) minutes from a customer's opening
      message to our next agent reply in the same channel, over a rolling 7-day
      window. Same 口径 as docs/okr-q2-response-time.md, but sourced from
      issue_tc.issue_messages (distill-labelled role), per user decision
      2026-07-09. "Opening message" = a customer message whose previous message
      in that channel was NOT the customer (so a burst of follow-ups counts once,
      not once per line). A customer message with no agent reply after it (within
      the data) is excluded — matches OKR (无穷大不纳入中位数).

  penetration_rate — placeholder NULL (NA). Formula TBD; added as a row now so
      the table/consumers already see the metric key.

Run (no args = rolling 7 days ending now):
  docker exec pixdesk-issue-engine python3 /app/weekly_stats.py
"""
from __future__ import annotations

import datetime as dt
import os

import psycopg2
import psycopg2.extras

from config import SCHEMA

DATABASE_URL = os.environ["DATABASE_URL"]
WINDOW_DAYS = int(os.environ.get("WEEKLY_STATS_WINDOW_DAYS", "7"))
UTC = dt.timezone.utc


def compute_first_response_p50(cur, win_start, win_end):
    """Return (p50_minutes, sample_n). P50 over each customer 'opening' message's
    minutes-to-next-agent-reply, for openings in [win_start, win_end)."""
    cur.execute(
        f"""
        WITH ordered AS (
          SELECT platform, workspace_id, channel_id, message_id, role, ts,
                 LAG(role) OVER w AS prev_role
          FROM {SCHEMA}.issue_messages
          WHERE role IN ('customer','agent') AND ts IS NOT NULL
          WINDOW w AS (PARTITION BY platform, workspace_id, channel_id ORDER BY ts, message_id)
        ),
        openings AS (
          -- a customer message that STARTS a customer turn (prev wasn't customer)
          SELECT platform, workspace_id, channel_id, ts AS cust_ts
          FROM ordered
          WHERE role='customer' AND (prev_role IS DISTINCT FROM 'customer')
            AND ts >= %s AND ts < %s
        ),
        responded AS (
          SELECT o.cust_ts,
                 (SELECT min(a.ts) FROM {SCHEMA}.issue_messages a
                   WHERE a.platform=o.platform AND a.workspace_id=o.workspace_id
                     AND a.channel_id=o.channel_id AND a.role='agent'
                     AND a.ts > o.cust_ts) AS reply_ts
          FROM openings o
        )
        SELECT
          percentile_cont(0.5) WITHIN GROUP (
            ORDER BY EXTRACT(EPOCH FROM (reply_ts - cust_ts))/60.0
          ) AS p50_minutes,
          count(*) FILTER (WHERE reply_ts IS NOT NULL) AS sample_n
        FROM responded
        WHERE reply_ts IS NOT NULL
        """,
        (win_start, win_end),
    )
    row = cur.fetchone()
    p50 = row["p50_minutes"]
    return (round(float(p50), 1) if p50 is not None else None,
            int(row["sample_n"] or 0))


def upsert(cur, win_start, win_end, metric, value, sample_n, detail):
    cur.execute(
        f"""INSERT INTO {SCHEMA}.weekly_stats
              (win_start, win_end, metric, value, sample_n, detail, computed_at)
            VALUES (%s,%s,%s,%s,%s,%s, now())
            ON CONFLICT (win_start, win_end, metric) DO UPDATE SET
              value=EXCLUDED.value, sample_n=EXCLUDED.sample_n,
              detail=EXCLUDED.detail, computed_at=now()""",
        (win_start, win_end, metric, value, sample_n,
         psycopg2.extras.Json(detail)),
    )


def main() -> None:
    # Align win_end to the top of the current hour so re-runs on the same day
    # (or a cron retry) hit ON CONFLICT and OVERWRITE rather than inserting a new
    # row each time. With microsecond-precise now() the UNIQUE(win_start,win_end,
    # metric) key never collides — the alignment is what makes upsert idempotent.
    now = dt.datetime.now(UTC)
    win_end = now.replace(minute=0, second=0, microsecond=0)
    win_start = win_end - dt.timedelta(days=WINDOW_DAYS)
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            p50, n = compute_first_response_p50(cur, win_start, win_end)
            upsert(cur, win_start, win_end, "first_response_p50_minutes",
                   p50, n, {"window_days": WINDOW_DAYS, "source": "issue_messages"})
            # penetration_rate: NA placeholder until its formula is defined.
            upsert(cur, win_start, win_end, "penetration_rate",
                   None, None, {"status": "NA - formula TBD"})
        conn.commit()
        print(f"[weekly_stats] {win_start.isoformat()} .. {win_end.isoformat()}")
        print(f"  first_response_p50_minutes = {p50} (n={n})")
        print(f"  penetration_rate = NA")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
