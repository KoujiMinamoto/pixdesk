"""PixDesk Issue Engine — auto problem-detection & closure tracking.

Two roles in one process:
  * a background thread runs the heuristic detector on a POLL_SECONDS cadence
    (or a one-shot backfill when ISSUE_BACKFILL=1, after which the loop resumes);
  * a FastAPI app serves read endpoints for the dashboard/BFF and /healthz.

Each role uses its OWN psycopg2 connection so the detector's long backfill never
starves dashboard reads, and neither shares ticket-api's single connection.

P1 scope: detection + non-closure flags + read endpoints. The human-action write
endpoints (confirm/reject/merge/promote) and reviewer auth land in P2.
"""
from __future__ import annotations

import logging
import os
import re
import threading
import time
from typing import Any, Optional

import psycopg2
import psycopg2.extras
import psycopg2.pool
from fastapi import Depends, FastAPI, Header, HTTPException, Query, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

import config
from config import SCHEMA, TIME_FLOOR
import detector
import distill
import cluster_merge
import closure_agent

# Dashboard read endpoints filter by last_activity_at >= TIME_FLOOR. Built once
# so every endpoint shares the same predicate. Two flavors because some queries
# use an alias and some don't:
TIME_FLOOR_BARE = f"last_activity_at >= '{TIME_FLOOR}'" if TIME_FLOOR else "TRUE"
TIME_FLOOR_ALIAS = f"i.last_activity_at >= '{TIME_FLOOR}'" if TIME_FLOOR else "TRUE"

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("issue-engine")

MXID_RE = re.compile(r"^@[A-Za-z0-9._=/+-]+:[A-Za-z0-9.-]+$")

app = FastAPI(title="PixDesk Issue Engine", version="0.1.0")

# Read endpoints are sync `def`, so Starlette runs them across an anyio
# threadpool. A single shared psycopg2 connection is NOT safe there (concurrent
# use + cross-request rollback), so reads use a small thread-safe pool. The
# detector thread keeps its OWN dedicated connection, entirely separate.
_pool: Optional[psycopg2.pool.ThreadedConnectionPool] = None
_stop = threading.Event()


def _get_pool() -> psycopg2.pool.ThreadedConnectionPool:
    global _pool
    if _pool is None:
        _pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=1, maxconn=8, dsn=config.DATABASE_URL
        )
    return _pool


class _PooledConn:
    """Context manager: borrow a connection, always roll back (read-only) and
    return it to the pool, even on error."""

    def __enter__(self):
        self.conn = _get_pool().getconn()
        return self.conn

    def __exit__(self, *exc):
        try:
            self.conn.rollback()
        except Exception:
            pass
        try:
            _get_pool().putconn(self.conn)
        except Exception:
            pass
        return False


def require_secret(authorization: str = Header(default="")) -> None:
    """Gate endpoints when a shared secret is configured. P1 read endpoints are
    localhost-only; if no secret is set we allow (lab), else we enforce it."""
    if not config.ISSUE_API_SHARED_SECRET:
        return
    if authorization != f"Bearer {config.ISSUE_API_SHARED_SECRET}":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid bearer token")


def require_actor(x_actor_mxid: str = Header(default="")) -> str:
    """The human who triggered the action — recorded in issue_history.actor_mxid.
    The BFF injects this from the signed session cookie; the engine trusts it."""
    if not x_actor_mxid or not MXID_RE.match(x_actor_mxid):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "X-Actor-Mxid header required (@user:server)")
    return x_actor_mxid


# ---------------------------------------------------------------------------
# Background detector thread
# ---------------------------------------------------------------------------

def _detector_loop() -> None:
    conn = detector.connect()
    log.info("detector thread started (backend=%s, backfill=%s)",
             config.LLM_BACKEND, config.BACKFILL)
    if config.BACKFILL:
        try:
            result = detector.backfill(conn)
            log.info("backfill complete: %s", result)
        except Exception:
            log.exception("backfill failed")
    while not _stop.is_set():
        try:
            result = detector.tick(conn)
            if result["issues_touched"]:
                log.info("tick: %s", result)
        except Exception:
            log.exception("tick failed; reconnecting")
            try:
                conn.close()
            except Exception:
                pass
            conn = detector.connect()
        _stop.wait(config.POLL_SECONDS)


def _distill_loop() -> None:
    """Periodically re-distill every channel that has a channel_memory row.
    The first row for any channel is created manually via distill_cli.py
    --reset (P5d bootstrap); after that, this loop keeps it fresh.

    Default interval: 12 h. Override with ISSUE_DISTILL_INTERVAL_SECONDS.
    Each pass walks every opted-in channel sequentially; per-channel
    distill.run is incremental (reads watermark, only sends new messages)
    so cost scales with new traffic, not channel size."""
    interval = int(os.environ.get("ISSUE_DISTILL_INTERVAL_SECONDS", "43200"))
    # Wait a bit on startup so detector + DB are warm before the first pass.
    _stop.wait(60)
    log.info("distill thread started (interval=%ds)", interval)
    while not _stop.is_set():
        try:
            conn = psycopg2.connect(config.DATABASE_URL)
            conn.autocommit = False
            # Auto-discover NEW customer channels (have customer traffic but no
            # channel_memory row yet) and bootstrap them, so new groups land on
            # the dashboard without manual CLI seeding. distill.run writes their
            # channel_memory row, so the next pass treats them as incremental.
            try:
                new_chs = distill.discover_channels(conn)
                if new_chs:
                    log.info("discovered %d new customer channels", len(new_chs))
                for ch in new_chs:
                    try:
                        res = distill.run(conn, ch, force_full=True)
                        log.info("distill(new): %s -> %s", ch.get("channel_name"), res)
                    except Exception:
                        conn.rollback()
                        log.exception("bootstrap failed for %s", ch.get("channel_name"))
            except Exception:
                conn.rollback()
                log.exception("channel discovery failed")
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(
                    f"""SELECT cm.platform, cm.workspace_id, cm.channel_id,
                              cm.channel_name, cm.last_distilled_ts
                       FROM {SCHEMA}.channel_memory cm
                       ORDER BY cm.last_run_at NULLS FIRST"""
                )
                channels = [dict(r) for r in cur.fetchall()]
            log.info("distill pass: %d opted-in channels", len(channels))
            for ch in channels:
                try:
                    res = distill.run(conn, ch)
                    log.info("distill: %s -> %s", ch.get("channel_name"), res)
                except Exception:
                    conn.rollback()
                    log.exception("distill failed for %s", ch.get("channel_name"))
                    continue
                # Auto cluster-merge after distill produced new work. Skip
                # when no issues were emitted (incremental ticks for quiet
                # channels would otherwise spend a Sonnet call to find no
                # duplicates).
                if (res or {}).get("issues_emitted", 0) > 0:
                    try:
                        cm = cluster_merge.run(conn, ch, apply=True, verbose=False)
                        log.info("cluster_merge: %s -> %s", ch.get("channel_name"), cm)
                    except Exception:
                        conn.rollback()
                        log.exception("cluster_merge failed for %s", ch.get("channel_name"))
                    # Closure agent: re-judge this channel's pending issues with
                    # the autonomous tool-use loop (reads real transcripts, sets
                    # closed_inferred/awaiting_*). Only the channel's own pending
                    # set, so cost scales with new work.
                    try:
                        pend = closure_agent.fetch_pending_for_channel(
                            conn, ch["platform"], ch["workspace_id"], ch["channel_id"])
                        if pend:
                            ca = closure_agent.run_batch(conn, pend)
                            log.info("closure_agent: %s -> %s", ch.get("channel_name"), ca)
                    except Exception:
                        conn.rollback()
                        log.exception("closure_agent failed for %s", ch.get("channel_name"))
            try:
                conn.close()
            except Exception:
                pass
        except Exception:
            log.exception("distill pass failed")
        _stop.wait(interval)


@app.on_event("startup")
def _startup() -> None:
    _get_pool()  # warm the read pool
    threading.Thread(target=_detector_loop, name="detector", daemon=True).start()
    threading.Thread(target=_distill_loop, name="distill", daemon=True).start()
    log.info("issue-engine started")


@app.on_event("shutdown")
def _shutdown() -> None:
    _stop.set()
    if _pool is not None:
        try:
            _pool.closeall()
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Read endpoints
# ---------------------------------------------------------------------------

@app.get("/healthz")
def healthz() -> Any:
    try:
        with _PooledConn() as conn:
            with conn.cursor() as cur:
                cur.execute(f"SELECT count(*) FROM {SCHEMA}.issues")
                n = cur.fetchone()[0]
        return {"ok": True, "issues": n, "llm_backend": config.LLM_BACKEND}
    except Exception as exc:
        return JSONResponse({"ok": False, "error": str(exc)}, status_code=503)


def _rows(cur) -> list[dict[str, Any]]:
    out = []
    for r in cur.fetchall():
        d = dict(r)
        for k, v in list(d.items()):
            if hasattr(v, "isoformat"):
                d[k] = v.isoformat()
        if d.get("id") is not None:
            d["id"] = str(d["id"])
        for uuid_key in ("conversation_id", "ticket_id", "merged_into_issue_id"):
            if d.get(uuid_key) is not None:
                d[uuid_key] = str(d[uuid_key])
        out.append(d)
    return out


@app.get("/v1/issues", dependencies=[Depends(require_secret)])
def list_issues(
    nonclosure_only: bool = Query(False),
    customer_workspace_id: Optional[str] = None,
    customer_platform: Optional[str] = None,
    lifecycle_state: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> Any:
    where = ["lifecycle_state NOT IN ('closed_confirmed','dismissed')",
             TIME_FLOOR_BARE]
    args: list[Any] = []
    if nonclosure_only:
        where.append("nonclosure_reason IS NOT NULL")
    if customer_workspace_id:
        where.append("customer_workspace_id = %s")
        args.append(customer_workspace_id)
    if customer_platform:
        where.append("customer_platform = %s")
        args.append(customer_platform)
    if lifecycle_state:
        where.append("lifecycle_state = %s")
        args.append(lifecycle_state)
    sql = f"""
        SELECT id, code, conversation_id, customer_platform, customer_workspace_id,
               customer_channel_id, external_party_name, title, lifecycle_state,
               review_state, nonclosure_reason, closure_reason, last_speaker,
               last_customer_at, last_agent_at, message_count, opened_at,
               last_activity_at, sla_due_at, reopened_count
        FROM {SCHEMA}.issues
        WHERE {' AND '.join(where)}
        ORDER BY (nonclosure_reason IS NOT NULL) DESC, last_activity_at ASC
        LIMIT %s OFFSET %s
    """
    args.extend([limit, offset])
    with _PooledConn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, args)
            items = _rows(cur)
    return {"items": items, "count": len(items)}


@app.get("/v1/issues/unclosed", dependencies=[Depends(require_secret)])
def unclosed() -> Any:
    """The 未闭环 headline list: every flagged-open issue, stalest first."""
    with _PooledConn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"""
                SELECT i.id, i.code, i.customer_platform, i.customer_workspace_id,
                       i.external_party_name, i.title, i.lifecycle_state,
                       i.nonclosure_reason, i.last_speaker, i.last_customer_at,
                       i.sla_due_at, i.last_activity_at,
                       ch.channel_name
                FROM {SCHEMA}.issues i
                LEFT JOIN agent.channels ch
                  ON ch.platform = i.customer_platform
                 AND ch.workspace_id = i.customer_workspace_id
                 AND ch.channel_id = i.customer_channel_id
                WHERE i.nonclosure_reason IS NOT NULL
                  AND i.review_state = 'unreviewed'
                  AND i.lifecycle_state NOT IN ('closed_confirmed','dismissed')
                  AND {TIME_FLOOR_ALIAS}
                ORDER BY i.last_activity_at ASC
                LIMIT 500
                """
            )
            items = _rows(cur)
    return {"items": items, "count": len(items)}


@app.get("/v1/customers/rollup", dependencies=[Depends(require_secret)])
def rollup() -> Any:
    """Per-channel rollup. One row per (platform, workspace_id, channel_id) so
    Slack workspaces with many ext channels show each one separately. Returns
    counts for both unclosed (ball in our court) and closed_inferred so the UI
    can render a progress bar per customer."""
    with _PooledConn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"""
                SELECT i.customer_platform, i.customer_workspace_id,
                       i.customer_channel_id,
                       max(ch.channel_name) AS channel_name,
                       (SELECT array_agg(DISTINCT p)
                          FROM {SCHEMA}.issues i2,
                               jsonb_array_elements_text(
                                 COALESCE(i2.metadata->'products','[]'::jsonb)) AS p
                         WHERE i2.customer_platform = i.customer_platform
                           AND i2.customer_workspace_id = i.customer_workspace_id
                           AND i2.customer_channel_id = i.customer_channel_id
                           AND i2.lifecycle_state <> 'dismissed'
                           AND i2.review_state <> 'rejected') AS products,
                       count(*) FILTER (WHERE i.nonclosure_reason IS NOT NULL
                                          AND i.lifecycle_state NOT IN ('closed_confirmed','dismissed','closed_inferred')
                                          AND i.review_state = 'unreviewed') AS unclosed,
                       count(*) FILTER (WHERE i.lifecycle_state = 'closed_inferred'
                                          AND i.review_state = 'unreviewed') AS suggested_closed,
                       count(*) FILTER (WHERE i.lifecycle_state IN ('closed_confirmed','closed_inferred')
                                         OR i.review_state = 'confirmed') AS closed,
                       count(*) FILTER (WHERE i.lifecycle_state NOT IN ('dismissed')
                                          AND NOT (i.review_state='rejected')) AS total,
                       min(i.last_activity_at) FILTER (WHERE i.nonclosure_reason IS NOT NULL
                                          AND i.lifecycle_state NOT IN ('closed_confirmed','dismissed','closed_inferred')
                                          AND i.review_state = 'unreviewed') AS oldest_unclosed_at,
                       max(i.last_activity_at) AS most_recent_at
                FROM {SCHEMA}.issues i
                LEFT JOIN agent.channels ch
                  ON ch.platform = i.customer_platform
                 AND ch.workspace_id = i.customer_workspace_id
                 AND ch.channel_id = i.customer_channel_id
                WHERE i.lifecycle_state <> 'dismissed' AND i.review_state <> 'rejected'
                  AND {TIME_FLOOR_ALIAS}
                GROUP BY i.customer_platform, i.customer_workspace_id,
                         i.customer_channel_id
                HAVING count(*) > 0
                ORDER BY unclosed DESC, suggested_closed DESC, most_recent_at DESC
                """
            )
            items = _rows(cur)
    return {"items": items, "count": len(items)}


@app.get("/v1/dashboard/summary", dependencies=[Depends(require_secret)])
def dash_summary() -> Any:
    """Top-of-page numbers for the dashboard hero strip.

    "This week" = from the most recent Friday 00:00 (local-ish, server UTC) up to
    now. We compute that Friday in SQL: date_trunc('week') is Monday; Friday is
    Monday+4 days, and if that's still in the future (Mon-Thu) step back a week.
    All week-scoped metrics share this `wk_start`. Plus one always-current
    "awaiting us" total."""
    with _PooledConn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"""
                WITH bounds AS (
                  SELECT CASE
                    WHEN (date_trunc('week', now()) + interval '4 days') <= now()
                      THEN date_trunc('week', now()) + interval '4 days'
                      ELSE date_trunc('week', now()) + interval '4 days' - interval '7 days'
                  END AS wk_start
                )
                SELECT
                  (SELECT wk_start FROM bounds) AS week_start,
                  -- week-scoped: customers with any issue active this week
                  count(DISTINCT (customer_platform, customer_workspace_id, customer_channel_id))
                    FILTER (WHERE last_activity_at >= (SELECT wk_start FROM bounds)
                              AND lifecycle_state <> 'dismissed' AND review_state <> 'rejected')
                    AS active_customers,
                  -- new issues opened this week
                  count(*) FILTER (WHERE opened_at >= (SELECT wk_start FROM bounds)
                                     AND lifecycle_state <> 'dismissed' AND review_state <> 'rejected')
                    AS new_issues,
                  -- issues active this week (touched in window, not closed/dismissed)
                  count(*) FILTER (WHERE last_activity_at >= (SELECT wk_start FROM bounds)
                                     AND lifecycle_state NOT IN ('closed_confirmed','closed_inferred','dismissed')
                                     AND review_state <> 'rejected')
                    AS active_issues,
                  -- newly closed this week (inferred or confirmed, closure detected in window)
                  count(*) FILTER (WHERE lifecycle_state IN ('closed_inferred','closed_confirmed')
                                     AND COALESCE(closure_detected_at, closed_at, last_activity_at) >= (SELECT wk_start FROM bounds))
                    AS new_closed,
                  -- always-current: awaiting our reply (not week-scoped)
                  count(*) FILTER (WHERE nonclosure_reason IS NOT NULL
                                     AND lifecycle_state NOT IN ('closed_confirmed','dismissed','closed_inferred')
                                     AND review_state = 'unreviewed') AS awaiting_us
                FROM {SCHEMA}.issues
                WHERE {TIME_FLOOR_BARE}
                """
            )
            row = cur.fetchone()
            # new conversations this week — from agent.conversations, limited to
            # customer channels that have at least one issue (matches dashboard scope).
            cur.execute(
                f"""
                WITH bounds AS (
                  SELECT CASE
                    WHEN (date_trunc('week', now()) + interval '4 days') <= now()
                      THEN date_trunc('week', now()) + interval '4 days'
                      ELSE date_trunc('week', now()) + interval '4 days' - interval '7 days'
                  END AS wk_start
                )
                SELECT count(*) AS new_conversations
                FROM agent.conversations c
                WHERE c.opened_at >= (SELECT wk_start FROM bounds)
                  AND EXISTS (SELECT 1 FROM {SCHEMA}.issues i
                              WHERE i.customer_platform = c.platform
                                AND i.customer_workspace_id = c.workspace_id
                                AND i.customer_channel_id = c.channel_id)
                """
            )
            conv = cur.fetchone()
    out = dict(row) if row else {}
    out["new_conversations"] = (conv or {}).get("new_conversations", 0)
    return out


@app.get("/v1/dashboard/shift", dependencies=[Depends(require_secret)])
def dash_shift(hours: int = Query(8, ge=1, le=72)) -> Any:
    """Shift-review panel. Support runs 3 rotating 8h shifts; at clock-off a
    reviewer opens this to see everything that moved on their watch. Returns the
    issues in a rolling `hours`-hour window (default 8) split into three
    mutually-exclusive buckets:

      closed  — closure detected in-window (terminal state takes priority)
      new     — opened in-window and still open
      active  — opened earlier but had activity in-window (still open)

    Each bucket is a full issue list (same row shape as the customer view) plus
    the channel name so the reviewer can tell customers apart at a glance."""
    with _PooledConn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"""
                WITH bounds AS (
                  SELECT now() - make_interval(hours => %s) AS since
                )
                SELECT i.id, i.code, i.title,
                       (i.metadata->>'summary') AS summary,
                       (i.metadata->>'summary_zh') AS summary_zh,
                       i.lifecycle_state, i.review_state, i.nonclosure_reason,
                       i.closure_reason, i.last_speaker,
                       i.last_customer_at, i.last_agent_at,
                       i.message_count, i.opened_at, i.last_activity_at,
                       i.external_party_name, i.detector,
                       i.customer_platform, i.customer_workspace_id,
                       i.customer_channel_id,
                       (i.metadata->'products') AS products,
                       (SELECT ch.channel_name FROM agent.channels ch
                          WHERE ch.platform = i.customer_platform
                            AND ch.workspace_id = i.customer_workspace_id
                            AND ch.channel_id = i.customer_channel_id
                          LIMIT 1) AS channel_name,
                       CASE
                         WHEN i.lifecycle_state IN ('closed_inferred','closed_confirmed')
                              AND COALESCE(i.closure_detected_at, i.closed_at, i.last_activity_at)
                                  >= (SELECT since FROM bounds)
                           THEN 'closed'
                         WHEN i.opened_at >= (SELECT since FROM bounds)
                           THEN 'new'
                         ELSE 'active'
                       END AS bucket
                FROM {SCHEMA}.issues i
                WHERE i.lifecycle_state <> 'dismissed'
                  AND i.review_state <> 'rejected'
                  AND (
                    -- closed in window (any open-date)
                    (i.lifecycle_state IN ('closed_inferred','closed_confirmed')
                     AND COALESCE(i.closure_detected_at, i.closed_at, i.last_activity_at)
                         >= (SELECT since FROM bounds))
                    -- or still-open and touched/opened in window
                    OR (i.lifecycle_state NOT IN ('closed_inferred','closed_confirmed')
                        AND (i.opened_at >= (SELECT since FROM bounds)
                             OR i.last_activity_at >= (SELECT since FROM bounds)))
                  )
                ORDER BY i.last_activity_at DESC NULLS LAST
                """,
                (hours,),
            )
            rows = _rows(cur)
            cur.execute("SELECT now() - make_interval(hours => %s) AS since", (hours,))
            since = cur.fetchone()["since"]
    buckets: dict[str, list] = {"new": [], "active": [], "closed": []}
    for r in rows:
        buckets.get(r.get("bucket"), buckets["active"]).append(r)
    return {
        "hours": hours,
        "since": since.isoformat() if since else None,
        "counts": {k: len(v) for k, v in buckets.items()},
        "new_issues": buckets["new"],
        "active_issues": buckets["active"],
        "closed_issues": buckets["closed"],
    }


@app.get("/v1/dashboard/tickets", dependencies=[Depends(require_secret)])
def dash_tickets(
    status: str = Query("all"),     # all | open | closed | archived
    q: Optional[str] = Query(None),
    platform: Optional[str] = Query(None),
    product: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> Any:
    """Ticket archive: every issue as a flat 'ticket record' for the dedicated
    ticket page. Each issue is one ticket. Because `support` is a *shared*
    on-duty login, the human who actually handled it can't come from the
    auth identity — so we derive the handler(s) from the chat itself: the
    distinct agent-side senders on the issue, plus the most recent one as the
    `last_handler`. A future shift-roster can then attribute work by time."""
    where = ["i.lifecycle_state <> 'dismissed'", "i.review_state <> 'rejected'",
             TIME_FLOOR_ALIAS]
    args: list[Any] = []
    if status == "open":
        where.append("i.lifecycle_state NOT IN ('closed_confirmed','closed_inferred')")
    elif status == "closed":
        where.append("i.lifecycle_state IN ('closed_confirmed','closed_inferred')")
    elif status == "archived":
        where.append("i.lifecycle_state = 'closed_confirmed'")
    if platform:
        where.append("i.customer_platform = %s")
        args.append(platform)
    if product:
        where.append("COALESCE(i.metadata->'products','[]'::jsonb) ? %s")
        args.append(product)
    if q:
        where.append(
            "(i.title ILIKE %s OR i.code ILIKE %s OR i.external_party_name ILIKE %s "
            "OR i.customer_workspace_id ILIKE %s "
            "OR EXISTS (SELECT 1 FROM agent.channels ch2 "
            "  WHERE ch2.platform=i.customer_platform "
            "    AND ch2.workspace_id=i.customer_workspace_id "
            "    AND ch2.channel_id=i.customer_channel_id "
            "    AND ch2.channel_name ILIKE %s))"
        )
        like = f"%{q}%"
        args.extend([like, like, like, like, like])
    sql = f"""
        SELECT i.id, i.code, i.title,
               (i.metadata->>'summary') AS summary,
               (i.metadata->>'summary_zh') AS summary_zh,
               i.lifecycle_state, i.review_state, i.nonclosure_reason,
               i.closure_reason, i.last_speaker, i.last_customer_at, i.last_agent_at,
               i.message_count, i.opened_at, i.last_activity_at, i.closed_at,
               i.external_party_name, i.reopened_count,
               i.customer_platform, i.customer_workspace_id, i.customer_channel_id,
               (i.metadata->'products') AS products,
               (SELECT ch.channel_name FROM agent.channels ch
                  WHERE ch.platform = i.customer_platform
                    AND ch.workspace_id = i.customer_workspace_id
                    AND ch.channel_id = i.customer_channel_id
                  LIMIT 1) AS channel_name,
               (SELECT am.sender_name
                  FROM {SCHEMA}.issue_messages im
                  JOIN agent.messages am
                    ON am.platform = im.platform AND am.workspace_id = im.workspace_id
                   AND am.channel_id = im.channel_id AND am.message_id = im.message_id
                  WHERE im.issue_id = i.id AND im.role = 'agent'
                    AND am.sender_name IS NOT NULL
                  ORDER BY am.ts DESC NULLS LAST LIMIT 1) AS last_handler,
               (SELECT count(DISTINCT am.sender_name)
                  FROM {SCHEMA}.issue_messages im
                  JOIN agent.messages am
                    ON am.platform = im.platform AND am.workspace_id = im.workspace_id
                   AND am.channel_id = im.channel_id AND am.message_id = im.message_id
                  WHERE im.issue_id = i.id AND im.role = 'agent'
                    AND am.sender_name IS NOT NULL) AS handler_count
        FROM {SCHEMA}.issues i
        WHERE {' AND '.join(where)}
        ORDER BY COALESCE(i.closed_at, i.last_activity_at) DESC NULLS LAST
        LIMIT %s OFFSET %s
    """
    args.extend([limit, offset])
    with _PooledConn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, args)
            items = _rows(cur)
            # total (ignoring pagination) for the list header
            cur.execute(
                f"SELECT count(*) AS n FROM {SCHEMA}.issues i WHERE {' AND '.join(where)}",
                args[:-2],
            )
            total = cur.fetchone()["n"]
    return {"items": items, "count": len(items), "total": total,
            "status": status, "limit": limit, "offset": offset}


@app.get("/v1/dashboard/customers/issues", dependencies=[Depends(require_secret)])
def dash_customer_issues(
    platform: str = Query(...),
    workspace_id: str = Query(...),
    channel_id: str = Query(...),
    include_closed: bool = Query(False),
) -> Any:
    """All issues for ONE customer (channel). The issue-detail page drilldown
    target. include_closed=true to also show closed_inferred/closed_confirmed
    so reviewers can verify them; default hides closed for a focused open list."""
    where = ["i.customer_platform = %s",
             "i.customer_workspace_id = %s",
             "i.customer_channel_id = %s",
             "i.lifecycle_state <> 'dismissed'",
             "i.review_state <> 'rejected'",
             TIME_FLOOR_ALIAS]
    args = [platform, workspace_id, channel_id]
    if not include_closed:
        where.append("i.lifecycle_state NOT IN ('closed_confirmed','closed_inferred')")
        where.append("i.review_state <> 'confirmed'")
    sql = f"""
        SELECT i.id, i.code, i.title, (i.metadata->>'summary') AS summary,
               (i.metadata->>'summary_zh') AS summary_zh,
               i.lifecycle_state, i.review_state, i.nonclosure_reason,
               i.closure_reason, i.last_speaker, i.last_customer_at, i.last_agent_at,
               i.message_count, i.opened_at, i.last_activity_at, i.sla_due_at,
               i.external_party_name, i.detector, (i.metadata->'products') AS products
        FROM {SCHEMA}.issues i
        WHERE {' AND '.join(where)}
        ORDER BY
          CASE i.lifecycle_state
            WHEN 'awaiting_agent' THEN 0
            WHEN 'active' THEN 1
            WHEN 'awaiting_customer' THEN 2
            WHEN 'closed_inferred' THEN 3
            WHEN 'closed_confirmed' THEN 4
            ELSE 5 END,
          i.last_activity_at DESC NULLS LAST
    """
    with _PooledConn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, args)
            items = _rows(cur)
            cur.execute(
                """SELECT platform, workspace_id, channel_id, channel_name
                   FROM agent.channels
                   WHERE platform=%s AND workspace_id=%s AND channel_id=%s""",
                (platform, workspace_id, channel_id),
            )
            chrow = cur.fetchone()
    return {"items": items, "count": len(items),
            "channel": dict(chrow) if chrow else None}


@app.get("/v1/dashboard/issues/{issue_id}/transcript", dependencies=[Depends(require_secret)])
def dash_issue_transcript(issue_id: str) -> Any:
    """Full chat transcript for ONE issue: every agent.messages row pinned to
    the issue, joined back with text + sender so the drawer can render a real
    conversation, not just message ids."""
    with _PooledConn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(f"SELECT * FROM {SCHEMA}.issues WHERE id = %s", (issue_id,))
            issue_rows = _rows(cur)
            if not issue_rows:
                raise HTTPException(404, "issue not found")
            issue = issue_rows[0]
            cur.execute(
                f"""SELECT im.role, im.signal_kind, im.is_segment_start,
                          am.platform, am.workspace_id, am.channel_id, am.message_id,
                          am.thread_id, am.sender_id, am.sender_name, am.text, am.ts
                   FROM {SCHEMA}.issue_messages im
                   LEFT JOIN agent.messages am
                     ON am.platform = im.platform
                    AND am.workspace_id = im.workspace_id
                    AND am.channel_id = im.channel_id
                    AND am.message_id = im.message_id
                   WHERE im.issue_id = %s
                   ORDER BY am.ts NULLS LAST, im.message_id""",
                (issue_id,),
            )
            transcript = _rows(cur)
            cur.execute(
                f"""SELECT field, old_value, new_value, actor_mxid, ts
                   FROM {SCHEMA}.issue_history WHERE issue_id = %s ORDER BY ts DESC""",
                (issue_id,),
            )
            history = _rows(cur)
    return {"issue": issue, "transcript": transcript, "history": history,
            "transcript_count": len(transcript)}


@app.get("/v1/issues/{issue_id}", dependencies=[Depends(require_secret)])
def issue_detail(issue_id: str) -> Any:
    with _PooledConn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(f"SELECT * FROM {SCHEMA}.issues WHERE id = %s", (issue_id,))
            rows = _rows(cur)
            if not rows:
                raise HTTPException(404, "issue not found")
            item = rows[0]
            cur.execute(
                f"""SELECT platform, workspace_id, channel_id, message_id, role,
                          signal_kind, is_segment_start, ts
                   FROM {SCHEMA}.issue_messages WHERE issue_id = %s ORDER BY ts ASC""",
                (issue_id,),
            )
            item["messages"] = _rows(cur)
            cur.execute(
                f"""SELECT field, old_value, new_value, actor_mxid, ts
                   FROM {SCHEMA}.issue_history WHERE issue_id = %s ORDER BY ts DESC""",
                (issue_id,),
            )
            item["history"] = _rows(cur)
    return item


# ---------------------------------------------------------------------------
# Write endpoints (human-in-the-loop). Require bearer + X-Actor-Mxid. Each
# borrows a pooled connection and commits/rolls back explicitly; every action
# writes an issue_history row stamped with the human actor (not the system
# actor). The lifecycle transition graph is enforced for state-changing actions.
# ---------------------------------------------------------------------------

def _history(cur, issue_id: str, field: str, old: Any, new: Any, actor: str) -> None:
    if old == new:
        return
    cur.execute(
        f"""INSERT INTO {SCHEMA}.issue_history (issue_id, field, old_value, new_value, actor_mxid)
           VALUES (%s, %s, %s, %s, %s)""",
        (issue_id, field,
         psycopg2.extras.Json(old) if old is not None else None,
         psycopg2.extras.Json(new) if new is not None else None,
         actor),
    )


def _fetch_issue(cur, issue_id: str) -> Optional[dict]:
    cur.execute(
        f"SELECT id, lifecycle_state, review_state, ticket_id, last_speaker FROM {SCHEMA}.issues WHERE id = %s",
        (issue_id,),
    )
    row = cur.fetchone()
    return dict(row) if row else None


class ReviewBody(BaseModel):
    action: str            # confirm | reject | dismiss | close | reopen
    note: Optional[str] = None


@app.post("/v1/issues/{issue_id}/review", dependencies=[Depends(require_secret)])
def review_issue(issue_id: str, body: ReviewBody, actor: str = Depends(require_actor)) -> Any:
    """Human verdict on a detected issue.
      confirm  -> review_state=confirmed (it's a real tracked problem; lifecycle
                  unchanged so it stays on the unclosed list until truly closed).
      reject/dismiss -> review_state=rejected, lifecycle_state=dismissed,
                  nonclosure cleared (it leaves every dashboard).
      close    -> 确认闭环: lifecycle_state=closed_confirmed (the human-only
                  terminal state the closure_agent is forbidden from setting),
                  review_state=confirmed, nonclosure cleared. This is how a
                  疑似闭环 (closed_inferred) gets promoted to a real closure, and
                  it's what archives the issue as a finished ticket.
      reopen   -> 未闭环: the auto-closure was wrong / the problem isn't actually
                  resolved. Lifecycle returns to an open state derived from who
                  spoke last (mirrors distill's awaiting_* rule); review_state is
                  set to confirmed so the closure_agent won't silently re-close
                  it — a human now owns the close.
    """
    if body.action not in ("confirm", "reject", "dismiss", "close", "reopen"):
        raise HTTPException(400, "action must be confirm | reject | dismiss | close | reopen")
    with _PooledConn() as conn:
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                issue = _fetch_issue(cur, issue_id)
                if issue is None:
                    raise HTTPException(404, "issue not found")
                old_review = issue["review_state"]
                old_life = issue["lifecycle_state"]
                if body.action == "confirm":
                    cur.execute(
                        f"""UPDATE {SCHEMA}.issues
                           SET review_state='confirmed', reviewed_by_mxid=%s, reviewed_at=now()
                           WHERE id=%s""",
                        (actor, issue_id),
                    )
                    _history(cur, issue_id, "review_confirmed",
                             {"review_state": old_review}, {"review_state": "confirmed"}, actor)
                elif body.action == "close":
                    cur.execute(
                        f"""UPDATE {SCHEMA}.issues
                           SET lifecycle_state='closed_confirmed', review_state='confirmed',
                               nonclosure_reason=NULL, reviewed_by_mxid=%s, reviewed_at=now(),
                               closed_at=COALESCE(closed_at, now()),
                               closure_detected_at=COALESCE(closure_detected_at, now())
                           WHERE id=%s""",
                        (actor, issue_id),
                    )
                    _history(cur, issue_id, "closure_confirmed",
                             {"lifecycle_state": old_life, "review_state": old_review},
                             {"lifecycle_state": "closed_confirmed", "review_state": "confirmed",
                              "note": body.note}, actor)
                elif body.action == "reopen":
                    # Ball-in-court from who spoke last: we spoke last -> waiting on
                    # the customer; otherwise it's back in our court.
                    if issue.get("last_speaker") == "agent":
                        new_life, new_nc = "awaiting_customer", None
                    else:
                        new_life, new_nc = "awaiting_agent", "unanswered_customer"
                    cur.execute(
                        f"""UPDATE {SCHEMA}.issues
                           SET lifecycle_state=%s, review_state='confirmed',
                               nonclosure_reason=%s, closure_reason=NULL, closed_at=NULL,
                               closure_detected_at=NULL,
                               reopened_count=COALESCE(reopened_count,0)+1,
                               reviewed_by_mxid=%s, reviewed_at=now()
                           WHERE id=%s""",
                        (new_life, new_nc, actor, issue_id),
                    )
                    _history(cur, issue_id, "reopened_by_review",
                             {"lifecycle_state": old_life, "review_state": old_review},
                             {"lifecycle_state": new_life, "review_state": "confirmed",
                              "note": body.note}, actor)
                else:  # reject | dismiss
                    cur.execute(
                        f"""UPDATE {SCHEMA}.issues
                           SET review_state='rejected', lifecycle_state='dismissed',
                               nonclosure_reason=NULL, reviewed_by_mxid=%s, reviewed_at=now(),
                               closed_at=now()
                           WHERE id=%s""",
                        (actor, issue_id),
                    )
                    _history(cur, issue_id, "dismissed",
                             {"lifecycle_state": old_life, "review_state": old_review},
                             {"lifecycle_state": "dismissed", "review_state": "rejected",
                              "note": body.note}, actor)
            conn.commit()
            return {"ok": True, "issue_id": issue_id, "action": body.action}
        except HTTPException:
            conn.rollback(); raise
        except Exception as exc:
            conn.rollback()
            log.exception("review_issue failed")
            raise HTTPException(500, f"review failed: {exc}")


class MergeBody(BaseModel):
    into_issue_id: str     # the survivor; this issue is merged into it


@app.post("/v1/issues/{issue_id}/merge", dependencies=[Depends(require_secret)])
def merge_issue(issue_id: str, body: MergeBody, actor: str = Depends(require_actor)) -> Any:
    """Merge a duplicate/over-segmented issue into another. The source is
    dismissed (review_state=merged, merged_into_issue_id set); its evidence
    messages are repointed to the survivor (skipping any that would collide)."""
    target = body.into_issue_id
    if target == issue_id:
        raise HTTPException(400, "cannot merge an issue into itself")
    with _PooledConn() as conn:
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                src = _fetch_issue(cur, issue_id)
                dst = _fetch_issue(cur, target)
                if src is None or dst is None:
                    raise HTTPException(404, "issue or target not found")
                # Repoint evidence rows that don't already exist on the target.
                cur.execute(
                    f"""UPDATE {SCHEMA}.issue_messages m
                       SET issue_id = %s
                       WHERE m.issue_id = %s
                         AND NOT EXISTS (
                           SELECT 1 FROM {SCHEMA}.issue_messages t
                           WHERE t.issue_id = %s AND t.platform = m.platform
                             AND t.workspace_id = m.workspace_id
                             AND t.channel_id = m.channel_id
                             AND t.message_id = m.message_id)""",
                    (target, issue_id, target),
                )
                cur.execute(
                    f"""UPDATE {SCHEMA}.issues
                       SET review_state='merged', lifecycle_state='dismissedf',
                           merged_into_issue_id=%s, nonclosure_reason=NULL,
                           reviewed_by_mxid=%s, reviewed_at=now(), closed_at=now()
                       WHERE id=%s""",
                    (target, actor, issue_id),
                )
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.merge_links (kept_issue_id, merged_issue_id, actor_mxid)
                       VALUES (%s, %s, %s)""",
                    (target, issue_id, actor),
                )
                _history(cur, issue_id, "merged", None, {"into": target}, actor)
                _history(cur, target, "merged_from", None, {"from": issue_id}, actor)
            conn.commit()
            return {"ok": True, "merged": issue_id, "into": target}
        except HTTPException:
            conn.rollback(); raise
        except Exception as exc:
            conn.rollback()
            log.exception("merge_issue failed")
            raise HTTPException(500, f"merge failed: {exc}")


class PromoteBody(BaseModel):
    ticket_id: str         # the ticket.tickets row the BFF already created


@app.post("/v1/issues/{issue_id}/promote", dependencies=[Depends(require_secret)])
def promote_issue(issue_id: str, body: PromoteBody, actor: str = Depends(require_actor)) -> Any:
    """Link an issue to a ticket the caller (BFF) has already created via
    ticket-api. The engine only records the link + review_state=promoted; it
    does NOT create the ticket itself (keeps the ticket write path solely in
    ticket-api). Lifecycle keeps tracking the chat so reopen still works."""
    with _PooledConn() as conn:
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                issue = _fetch_issue(cur, issue_id)
                if issue is None:
                    raise HTTPException(404, "issue not found")
                cur.execute(
                    f"""UPDATE {SCHEMA}.issues
                       SET review_state='promoted', ticket_id=%s,
                           reviewed_by_mxid=%s, reviewed_at=now()
                       WHERE id=%s""",
                    (body.ticket_id, actor, issue_id),
                )
                _history(cur, issue_id, "promoted",
                         {"review_state": issue["review_state"]},
                         {"review_state": "promoted", "ticket_id": body.ticket_id}, actor)
            conn.commit()
            return {"ok": True, "issue_id": issue_id, "ticket_id": body.ticket_id}
        except HTTPException:
            conn.rollback(); raise
        except Exception as exc:
            conn.rollback()
            log.exception("promote_issue failed")
            raise HTTPException(500, f"promote failed: {exc}")
