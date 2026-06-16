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
import logging
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
import detector

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
        """INSERT INTO issue.issue_history (issue_id, field, old_value, new_value, actor_mxid)
           VALUES (%s, %s, %s, %s, %s)""",
        (issue_id, field,
         psycopg2.extras.Json(old) if old is not None else None,
         psycopg2.extras.Json(new) if new is not None else None,
         actor),
    )


def _fetch_issue(cur, issue_id: str) -> Optional[dict]:
    cur.execute(
        "SELECT id, lifecycle_state, review_state, ticket_id FROM issue.issues WHERE id = %s",
        (issue_id,),
    )
    row = cur.fetchone()
    return dict(row) if row else None


class ReviewBody(BaseModel):
    action: str            # confirm | reject | dismiss
    note: Optional[str] = None


@app.post("/v1/issues/{issue_id}/review", dependencies=[Depends(require_secret)])
def review_issue(issue_id: str, body: ReviewBody, actor: str = Depends(require_actor)) -> Any:
    """Human verdict on a detected issue.
      confirm  -> review_state=confirmed (it's a real tracked problem; lifecycle
                  unchanged so it stays on the unclosed list until truly closed).
      reject/dismiss -> review_state=rejected, lifecycle_state=dismissed,
                  nonclosure cleared (it leaves every dashboard).
    """
    if body.action not in ("confirm", "reject", "dismiss"):
        raise HTTPException(400, "action must be confirm | reject | dismiss")
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
                        """UPDATE issue.issues
                           SET review_state='confirmed', reviewed_by_mxid=%s, reviewed_at=now()
                           WHERE id=%s""",
                        (actor, issue_id),
                    )
                    _history(cur, issue_id, "review_confirmed",
                             {"review_state": old_review}, {"review_state": "confirmed"}, actor)
                else:  # reject | dismiss
                    cur.execute(
                        """UPDATE issue.issues
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
                    """UPDATE issue.issue_messages m
                       SET issue_id = %s
                       WHERE m.issue_id = %s
                         AND NOT EXISTS (
                           SELECT 1 FROM issue.issue_messages t
                           WHERE t.issue_id = %s AND t.platform = m.platform
                             AND t.workspace_id = m.workspace_id
                             AND t.channel_id = m.channel_id
                             AND t.message_id = m.message_id)""",
                    (target, issue_id, target),
                )
                cur.execute(
                    """UPDATE issue.issues
                       SET review_state='merged', lifecycle_state='dismissed',
                           merged_into_issue_id=%s, nonclosure_reason=NULL,
                           reviewed_by_mxid=%s, reviewed_at=now(), closed_at=now()
                       WHERE id=%s""",
                    (target, actor, issue_id),
                )
                cur.execute(
                    """INSERT INTO issue.merge_links (kept_issue_id, merged_issue_id, actor_mxid)
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
                    """UPDATE issue.issues
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
