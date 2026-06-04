"""PixDesk Ticket API — manual ticket lifecycle on top of agent.* chat data.

Tickets bind to a single agent.conversations row; "customer" is derived on
read by joining through agent.channels.workspace_id. Mutating endpoints
require both a shared bearer token (service-to-service trust boundary) and
an X-Actor-Mxid header (the human who triggered the action — recorded in
ticket_history). Attachments stream to disk under ATTACHMENT_DIR with
size/MIME hardening.
"""
from __future__ import annotations

import hashlib
import logging
import os
import re
import unicodedata
import uuid
from typing import Any, Optional
from urllib.parse import quote

import magic  # libmagic, for content sniffing
import psycopg2
import psycopg2.extras
from fastapi import (
    Depends,
    FastAPI,
    File,
    Header,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field, field_validator

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

DATABASE_URL = os.environ["DATABASE_URL"]
SHARED_SECRET = os.environ.get("TICKET_API_SHARED_SECRET")
ATTACHMENT_DIR = os.environ.get("ATTACHMENT_DIR", "/data/tickets")
MAX_ATTACHMENT_BYTES = int(os.environ.get("MAX_ATTACHMENT_BYTES", str(50 * 1024 * 1024)))
MAX_TOTAL_BYTES = int(os.environ.get("MAX_TOTAL_ATTACHMENT_BYTES_PER_TICKET", str(50 * 1024 * 1024)))

BLOCKED_MIME_PREFIXES = ("text/html", "image/svg")
BLOCKED_MIME_EXACT = {"application/javascript", "application/x-javascript", "text/javascript"}
ALLOWED_STATUSES = ("open", "in_progress", "pending_customer", "resolved", "closed")
ALLOWED_PRIORITIES = ("low", "standard", "high", "urgent")
TERMINAL_STATUSES = ("resolved", "closed")
MXID_RE = re.compile(r"^@[A-Za-z0-9._=/+-]+:[A-Za-z0-9.-]+$")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("ticket-api")

app = FastAPI(title="PixDesk Ticket API", version="0.1.0")

# ---------------------------------------------------------------------------
# DB
# ---------------------------------------------------------------------------

_conn: Optional[psycopg2.extensions.connection] = None


def _connect() -> psycopg2.extensions.connection:
    c = psycopg2.connect(DATABASE_URL)
    c.autocommit = False  # explicit txn control per request
    return c


def db() -> psycopg2.extensions.connection:
    """Return a live DB connection, reconnecting if the prior one died."""
    global _conn
    if _conn is None or _conn.closed:
        _conn = _connect()
        return _conn
    try:
        with _conn.cursor() as cur:
            cur.execute("SELECT 1")
        _conn.rollback()
        return _conn
    except Exception:
        try:
            _conn.close()
        except Exception:
            pass
        _conn = _connect()
        return _conn


@app.on_event("startup")
async def _startup() -> None:
    if not SHARED_SECRET:
        raise RuntimeError("TICKET_API_SHARED_SECRET must be set")
    os.makedirs(ATTACHMENT_DIR, mode=0o750, exist_ok=True)
    db()
    log.info("ticket-api started")

# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------


def require_secret(authorization: str = Header(default="")) -> None:
    expected = f"Bearer {SHARED_SECRET}"
    if authorization != expected:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid bearer token")


def require_actor(x_actor_mxid: str = Header(default="")) -> str:
    if not x_actor_mxid:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "X-Actor-Mxid header required")
    if not MXID_RE.match(x_actor_mxid):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "X-Actor-Mxid must look like @user:server")
    return x_actor_mxid


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _to_jsonb(value: Any) -> Optional[psycopg2.extras.Json]:
    if value is None:
        return None
    return psycopg2.extras.Json(value)


def _record_history(
    cur,
    ticket_id: str,
    field: str,
    old_value: Any,
    new_value: Any,
    actor: str,
) -> None:
    if old_value == new_value:
        return
    cur.execute(
        """
        INSERT INTO ticket.ticket_history
          (ticket_id, field, old_value, new_value, actor_mxid)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (ticket_id, field, _to_jsonb(old_value), _to_jsonb(new_value), actor),
    )
def sanitize_filename(name: str) -> str:
    name = unicodedata.normalize("NFC", name or "")
    name = name.replace("\x00", "").replace("/", "_").replace("\\", "_")
    name = "".join(ch for ch in name if ch == "\t" or ord(ch) >= 32)
    name = name.lstrip(". ")
    if not name or name in ("", ".", ".."):
        name = "file"
    if len(name) > 200:
        stem, dot, ext = name.rpartition(".")
        if dot and len(ext) <= 16:
            stem = stem[: 200 - len(ext) - 1]
            name = f"{stem}.{ext}"
        else:
            name = name[:200]
    return name


def content_disposition_attachment(filename: str) -> str:
    safe = sanitize_filename(filename)
    encoded = quote(safe, safe="")
    return f"attachment; filename*=UTF-8''{encoded}"


def _ticket_dir(ticket_id: str) -> str:
    return os.path.join(ATTACHMENT_DIR, ticket_id)


def _conversation_exists(cur, conversation_id: str) -> bool:
    cur.execute("SELECT 1 FROM agent.conversations WHERE id = %s", (conversation_id,))
    return cur.fetchone() is not None


def _customer_for_conversation(cur, conversation_id: str) -> dict[str, Any]:
    cur.execute(
        """
        SELECT c.platform, c.workspace_id, ch.channel_name
        FROM agent.conversations c
        LEFT JOIN agent.channels ch
          ON ch.platform = c.platform
         AND ch.workspace_id = c.workspace_id
         AND ch.channel_id = c.channel_id
        WHERE c.id = %s
        """,
        (conversation_id,),
    )
    row = cur.fetchone()
    if not row:
        return {}
    return {"platform": row[0], "workspace_id": row[1], "channel_name": row[2]}
# ---------------------------------------------------------------------------
# API models
# ---------------------------------------------------------------------------


class TicketCreate(BaseModel):
    subject: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    conversation_id: str
    assignee_mxid: Optional[str] = None
    status: str = "open"
    priority: str = "standard"
    tags: list[str] = Field(default_factory=list)
    template_id: Optional[str] = None
    due_at: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("status")
    @classmethod
    def _check_status(cls, v: str) -> str:
        if v not in ALLOWED_STATUSES:
            raise ValueError(f"status must be one of {ALLOWED_STATUSES}")
        return v

    @field_validator("priority")
    @classmethod
    def _check_priority(cls, v: str) -> str:
        if v not in ALLOWED_PRIORITIES:
            raise ValueError(f"priority must be one of {ALLOWED_PRIORITIES}")
        return v


class TicketPatch(BaseModel):
    subject: Optional[str] = None
    description: Optional[str] = None
    assignee_mxid: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    tags: Optional[list[str]] = None
    template_id: Optional[str] = None
    due_at: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None
    comment: Optional[str] = None
    comment_is_internal: bool = False


class CommentCreate(BaseModel):
    body: str = Field(..., min_length=1)
    is_internal: bool = False


class WatcherAdd(BaseModel):
    mxid: str

    @field_validator("mxid")
    @classmethod
    def _mxid(cls, v: str) -> str:
        if not MXID_RE.match(v):
            raise ValueError("mxid must look like @user:server")
        return v


class PinMessage(BaseModel):
    platform: str
    workspace_id: str
    channel_id: str
    message_id: str
    note: Optional[str] = None


# ---------------------------------------------------------------------------
# Serializers
# ---------------------------------------------------------------------------


def _ticket_columns() -> str:
    return (
        "id, code, subject, description, conversation_id, assignee_mxid, "
        "created_by_mxid, status, priority, tags, template_id, opened_at, "
        "closed_at, due_at, updated_at, metadata"
    )


def _row_to_ticket(row: tuple) -> dict[str, Any]:
    return {
        "id": str(row[0]),
        "code": row[1],
        "subject": row[2],
        "description": row[3],
        "conversation_id": str(row[4]),
        "assignee_mxid": row[5],
        "created_by_mxid": row[6],
        "status": row[7],
        "priority": row[8],
        "tags": list(row[9] or []),
        "template_id": str(row[10]) if row[10] else None,
        "opened_at": row[11].isoformat() if row[11] else None,
        "closed_at": row[12].isoformat() if row[12] else None,
        "due_at": row[13].isoformat() if row[13] else None,
        "updated_at": row[14].isoformat() if row[14] else None,
        "metadata": row[15] or {},
    }
def _fetch_ticket(cur, ticket_id: str) -> Optional[dict[str, Any]]:
    cur.execute(
        f"SELECT {_ticket_columns()} FROM ticket.tickets WHERE id = %s",
        (ticket_id,),
    )
    row = cur.fetchone()
    if not row:
        return None
    return _row_to_ticket(row)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/healthz")
def healthz() -> dict[str, Any]:
    try:
        with db().cursor() as cur:
            cur.execute("SELECT 1")
            cur.fetchone()
        db().rollback()
        return {"ok": True}
    except Exception as exc:
        return JSONResponse({"ok": False, "error": str(exc)}, status_code=503)


@app.post(
    "/v1/tickets",
    status_code=201,
    dependencies=[Depends(require_secret)],
)
def create_ticket(req: TicketCreate, actor: str = Depends(require_actor)) -> dict[str, Any]:
    conn = db()
    try:
        with conn.cursor() as cur:
            if not _conversation_exists(cur, req.conversation_id):
                raise HTTPException(404, f"conversation {req.conversation_id} not found")
            cur.execute(
                f"""
                INSERT INTO ticket.tickets
                  (subject, description, conversation_id, assignee_mxid,
                   created_by_mxid, status, priority, tags, template_id,
                   due_at, metadata)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING {_ticket_columns()}
                """,
                (
                    req.subject, req.description, req.conversation_id,
                    req.assignee_mxid, actor, req.status, req.priority,
                    req.tags, req.template_id, req.due_at,
                    psycopg2.extras.Json(req.metadata),
                ),
            )
            ticket = _row_to_ticket(cur.fetchone())
            _record_history(cur, ticket["id"], "created", None, {"subject": req.subject}, actor)
        conn.commit()
        ticket["customer"] = _customer_lookup_after(conn, ticket["conversation_id"])
        return ticket
    except HTTPException:
        conn.rollback()
        raise
    except Exception as exc:
        conn.rollback()
        log.exception("create_ticket failed")
        raise HTTPException(500, f"create failed: {exc}")
def _customer_lookup_after(conn, conversation_id: str) -> dict[str, Any]:
    with conn.cursor() as cur:
        return _customer_for_conversation(cur, conversation_id)


@app.get("/v1/tickets", dependencies=[Depends(require_secret)])
def list_tickets(
    status_eq: Optional[str] = Query(None, alias="status"),
    assignee: Optional[str] = None,
    conversation_id: Optional[str] = None,
    customer_workspace_id: Optional[str] = None,
    customer_platform: Optional[str] = None,
    tag: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> dict[str, Any]:
    where: list[str] = []
    args: list[Any] = []
    if status_eq:
        if status_eq not in ALLOWED_STATUSES:
            raise HTTPException(400, f"unknown status: {status_eq}")
        where.append("t.status = %s")
        args.append(status_eq)
    if assignee:
        where.append("t.assignee_mxid = %s")
        args.append(assignee)
    if conversation_id:
        where.append("t.conversation_id = %s")
        args.append(conversation_id)
    if tag:
        where.append("%s = ANY(t.tags)")
        args.append(tag)
    if q:
        where.append("(t.subject ILIKE %s OR t.description ILIKE %s)")
        args.extend([f"%{q}%", f"%{q}%"])
    if customer_workspace_id or customer_platform:
        where.append(
            "EXISTS (SELECT 1 FROM agent.conversations c WHERE c.id = t.conversation_id"
            + (" AND c.workspace_id = %s" if customer_workspace_id else "")
            + (" AND c.platform = %s" if customer_platform else "")
            + ")"
        )
        if customer_workspace_id:
            args.append(customer_workspace_id)
        if customer_platform:
            args.append(customer_platform)
    where_sql = ("WHERE " + " AND ".join(where)) if where else ""
    sql = (
        f"SELECT {_ticket_columns()} FROM ticket.tickets t "
        f"{where_sql} ORDER BY t.opened_at DESC LIMIT %s OFFSET %s"
    )
    args.extend([limit, offset])
    conn = db()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, args)
            rows = cur.fetchall()
        conn.rollback()
        return {"tickets": [_row_to_ticket(r) for r in rows], "limit": limit, "offset": offset}
    except Exception as exc:
        conn.rollback()
        raise HTTPException(500, f"list failed: {exc}")
@app.get("/v1/tickets/{ticket_id}", dependencies=[Depends(require_secret)])
def get_ticket(ticket_id: str) -> dict[str, Any]:
    conn = db()
    try:
        with conn.cursor() as cur:
            ticket = _fetch_ticket(cur, ticket_id)
            if not ticket:
                raise HTTPException(404, "ticket not found")
            ticket["customer"] = _customer_for_conversation(cur, ticket["conversation_id"])
            cur.execute(
                "SELECT id, author_mxid, body, is_internal, created_at "
                "FROM ticket.ticket_comments WHERE ticket_id = %s ORDER BY created_at",
                (ticket_id,),
            )
            ticket["comments"] = [
                {
                    "id": str(r[0]), "author_mxid": r[1], "body": r[2],
                    "is_internal": r[3], "created_at": r[4].isoformat(),
                }
                for r in cur.fetchall()
            ]
            cur.execute(
                "SELECT id, filename, mime, size, sha256, uploaded_by_mxid, uploaded_at "
                "FROM ticket.ticket_attachments WHERE ticket_id = %s ORDER BY uploaded_at",
                (ticket_id,),
            )
            ticket["attachments"] = [
                {
                    "id": str(r[0]), "filename": r[1], "mime": r[2], "size": r[3],
                    "sha256": r[4], "uploaded_by_mxid": r[5],
                    "uploaded_at": r[6].isoformat(),
                }
                for r in cur.fetchall()
            ]
            cur.execute(
                "SELECT watcher_mxid, added_by_mxid, added_at "
                "FROM ticket.ticket_watchers WHERE ticket_id = %s ORDER BY added_at",
                (ticket_id,),
            )
            ticket["watchers"] = [
                {"mxid": r[0], "added_by_mxid": r[1], "added_at": r[2].isoformat()}
                for r in cur.fetchall()
            ]
            cur.execute(
                "SELECT count(*) FROM ticket.ticket_history WHERE ticket_id = %s",
                (ticket_id,),
            )
            ticket["history_count"] = cur.fetchone()[0]
        conn.rollback()
        return ticket
    except HTTPException:
        conn.rollback()
        raise
    except Exception as exc:
        conn.rollback()
        raise HTTPException(500, f"fetch failed: {exc}")
_PATCHABLE_FIELDS = (
    "subject", "description", "assignee_mxid", "status", "priority",
    "tags", "template_id", "due_at", "metadata",
)


@app.patch("/v1/tickets/{ticket_id}", dependencies=[Depends(require_secret)])
def patch_ticket(
    ticket_id: str,
    req: TicketPatch,
    actor: str = Depends(require_actor),
) -> dict[str, Any]:
    conn = db()
    try:
        with conn.cursor() as cur:
            current = _fetch_ticket(cur, ticket_id)
            if not current:
                raise HTTPException(404, "ticket not found")
            updates: dict[str, Any] = {}
            payload = req.model_dump(exclude_unset=True)
            for field in _PATCHABLE_FIELDS:
                if field in payload:
                    updates[field] = payload[field]
            if "status" in updates and updates["status"] not in ALLOWED_STATUSES:
                raise HTTPException(400, f"status must be one of {ALLOWED_STATUSES}")
            if "priority" in updates and updates["priority"] not in ALLOWED_PRIORITIES:
                raise HTTPException(400, f"priority must be one of {ALLOWED_PRIORITIES}")
            if updates:
                set_sql_parts: list[str] = []
                args: list[Any] = []
                for k, v in updates.items():
                    if k == "metadata":
                        set_sql_parts.append("metadata = %s")
                        args.append(psycopg2.extras.Json(v))
                    else:
                        set_sql_parts.append(f"{k} = %s")
                        args.append(v)
                if "status" in updates and updates["status"] in TERMINAL_STATUSES \
                        and current["status"] not in TERMINAL_STATUSES:
                    set_sql_parts.append("closed_at = now()")
                elif "status" in updates and updates["status"] not in TERMINAL_STATUSES \
                        and current["status"] in TERMINAL_STATUSES:
                    set_sql_parts.append("closed_at = NULL")
                args.append(ticket_id)
                cur.execute(
                    f"UPDATE ticket.tickets SET {', '.join(set_sql_parts)} WHERE id = %s",
                    args,
                )
                for k, v in updates.items():
                    _record_history(cur, ticket_id, k, current.get(k), v, actor)
            if req.comment:
                cur.execute(
                    "INSERT INTO ticket.ticket_comments "
                    "(ticket_id, author_mxid, body, is_internal) VALUES (%s, %s, %s, %s)",
                    (ticket_id, actor, req.comment, req.comment_is_internal),
                )
                _record_history(cur, ticket_id, "comment_added",
                                None, {"is_internal": req.comment_is_internal}, actor)
            updated = _fetch_ticket(cur, ticket_id)
        conn.commit()
        return updated  # type: ignore[return-value]
    except HTTPException:
        conn.rollback()
        raise
    except Exception as exc:
        conn.rollback()
        log.exception("patch_ticket failed")
        raise HTTPException(500, f"patch failed: {exc}")
@app.get("/v1/tickets/{ticket_id}/comments", dependencies=[Depends(require_secret)])
def list_comments(ticket_id: str) -> dict[str, Any]:
    conn = db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, author_mxid, body, is_internal, created_at "
                "FROM ticket.ticket_comments WHERE ticket_id = %s ORDER BY created_at",
                (ticket_id,),
            )
            comments = [
                {"id": str(r[0]), "author_mxid": r[1], "body": r[2],
                 "is_internal": r[3], "created_at": r[4].isoformat()}
                for r in cur.fetchall()
            ]
        conn.rollback()
        return {"comments": comments}
    except Exception as exc:
        conn.rollback()
        raise HTTPException(500, f"list comments failed: {exc}")


@app.post("/v1/tickets/{ticket_id}/comments", status_code=201, dependencies=[Depends(require_secret)])
def add_comment(
    ticket_id: str,
    req: CommentCreate,
    actor: str = Depends(require_actor),
) -> dict[str, Any]:
    conn = db()
    try:
        with conn.cursor() as cur:
            if not _fetch_ticket(cur, ticket_id):
                raise HTTPException(404, "ticket not found")
            cur.execute(
                "INSERT INTO ticket.ticket_comments "
                "(ticket_id, author_mxid, body, is_internal) "
                "VALUES (%s, %s, %s, %s) "
                "RETURNING id, created_at",
                (ticket_id, actor, req.body, req.is_internal),
            )
            row = cur.fetchone()
            _record_history(cur, ticket_id, "comment_added",
                            None, {"id": str(row[0]), "is_internal": req.is_internal}, actor)
        conn.commit()
        return {
            "id": str(row[0]), "author_mxid": actor, "body": req.body,
            "is_internal": req.is_internal, "created_at": row[1].isoformat(),
        }
    except HTTPException:
        conn.rollback()
        raise
    except Exception as exc:
        conn.rollback()
        raise HTTPException(500, f"add comment failed: {exc}")


@app.delete("/v1/tickets/{ticket_id}/comments/{cid}", dependencies=[Depends(require_secret)])
def delete_comment(ticket_id: str, cid: str, actor: str = Depends(require_actor)) -> dict[str, Any]:
    conn = db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT author_mxid FROM ticket.ticket_comments "
                "WHERE id = %s AND ticket_id = %s",
                (cid, ticket_id),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(404, "comment not found")
            if row[0] != actor:
                raise HTTPException(403, "only the comment author can delete it")
            cur.execute("DELETE FROM ticket.ticket_comments WHERE id = %s", (cid,))
            _record_history(cur, ticket_id, "comment_deleted", {"id": cid}, None, actor)
        conn.commit()
        return {"ok": True}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as exc:
        conn.rollback()
        raise HTTPException(500, f"delete comment failed: {exc}")
@app.post(
    "/v1/tickets/{ticket_id}/attachments",
    status_code=201,
    dependencies=[Depends(require_secret)],
)
async def upload_attachment(
    ticket_id: str,
    file: UploadFile = File(...),
    actor: str = Depends(require_actor),
) -> dict[str, Any]:
    conn = db()
    with conn.cursor() as cur:
        if not _fetch_ticket(cur, ticket_id):
            conn.rollback()
            raise HTTPException(404, "ticket not found")
        cur.execute(
            "SELECT COALESCE(SUM(size), 0) FROM ticket.ticket_attachments WHERE ticket_id = %s",
            (ticket_id,),
        )
        existing_total = int(cur.fetchone()[0] or 0)
    conn.rollback()

    aid = str(uuid.uuid4())
    safe_name = sanitize_filename(file.filename or "file")
    ticket_dir = _ticket_dir(ticket_id)
    os.makedirs(ticket_dir, mode=0o750, exist_ok=True)
    storage_path = os.path.join(ticket_dir, f"{aid}__{safe_name}")
    tmp_path = storage_path + ".part"

    sha = hashlib.sha256()
    written = 0
    chunk_size = 1 << 20  # 1 MiB
    fd = os.open(tmp_path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o640)
    try:
        with os.fdopen(fd, "wb") as out:
            while True:
                chunk = await file.read(chunk_size)
                if not chunk:
                    break
                written += len(chunk)
                if written > MAX_ATTACHMENT_BYTES:
                    raise HTTPException(413, f"attachment exceeds {MAX_ATTACHMENT_BYTES} bytes")
                if existing_total + written > MAX_TOTAL_BYTES:
                    raise HTTPException(
                        413,
                        f"per-ticket total would exceed {MAX_TOTAL_BYTES} bytes",
                    )
                out.write(chunk)
                sha.update(chunk)
        sniff_mime = magic.from_file(tmp_path, mime=True) or "application/octet-stream"
        declared = (file.content_type or "").lower().split(";")[0].strip()
        if any(sniff_mime.startswith(p) for p in BLOCKED_MIME_PREFIXES):
            raise HTTPException(415, f"blocked mime type: {sniff_mime}")
        if sniff_mime in BLOCKED_MIME_EXACT:
            raise HTTPException(415, f"blocked mime type: {sniff_mime}")
        if declared and declared != sniff_mime and not (
            declared.startswith("application/octet-stream")
            or sniff_mime.startswith("application/octet-stream")
        ):
            raise HTTPException(415, f"content-type mismatch: declared={declared} sniffed={sniff_mime}")
        os.replace(tmp_path, storage_path)
    except HTTPException:
        try:
            os.unlink(tmp_path)
        except FileNotFoundError:
            pass
        raise
    except Exception as exc:
        try:
            os.unlink(tmp_path)
        except FileNotFoundError:
            pass
        log.exception("upload failed")
        raise HTTPException(500, f"upload failed: {exc}")
    digest = sha.hexdigest()
    conn = db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO ticket.ticket_attachments "
                "(id, ticket_id, filename, mime, size, sha256, storage_path, uploaded_by_mxid) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s) "
                "RETURNING uploaded_at",
                (aid, ticket_id, safe_name, sniff_mime, written, digest, storage_path, actor),
            )
            uploaded_at = cur.fetchone()[0]
            _record_history(
                cur, ticket_id, "attachment_added",
                None,
                {"id": aid, "filename": safe_name, "size": written, "mime": sniff_mime},
                actor,
            )
        conn.commit()
        return {
            "id": aid, "filename": safe_name, "mime": sniff_mime, "size": written,
            "sha256": digest, "uploaded_by_mxid": actor,
            "uploaded_at": uploaded_at.isoformat(),
        }
    except Exception as exc:
        conn.rollback()
        try:
            os.unlink(storage_path)
        except FileNotFoundError:
            pass
        raise HTTPException(500, f"db insert failed: {exc}")


@app.get("/v1/tickets/{ticket_id}/attachments", dependencies=[Depends(require_secret)])
def list_attachments(ticket_id: str) -> dict[str, Any]:
    conn = db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, filename, mime, size, sha256, uploaded_by_mxid, uploaded_at "
                "FROM ticket.ticket_attachments WHERE ticket_id = %s ORDER BY uploaded_at",
                (ticket_id,),
            )
            attachments = [
                {"id": str(r[0]), "filename": r[1], "mime": r[2], "size": r[3],
                 "sha256": r[4], "uploaded_by_mxid": r[5], "uploaded_at": r[6].isoformat()}
                for r in cur.fetchall()
            ]
        conn.rollback()
        return {"attachments": attachments}
    except Exception as exc:
        conn.rollback()
        raise HTTPException(500, f"list attachments failed: {exc}")
@app.get(
    "/v1/tickets/{ticket_id}/attachments/{aid}",
    dependencies=[Depends(require_secret)],
)
def download_attachment(ticket_id: str, aid: str):
    conn = db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT filename, mime, storage_path FROM ticket.ticket_attachments "
                "WHERE id = %s AND ticket_id = %s",
                (aid, ticket_id),
            )
            row = cur.fetchone()
        conn.rollback()
        if not row:
            raise HTTPException(404, "attachment not found")
        filename, mime, storage_path = row
        if not os.path.exists(storage_path):
            raise HTTPException(410, "blob missing on disk")
        return FileResponse(
            storage_path,
            media_type=mime,
            headers={"Content-Disposition": content_disposition_attachment(filename)},
        )
    except HTTPException:
        raise
    except Exception as exc:
        conn.rollback()
        raise HTTPException(500, f"download failed: {exc}")


@app.delete(
    "/v1/tickets/{ticket_id}/attachments/{aid}",
    dependencies=[Depends(require_secret)],
)
def delete_attachment(ticket_id: str, aid: str, actor: str = Depends(require_actor)) -> dict[str, Any]:
    conn = db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT storage_path, filename FROM ticket.ticket_attachments "
                "WHERE id = %s AND ticket_id = %s",
                (aid, ticket_id),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(404, "attachment not found")
            storage_path, filename = row
            cur.execute("DELETE FROM ticket.ticket_attachments WHERE id = %s", (aid,))
            _record_history(
                cur, ticket_id, "attachment_deleted",
                {"id": aid, "filename": filename}, None, actor,
            )
        conn.commit()
        try:
            os.unlink(storage_path)
        except FileNotFoundError:
            pass
        return {"ok": True}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as exc:
        conn.rollback()
        raise HTTPException(500, f"delete attachment failed: {exc}")
@app.post(
    "/v1/tickets/{ticket_id}/watchers",
    status_code=201,
    dependencies=[Depends(require_secret)],
)
def add_watcher(
    ticket_id: str,
    req: WatcherAdd,
    actor: str = Depends(require_actor),
) -> dict[str, Any]:
    conn = db()
    try:
        with conn.cursor() as cur:
            if not _fetch_ticket(cur, ticket_id):
                raise HTTPException(404, "ticket not found")
            cur.execute(
                "INSERT INTO ticket.ticket_watchers "
                "(ticket_id, watcher_mxid, added_by_mxid) VALUES (%s, %s, %s) "
                "ON CONFLICT (ticket_id, watcher_mxid) DO NOTHING "
                "RETURNING added_at",
                (ticket_id, req.mxid, actor),
            )
            row = cur.fetchone()
            if row:
                _record_history(cur, ticket_id, "watcher_added", None, {"mxid": req.mxid}, actor)
        conn.commit()
        return {"mxid": req.mxid, "added_by_mxid": actor,
                "added_at": (row[0].isoformat() if row else None), "already": row is None}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as exc:
        conn.rollback()
        raise HTTPException(500, f"add watcher failed: {exc}")


@app.delete(
    "/v1/tickets/{ticket_id}/watchers/{mxid}",
    dependencies=[Depends(require_secret)],
)
def remove_watcher(ticket_id: str, mxid: str, actor: str = Depends(require_actor)) -> dict[str, Any]:
    conn = db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM ticket.ticket_watchers "
                "WHERE ticket_id = %s AND watcher_mxid = %s "
                "RETURNING watcher_mxid",
                (ticket_id, mxid),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(404, "watcher not found on this ticket")
            _record_history(cur, ticket_id, "watcher_removed", {"mxid": mxid}, None, actor)
        conn.commit()
        return {"ok": True}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as exc:
        conn.rollback()
        raise HTTPException(500, f"remove watcher failed: {exc}")
@app.post(
    "/v1/tickets/{ticket_id}/messages",
    status_code=201,
    dependencies=[Depends(require_secret)],
)
def pin_message(
    ticket_id: str,
    req: PinMessage,
    actor: str = Depends(require_actor),
) -> dict[str, Any]:
    conn = db()
    try:
        with conn.cursor() as cur:
            if not _fetch_ticket(cur, ticket_id):
                raise HTTPException(404, "ticket not found")
            cur.execute(
                "SELECT 1 FROM agent.messages "
                "WHERE platform=%s AND workspace_id=%s AND channel_id=%s AND message_id=%s",
                (req.platform, req.workspace_id, req.channel_id, req.message_id),
            )
            if not cur.fetchone():
                raise HTTPException(404, "message not found in agent.messages")
            cur.execute(
                "INSERT INTO ticket.ticket_messages "
                "(ticket_id, platform, workspace_id, channel_id, message_id, pinned_by_mxid, note) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s) "
                "ON CONFLICT DO NOTHING RETURNING pinned_at",
                (ticket_id, req.platform, req.workspace_id, req.channel_id,
                 req.message_id, actor, req.note),
            )
            row = cur.fetchone()
            if row:
                _record_history(
                    cur, ticket_id, "message_pinned", None,
                    {"platform": req.platform, "channel_id": req.channel_id,
                     "message_id": req.message_id}, actor,
                )
        conn.commit()
        return {"already": row is None,
                "pinned_at": (row[0].isoformat() if row else None)}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as exc:
        conn.rollback()
        raise HTTPException(500, f"pin failed: {exc}")


@app.delete(
    "/v1/tickets/{ticket_id}/messages",
    dependencies=[Depends(require_secret)],
)
def unpin_message(
    ticket_id: str,
    platform: str = Query(...),
    workspace_id: str = Query(...),
    channel_id: str = Query(...),
    message_id: str = Query(...),
    actor: str = Depends(require_actor),
) -> dict[str, Any]:
    conn = db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM ticket.ticket_messages "
                "WHERE ticket_id=%s AND platform=%s AND workspace_id=%s "
                "AND channel_id=%s AND message_id=%s RETURNING message_id",
                (ticket_id, platform, workspace_id, channel_id, message_id),
            )
            if not cur.fetchone():
                raise HTTPException(404, "pin not found")
            _record_history(
                cur, ticket_id, "message_unpinned",
                {"platform": platform, "channel_id": channel_id, "message_id": message_id},
                None, actor,
            )
        conn.commit()
        return {"ok": True}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as exc:
        conn.rollback()
        raise HTTPException(500, f"unpin failed: {exc}")
@app.get("/v1/tickets/{ticket_id}/history", dependencies=[Depends(require_secret)])
def list_history(ticket_id: str, limit: int = Query(200, ge=1, le=1000)) -> dict[str, Any]:
    conn = db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, field, old_value, new_value, actor_mxid, ts "
                "FROM ticket.ticket_history WHERE ticket_id = %s "
                "ORDER BY ts DESC LIMIT %s",
                (ticket_id, limit),
            )
            entries = [
                {"id": str(r[0]), "field": r[1],
                 "old_value": r[2], "new_value": r[3],
                 "actor_mxid": r[4], "ts": r[5].isoformat()}
                for r in cur.fetchall()
            ]
        conn.rollback()
        return {"history": entries}
    except Exception as exc:
        conn.rollback()
        raise HTTPException(500, f"history failed: {exc}")


@app.get("/v1/customers", dependencies=[Depends(require_secret)])
def search_customers(
    q: Optional[str] = None,
    platform: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500),
) -> dict[str, Any]:
    """Search distinct (platform, workspace_id) pairs that have channels.
    A "customer" here is a chat workspace; a sample channel name is returned
    as a human-readable label.
    """
    where: list[str] = []
    args: list[Any] = []
    if q:
        where.append("channel_name ILIKE %s")
        args.append(f"%{q}%")
    if platform:
        where.append("platform = %s")
        args.append(platform)
    where_sql = ("WHERE " + " AND ".join(where)) if where else ""
    sql = (
        "SELECT platform, workspace_id, "
        "  (array_agg(channel_name ORDER BY updated_at DESC) FILTER (WHERE channel_name IS NOT NULL))[1] AS sample_name, "
        "  count(*) AS channel_count "
        f"FROM agent.channels {where_sql} "
        "GROUP BY platform, workspace_id "
        "ORDER BY channel_count DESC "
        "LIMIT %s"
    )
    args.append(limit)
    conn = db()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, args)
            rows = cur.fetchall()
        conn.rollback()
        return {
            "customers": [
                {"platform": r[0], "workspace_id": r[1],
                 "sample_channel_name": r[2], "channel_count": r[3]}
                for r in rows
            ]
        }
    except Exception as exc:
        conn.rollback()
        raise HTTPException(500, f"customer search failed: {exc}")
@app.get("/v1/templates", dependencies=[Depends(require_secret)])
def list_templates() -> dict[str, Any]:
    conn = db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, name, default_subject, default_description, "
                "default_priority, default_tags, metadata, created_at "
                "FROM ticket.ticket_templates ORDER BY created_at"
            )
            rows = cur.fetchall()
        conn.rollback()
        return {
            "templates": [
                {"id": str(r[0]), "name": r[1], "default_subject": r[2],
                 "default_description": r[3], "default_priority": r[4],
                 "default_tags": list(r[5] or []), "metadata": r[6] or {},
                 "created_at": r[7].isoformat()}
                for r in rows
            ]
        }
    except Exception as exc:
        conn.rollback()
        raise HTTPException(500, f"templates failed: {exc}")

