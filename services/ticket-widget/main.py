"""PixDesk Ticket Widget BFF — Element widget host + reverse proxy to ticket-api.

The widget HTML is loaded by Element in an iframe. Its JS uses the Matrix
Widget API to obtain a short-lived OpenID token, which we exchange against
Synapse for the user's mxid and store as a signed cookie. All ticket API
calls are then reverse-proxied here, with the BFF injecting the bearer
secret and X-Actor-Mxid header (drawn from the cookie, NOT the client
request, to prevent spoofing).

Authorization model:
  - Bearer secret stays inside the BFF (never reaches the browser).
  - "Can this user access this room's tickets?" = "is mxid currently joined
    to the Matrix room?" Cached for 30s; invalidated immediately before
    any write so a kicked user can't keep writing for the cache TTL.
"""
from __future__ import annotations

import asyncio
import os
import time
import uuid
from typing import Any, Optional

import httpx
import psycopg2
from fastapi import (
    Cookie,
    Depends,
    FastAPI,
    HTTPException,
    Query,
    Request,
    Response,
    status,
)
from fastapi.responses import FileResponse, JSONResponse
from itsdangerous import BadSignature, SignatureExpired, TimestampSigner
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

DATABASE_URL = os.environ["DATABASE_URL"]
MATRIX_HOMESERVER = os.environ.get("MATRIX_HOMESERVER", "http://synapse:8008")
ADMIN_TOKEN = os.environ["MATRIX_ADMIN_ACCESS_TOKEN"]
TICKET_API_URL = os.environ.get("TICKET_API_URL", "http://pixdesk-ticket-api:8766")
TICKET_API_SECRET = os.environ["TICKET_API_SHARED_SECRET"]
COOKIE_SECRET = os.environ["WIDGET_COOKIE_SECRET"]
PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL", "http://192.168.72.185:8767")
ELEMENT_ORIGIN = os.environ.get("ELEMENT_ORIGIN", "http://192.168.72.185:8080")

# Issue engine (Closed-Loop Engine dashboard). The dashboard is cross-customer,
# so unlike the room-scoped ticket views it is gated by a reviewer allowlist
# rather than per-room membership.
ISSUE_API_URL = os.environ.get("ISSUE_API_URL", "http://pixdesk-issue-engine:8768")
ISSUE_API_SECRET = os.environ.get("ISSUE_API_SHARED_SECRET", "")
# Comma-separated mxids allowed to use the dashboard. If empty, the dashboard
# is DISABLED (403) — fail closed, since it exposes every customer's issues.
# This is the single swap-point for the still-TBD reviewer-authz decision: to
# switch to "members of a staff room", replace _is_reviewer's body.
REVIEWER_ALLOWLIST = tuple(
    s.strip() for s in os.environ.get("REVIEWER_ALLOWLIST", "").split(",") if s.strip()
)

COOKIE_NAME = "pixdesk_ticket_session"
COOKIE_TTL_SECONDS = 50 * 60  # < OpenID 1h ceiling
MEMBERSHIP_CACHE_TTL = 30  # seconds

STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

signer = TimestampSigner(COOKIE_SECRET, salt="pixdesk-ticket-widget")

app = FastAPI(title="PixDesk Ticket Widget", version="0.1.0")

# Single async HTTP client kept alive for the process lifetime.
_http: Optional[httpx.AsyncClient] = None
# Single sync DB connection for room→conversation lookups (small/fast queries).
_pg: Optional[psycopg2.extensions.connection] = None
# Membership cache: (mxid, room_id) -> (joined: bool, fetched_at: float)
_membership_cache: dict[tuple[str, str], tuple[bool, float]] = {}


@app.on_event("startup")
async def _startup() -> None:
    global _http, _pg
    _http = httpx.AsyncClient(timeout=httpx.Timeout(20.0, connect=5.0))
    _pg = psycopg2.connect(DATABASE_URL)
    _pg.autocommit = True


@app.on_event("shutdown")
async def _shutdown() -> None:
    if _http is not None:
        await _http.aclose()
    if _pg is not None:
        _pg.close()


def _pg_conn() -> psycopg2.extensions.connection:
    """Return a live psycopg2 connection, reconnecting if the prior one died."""
    global _pg
    if _pg is None or _pg.closed:
        _pg = psycopg2.connect(DATABASE_URL)
        _pg.autocommit = True
        return _pg
    try:
        with _pg.cursor() as cur:
            cur.execute("SELECT 1")
        return _pg
    except Exception:
        try:
            _pg.close()
        except Exception:
            pass
        _pg = psycopg2.connect(DATABASE_URL)
        _pg.autocommit = True
        return _pg


def _security_headers() -> dict[str, str]:
    # frame-ancestors lets Element load the widget; X-Frame-Options would
    # override that, so we deliberately don't set it.
    return {
        "Content-Security-Policy": (
            "default-src 'self'; "
            "img-src 'self' data:; "
            "style-src 'self' 'unsafe-inline'; "
            "script-src 'self'; "
            f"frame-ancestors {ELEMENT_ORIGIN};"
        ),
        "Referrer-Policy": "no-referrer",
    }


def _set_cookie(resp: Response, mxid: str) -> None:
    token = signer.sign(mxid).decode()
    resp.set_cookie(
        COOKIE_NAME, token,
        max_age=COOKIE_TTL_SECONDS,
        httponly=True,
        samesite="lax",
        secure=False,  # LAN HTTP
        path="/",
    )


def _read_cookie(token: Optional[str]) -> Optional[str]:
    if not token:
        return None
    try:
        return signer.unsign(token, max_age=COOKIE_TTL_SECONDS).decode()
    except (BadSignature, SignatureExpired):
        return None


def require_session(
    pixdesk_ticket_session: Optional[str] = Cookie(default=None),
) -> str:
    mxid = _read_cookie(pixdesk_ticket_session)
    if not mxid:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "auth required")
    return mxid


async def _is_room_member(
    mxid: str, room_id: str, *, force_refresh: bool = False,
) -> bool:
    """Check if mxid is currently joined to room_id; cached 30s.

    Uses the admin token because /joined_members is gated on caller membership;
    the admin user joins every bridged room via the listener path so this
    works for the rooms we care about.
    """
    key = (mxid, room_id)
    now = time.time()
    if not force_refresh:
        cached = _membership_cache.get(key)
        if cached and now - cached[1] < MEMBERSHIP_CACHE_TTL:
            return cached[0]
    assert _http is not None
    resp = await _http.get(
        f"{MATRIX_HOMESERVER}/_matrix/client/v3/rooms/"
        f"{room_id}/joined_members",
        headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
    )
    joined = resp.status_code == 200 and mxid in (resp.json().get("joined", {}) or {})
    _membership_cache[key] = (joined, now)
    return joined


def _conversations_for_room(room_id: str) -> list[str]:
    with _pg_conn().cursor() as cur:
        cur.execute(
            "SELECT id FROM agent.conversations "
            "WHERE matrix_room_id = %s ORDER BY last_activity_at DESC",
            (room_id,),
        )
        return [str(r[0]) for r in cur.fetchall()]


# ---------------------------------------------------------------------------
# Static serving
# ---------------------------------------------------------------------------


@app.get("/healthz")
def healthz() -> dict[str, Any]:
    return {"ok": True, "public_base_url": PUBLIC_BASE_URL}


@app.get("/widget/")
@app.get("/widget")
def widget_index() -> FileResponse:
    return FileResponse(
        os.path.join(STATIC_DIR, "index.html"),
        media_type="text/html",
        headers=_security_headers(),
    )


@app.get("/widget/{path:path}")
def widget_static(path: str) -> FileResponse:
    safe = os.path.normpath(path)
    if safe.startswith("..") or safe.startswith("/"):
        raise HTTPException(404, "not found")
    full = os.path.join(STATIC_DIR, safe)
    if not os.path.isfile(full):
        raise HTTPException(404, "not found")
    media_type = None
    if safe.endswith(".js"):
        media_type = "application/javascript"
    elif safe.endswith(".css"):
        media_type = "text/css"
    elif safe.endswith(".html"):
        media_type = "text/html"
    return FileResponse(full, media_type=media_type, headers=_security_headers())


# ---------------------------------------------------------------------------
# Auth: OpenID -> mxid -> cookie
# ---------------------------------------------------------------------------


class AuthRequest(BaseModel):
    # Two flows are supported:
    #   - openid_token: full OpenID handshake against Synapse (preferred).
    #   - user_id + room_id: trust Element's $matrix_user_id substitution and
    #     verify the user is a current member of room_id. Used when the widget
    #     host (e.g. Element on http) doesn't deliver OpenID responses.
    openid_token: Optional[str] = None
    matrix_server_name: Optional[str] = None  # ignored on purpose
    user_id: Optional[str] = None
    room_id: Optional[str] = None


@app.post("/api/auth")
async def api_auth(req: AuthRequest, response: Response) -> dict[str, Any]:
    assert _http is not None
    if req.openid_token:
        # Always call our configured Synapse, NOT whatever matrix_server_name
        # the widget sent.
        resp = await _http.get(
            f"{MATRIX_HOMESERVER}/_matrix/federation/v1/openid/userinfo",
            params={"access_token": req.openid_token},
        )
        if resp.status_code != 200:
            raise HTTPException(401, f"openid validation failed: {resp.text[:200]}")
        sub = (resp.json() or {}).get("sub", "")
        if not sub.startswith("@") or ":" not in sub:
            raise HTTPException(401, f"openid response missing sub: {sub!r}")
        _set_cookie(response, sub)
        return {"mxid": sub, "via": "openid"}

    if req.user_id and req.room_id:
        if not req.user_id.startswith("@") or ":" not in req.user_id:
            raise HTTPException(400, "user_id must look like @user:server")
        if not req.room_id.startswith("!"):
            raise HTTPException(400, "room_id must look like !room:server")
        # The mxid was passed by Element via $matrix_user_id substitution. Trust
        # it only after confirming the user is currently a member of the
        # claimed room — gates against forged URLs from outside Element.
        joined = await _is_room_member(req.user_id, req.room_id, force_refresh=True)
        if not joined:
            raise HTTPException(403, f"{req.user_id} is not a member of {req.room_id}")
        _set_cookie(response, req.user_id)
        return {"mxid": req.user_id, "via": "url"}

    raise HTTPException(400, "auth requires openid_token or (user_id + room_id)")


@app.post("/api/logout")
def api_logout(response: Response) -> dict[str, Any]:
    response.delete_cookie(COOKIE_NAME, path="/")
    return {"ok": True}


@app.get("/api/whoami")
def api_whoami(mxid: str = Depends(require_session)) -> dict[str, Any]:
    return {"mxid": mxid}


# ---------------------------------------------------------------------------
# Reverse proxy helper
# ---------------------------------------------------------------------------


async def _proxy(
    method: str, path: str, mxid: str,
    *, params: Optional[dict] = None, json_body: Any = None,
) -> httpx.Response:
    """Proxy a request to ticket-api with bearer + actor headers injected."""
    assert _http is not None
    url = f"{TICKET_API_URL}{path}"
    headers = {
        "Authorization": f"Bearer {TICKET_API_SECRET}",
        "X-Actor-Mxid": mxid,
    }
    return await _http.request(
        method, url, params=params, json=json_body, headers=headers,
    )


def _passthrough(resp: httpx.Response) -> Response:
    """Translate the upstream response into a Starlette/FastAPI Response."""
    media_type = resp.headers.get("content-type", "application/json")
    return Response(content=resp.content, status_code=resp.status_code, media_type=media_type)


async def _require_room_membership(mxid: str, room_id: str, *, write: bool = False) -> None:
    if not room_id or not room_id.startswith("!"):
        raise HTTPException(400, "valid room_id required (must start with '!')")
    joined = await _is_room_member(mxid, room_id, force_refresh=write)
    if not joined:
        raise HTTPException(403, f"{mxid} is not a member of {room_id}")


def _is_reviewer(mxid: str) -> bool:
    """Single swap-point for the (still-TBD) dashboard authorization policy.
    Default: explicit allowlist. To switch to staff-room membership, replace the
    body with an _is_room_member check against a configured staff room id."""
    return bool(REVIEWER_ALLOWLIST) and mxid in REVIEWER_ALLOWLIST


def require_reviewer(mxid: str = Depends(require_session)) -> str:
    """Gate WRITE actions on the dashboard. The dashboard is an internal LAN
    visibility tool; READ endpoints are open to anyone reachable. Writes still
    require a valid Matrix session, and (optionally) membership in
    REVIEWER_ALLOWLIST when that env var is non-empty."""
    if REVIEWER_ALLOWLIST and mxid not in REVIEWER_ALLOWLIST:
        raise HTTPException(403, "not authorized for write actions")
    return mxid


async def _issue_proxy(
    method: str, path: str, mxid: str,
    *, params: Optional[dict] = None, json_body: Any = None,
) -> httpx.Response:
    """Proxy to the issue-engine with bearer + actor headers injected (actor from
    the signed cookie, never the client)."""
    assert _http is not None
    headers = {"X-Actor-Mxid": mxid}
    if ISSUE_API_SECRET:
        headers["Authorization"] = f"Bearer {ISSUE_API_SECRET}"
    return await _http.request(
        method, f"{ISSUE_API_URL}{path}", params=params, json=json_body, headers=headers,
    )


def _require_ticket_in_room(ticket_id: str, room_id: str) -> None:
    if not _ticket_belongs_to_room(ticket_id, room_id):
        raise HTTPException(403, "ticket does not belong to this room")


# ---------------------------------------------------------------------------
# /api/v1 endpoints (room-scoped)
# ---------------------------------------------------------------------------


@app.get("/api/v1/tickets")
async def list_tickets(
    request: Request,
    room_id: str = Query(...),
    mxid: str = Depends(require_session),
) -> Any:
    await _require_room_membership(mxid, room_id)
    conv_ids = _conversations_for_room(room_id)
    if not conv_ids:
        return {"tickets": [], "limit": 50, "offset": 0}
    # Fetch tickets per-conversation in parallel; merge by opened_at desc.
    base_qs = dict(request.query_params)
    base_qs.pop("room_id", None)
    base_qs.pop("conversation_id", None)
    tasks = [
        _proxy("GET", "/v1/tickets", mxid,
               params={**base_qs, "conversation_id": cid})
        for cid in conv_ids
    ]
    responses = await asyncio.gather(*tasks)
    merged: list[dict] = []
    for r in responses:
        if r.status_code != 200:
            continue
        merged.extend((r.json() or {}).get("tickets", []))
    merged.sort(key=lambda t: t.get("opened_at") or "", reverse=True)
    seen: set[str] = set()
    deduped: list[dict] = []
    for t in merged:
        if t["id"] in seen:
            continue
        seen.add(t["id"])
        deduped.append(t)
    return {"tickets": deduped, "count": len(deduped)}


class TicketCreateBody(BaseModel):
    subject: str
    description: Optional[str] = None
    assignee_mxid: Optional[str] = None
    priority: Optional[str] = "standard"
    status: Optional[str] = "open"
    tags: Optional[list[str]] = None
    template_id: Optional[str] = None
    due_at: Optional[str] = None
    metadata: Optional[dict] = None


@app.post("/api/v1/tickets", status_code=201)
async def create_ticket(
    body: TicketCreateBody,
    room_id: str = Query(...),
    mxid: str = Depends(require_session),
) -> Any:
    await _require_room_membership(mxid, room_id, write=True)
    conv_ids = _conversations_for_room(room_id)
    if not conv_ids:
        raise HTTPException(409, "this room has no conversation yet — wait for first message")
    payload = body.model_dump(exclude_none=True)
    payload["conversation_id"] = conv_ids[0]  # most recent activity
@app.get("/api/v1/tickets/{ticket_id}")
async def get_ticket(
    ticket_id: str,
    room_id: str = Query(...),
    mxid: str = Depends(require_session),
) -> Any:
    await _require_room_membership(mxid, room_id)
    _require_ticket_in_room(ticket_id, room_id)
    resp = await _proxy("GET", f"/v1/tickets/{ticket_id}", mxid)
    return _passthrough(resp)


class TicketPatchBody(BaseModel):
    subject: Optional[str] = None
    description: Optional[str] = None
    assignee_mxid: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    tags: Optional[list[str]] = None
    template_id: Optional[str] = None
    due_at: Optional[str] = None
    metadata: Optional[dict] = None
    comment: Optional[str] = None
    comment_is_internal: bool = False


@app.patch("/api/v1/tickets/{ticket_id}")
async def patch_ticket(
    ticket_id: str,
    body: TicketPatchBody,
    room_id: str = Query(...),
    mxid: str = Depends(require_session),
) -> Any:
    await _require_room_membership(mxid, room_id, write=True)
    _require_ticket_in_room(ticket_id, room_id)
    payload = body.model_dump(exclude_unset=True)
    resp = await _proxy("PATCH", f"/v1/tickets/{ticket_id}", mxid, json_body=payload)
    return _passthrough(resp)


@app.get("/api/v1/tickets/{ticket_id}/comments")
async def list_comments(
    ticket_id: str,
    room_id: str = Query(...),
    mxid: str = Depends(require_session),
) -> Any:
    await _require_room_membership(mxid, room_id)
    _require_ticket_in_room(ticket_id, room_id)
    resp = await _proxy("GET", f"/v1/tickets/{ticket_id}/comments", mxid)
    return _passthrough(resp)


class CommentBody(BaseModel):
    body: str
    is_internal: bool = False


@app.post("/api/v1/tickets/{ticket_id}/comments", status_code=201)
async def add_comment(
    ticket_id: str,
    body: CommentBody,
    room_id: str = Query(...),
    mxid: str = Depends(require_session),
) -> Any:
    await _require_room_membership(mxid, room_id, write=True)
    _require_ticket_in_room(ticket_id, room_id)
    resp = await _proxy(
        "POST", f"/v1/tickets/{ticket_id}/comments", mxid,
        json_body=body.model_dump(),
    )
    return _passthrough(resp)


@app.delete("/api/v1/tickets/{ticket_id}/comments/{cid}")
async def delete_comment(
    ticket_id: str,
    cid: str,
    room_id: str = Query(...),
    mxid: str = Depends(require_session),
) -> Any:
    await _require_room_membership(mxid, room_id, write=True)
    _require_ticket_in_room(ticket_id, room_id)
    resp = await _proxy("DELETE", f"/v1/tickets/{ticket_id}/comments/{cid}", mxid)
    return _passthrough(resp)


@app.get("/api/v1/templates")
async def list_templates(mxid: str = Depends(require_session)) -> Any:
    resp = await _proxy("GET", "/v1/templates", mxid)
    return _passthrough(resp)


@app.get("/api/v1/customer")
async def get_customer(
    room_id: str = Query(...),
    mxid: str = Depends(require_session),
) -> Any:
    """Resolve room → customer label so the create form can show it."""
    await _require_room_membership(mxid, room_id)
    with _pg_conn().cursor() as cur:
        cur.execute(
            """
            SELECT DISTINCT c.platform, c.workspace_id, ch.channel_name
            FROM agent.conversations c
            LEFT JOIN agent.channels ch
              ON ch.platform = c.platform
             AND ch.workspace_id = c.workspace_id
             AND ch.channel_id = c.channel_id
            WHERE c.matrix_room_id = %s
            ORDER BY c.platform, c.workspace_id
            LIMIT 1
            """,
            (room_id,),
        )
        row = cur.fetchone()
    if not row:
        return {"platform": None, "workspace_id": None, "channel_name": None}
    return {"platform": row[0], "workspace_id": row[1], "channel_name": row[2]}








# ---------------------------------------------------------------------------
# Issue dashboard (cross-customer, reviewer-gated). Static page + BFF proxy to
# the issue-engine. Auth is the reviewer allowlist, NOT room membership.
# ---------------------------------------------------------------------------


@app.get("/dashboard/")
@app.get("/dashboard")
def dashboard_index() -> FileResponse:
    return FileResponse(
        os.path.join(STATIC_DIR, "dashboard.html"),
        media_type="text/html",
        headers=_security_headers(),
    )


@app.get("/api/v1/dashboard/unclosed")
async def dash_unclosed() -> Any:
    resp = await _issue_proxy("GET", "/v1/issues/unclosed", "@anon:dashboard")
    return _passthrough(resp)


@app.get("/api/v1/dashboard/rollup")
async def dash_rollup() -> Any:
    resp = await _issue_proxy("GET", "/v1/customers/rollup", "@anon:dashboard")
    return _passthrough(resp)


@app.get("/api/v1/dashboard/issues")
async def dash_issues(
    request: Request,
) -> Any:
    params = dict(request.query_params)
    resp = await _issue_proxy("GET", "/v1/issues", "@anon:dashboard", params=params)
    return _passthrough(resp)


@app.get("/api/v1/dashboard/issues/{issue_id}")
async def dash_issue_detail(issue_id: str) -> Any:
    resp = await _issue_proxy("GET", f"/v1/issues/{issue_id}", "@anon:dashboard")
    return _passthrough(resp)


@app.get("/api/v1/dashboard/summary")
async def dash_summary() -> Any:
    resp = await _issue_proxy("GET", "/v1/dashboard/summary", "@anon:dashboard")
    return _passthrough(resp)


@app.get("/api/v1/dashboard/customers/issues")
async def dash_customer_issues(
    request: Request,
) -> Any:
    """Per-customer issue list. Pass platform/workspace_id/channel_id as query."""
    params = dict(request.query_params)
    resp = await _issue_proxy("GET", "/v1/dashboard/customers/issues",
                              "@anon:dashboard", params=params)
    return _passthrough(resp)


@app.get("/api/v1/dashboard/issues/{issue_id}/transcript")
async def dash_issue_transcript(issue_id: str) -> Any:
    resp = await _issue_proxy("GET", f"/v1/dashboard/issues/{issue_id}/transcript",
                              "@anon:dashboard")
    return _passthrough(resp)


class DashReviewBody(BaseModel):
    action: str
    note: Optional[str] = None


@app.post("/api/v1/dashboard/issues/{issue_id}/review")
async def dash_review(issue_id: str, body: DashReviewBody, mxid: str = Depends(require_reviewer)) -> Any:
    resp = await _issue_proxy(
        "POST", f"/v1/issues/{issue_id}/review", mxid, json_body=body.model_dump(),
    )
    return _passthrough(resp)


class DashMergeBody(BaseModel):
    into_issue_id: str


@app.post("/api/v1/dashboard/issues/{issue_id}/merge")
async def dash_merge(issue_id: str, body: DashMergeBody, mxid: str = Depends(require_reviewer)) -> Any:
    resp = await _issue_proxy(
        "POST", f"/v1/issues/{issue_id}/merge", mxid, json_body=body.model_dump(),
    )
    return _passthrough(resp)


class DashPromoteBody(BaseModel):
    subject: Optional[str] = None
    priority: Optional[str] = "standard"


@app.post("/api/v1/dashboard/issues/{issue_id}/promote", status_code=201)
async def dash_promote(issue_id: str, body: DashPromoteBody, mxid: str = Depends(require_reviewer)) -> Any:
    """Promote an issue to a real ticket. Orchestration lives in the BFF: it
    reads the issue (for conversation_id + title), creates the ticket via
    ticket-api (the sole ticket write path), then links the issue to it via the
    engine. If the link step fails the ticket still exists — surfaced to the
    caller so it can be reconciled, rather than silently dropping either side."""
    detail = await _issue_proxy("GET", f"/v1/issues/{issue_id}", "@anon:dashboard")
    if detail.status_code != 200:
        return _passthrough(detail)
    issue = detail.json() or {}
    conversation_id = issue.get("conversation_id")
    if not conversation_id:
        raise HTTPException(409, "issue has no conversation_id; cannot promote")
    subject = (body.subject or issue.get("title") or "").strip() or "客户问题"

    # 1. Create the ticket via ticket-api (bearer + actor injected by _proxy).
    create = await _proxy(
        "POST", "/v1/tickets", mxid,
        json_body={
            "subject": subject,
            "conversation_id": conversation_id,
            "priority": body.priority or "standard",
            "metadata": {"promoted_from_issue": issue_id,
                         "issue_code": issue.get("code")},
        },
    )
    if create.status_code not in (200, 201):
        return _passthrough(create)
    ticket = create.json() or {}
    ticket_id = ticket.get("id")
    if not ticket_id:
        raise HTTPException(502, "ticket-api did not return a ticket id")

    # 2. Link the issue to the ticket via the engine.
    link = await _issue_proxy(
        "POST", f"/v1/issues/{issue_id}/promote", mxid,
        json_body={"ticket_id": ticket_id},
    )
    if link.status_code != 200:
        # Ticket exists but link failed — report both so the operator can fix up.
        raise HTTPException(
            502,
            f"ticket {ticket_id} created but issue link failed: "
            f"{link.status_code} {link.text[:200]}",
        )
    return {"ok": True, "issue_id": issue_id, "ticket": ticket}
