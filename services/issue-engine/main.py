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
import threading
import time
from typing import Any, Optional

import psycopg2
import psycopg2.extras
from fastapi import Depends, FastAPI, Header, HTTPException, Query, status
from fastapi.responses import JSONResponse

import config
import detector
import psycopg2.pool

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("issue-engine")

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


@app.on_event("startup")
def _startup() -> None:
    _get_pool()  # warm the read pool
    t = threading.Thread(target=_detector_loop, name="detector", daemon=True)
    t.start()
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
                cur.execute("SELECT count(*) FROM issue.issues")
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
    where = ["lifecycle_state NOT IN ('closed_confirmed','dismissed')"]
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
        FROM issue.issues
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
                """
                SELECT i.id, i.code, i.customer_platform, i.customer_workspace_id,
                       i.external_party_name, i.title, i.lifecycle_state,
                       i.nonclosure_reason, i.last_speaker, i.last_customer_at,
                       i.sla_due_at, i.last_activity_at,
                       ch.channel_name
                FROM issue.issues i
                LEFT JOIN agent.channels ch
                  ON ch.platform = i.customer_platform
                 AND ch.workspace_id = i.customer_workspace_id
                 AND ch.channel_id = i.customer_channel_id
                WHERE i.nonclosure_reason IS NOT NULL
                  AND i.review_state = 'unreviewed'
                  AND i.lifecycle_state NOT IN ('closed_confirmed','dismissed')
                ORDER BY i.last_activity_at ASC
                LIMIT 500
                """
            )
            items = _rows(cur)
    return {"items": items, "count": len(items)}


@app.get("/v1/customers/rollup", dependencies=[Depends(require_secret)])
def rollup() -> Any:
    """Per-customer counts: how many unclosed, how stale, for the dashboard."""
    with _PooledConn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT i.customer_platform, i.customer_workspace_id,
                       max(ch.channel_name) AS channel_name,
                       count(*) FILTER (WHERE i.nonclosure_reason IS NOT NULL) AS unclosed,
                       count(*) AS total_open,
                       min(i.last_activity_at) FILTER (WHERE i.nonclosure_reason IS NOT NULL)
                         AS oldest_unclosed_at
                FROM issue.issues i
                LEFT JOIN agent.channels ch
                  ON ch.platform = i.customer_platform
                 AND ch.workspace_id = i.customer_workspace_id
                 AND ch.channel_id = i.customer_channel_id
                WHERE i.review_state = 'unreviewed'
                  AND i.lifecycle_state NOT IN ('closed_confirmed','dismissed')
                GROUP BY i.customer_platform, i.customer_workspace_id
                HAVING count(*) FILTER (WHERE i.nonclosure_reason IS NOT NULL) > 0
                ORDER BY unclosed DESC, oldest_unclosed_at ASC
                """
            )
            items = _rows(cur)
    return {"items": items, "count": len(items)}


@app.get("/v1/issues/{issue_id}", dependencies=[Depends(require_secret)])
def issue_detail(issue_id: str) -> Any:
    with _PooledConn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM issue.issues WHERE id = %s", (issue_id,))
            rows = _rows(cur)
            if not rows:
                raise HTTPException(404, "issue not found")
            item = rows[0]
            cur.execute(
                """SELECT platform, workspace_id, channel_id, message_id, role,
                          signal_kind, is_segment_start, ts
                   FROM issue.issue_messages WHERE issue_id = %s ORDER BY ts ASC""",
                (issue_id,),
            )
            item["messages"] = _rows(cur)
            cur.execute(
                """SELECT field, old_value, new_value, actor_mxid, ts
                   FROM issue.issue_history WHERE issue_id = %s ORDER BY ts DESC""",
                (issue_id,),
            )
            item["history"] = _rows(cur)
    return item
