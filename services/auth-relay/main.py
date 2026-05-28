"""PixDesk Auth Relay — login bridges through admin Matrix account.

Exposes HTTP endpoints used by a desktop app (or curl) to log in to the
mautrix-discord, mautrix-slack and mautrix-telegram bridges without the user
having to type bot commands manually inside Element.

The relay holds the admin's Matrix access token. For each login request it:

  1. Resolves (or creates) the DM room between admin and the relevant bridge
     bot.
  2. Sends the appropriate `login` command(s) into that room.
  3. Polls the room for the bot's reply, and returns a structured result.

Authentication: every request must carry `Authorization: Bearer $SECRET`.
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
import re
import time
import urllib.parse
from typing import Any, Optional

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, status
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

HOMESERVER = os.environ.get("MATRIX_HOMESERVER", "http://synapse:8008")
ADMIN_USER_ID = os.environ["MATRIX_ADMIN_USER_ID"]            # e.g. @admin:example.com
ADMIN_TOKEN = os.environ["MATRIX_ADMIN_ACCESS_TOKEN"]
SERVER_NAME = ADMIN_USER_ID.split(":", 1)[1]

DISCORD_BOT = os.environ.get("DISCORD_BOT_MXID", f"@discordbot:{SERVER_NAME}")
SLACK_BOT = os.environ.get("SLACK_BOT_MXID", f"@slackbot:{SERVER_NAME}")
TELEGRAM_BOT = os.environ.get("TELEGRAM_BOT_MXID", f"@telegrambot:{SERVER_NAME}")

SHARED_SECRET = os.environ.get("RELAY_SHARED_SECRET")  # required at runtime
DEFAULT_TIMEOUT = float(os.environ.get("LOGIN_TIMEOUT_SECONDS", "30"))
QR_TIMEOUT = float(os.environ.get("QR_TIMEOUT_SECONDS", "180"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("auth-relay")

app = FastAPI(title="PixDesk Auth Relay", version="0.1.0")

# Cache: bot_mxid -> dm_room_id
_dm_room_cache: dict[str, str] = {}
# Rooms we've already promoted to management rooms (per relay process lifetime).
_management_room_set: set[str] = set()

# A single shared HTTP client (keep-alive to Synapse)
_http: Optional[httpx.AsyncClient] = None


@app.on_event("startup")
async def _startup() -> None:
    global _http
    if not SHARED_SECRET:
        raise RuntimeError("RELAY_SHARED_SECRET must be set")
    _http = httpx.AsyncClient(
        base_url=HOMESERVER,
        headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
        timeout=httpx.Timeout(30.0, connect=10.0),
    )


@app.on_event("shutdown")
async def _shutdown() -> None:
    if _http is not None:
        await _http.aclose()


# ---------------------------------------------------------------------------
# Auth dependency
# ---------------------------------------------------------------------------


def require_secret(authorization: str = Header(default="")) -> None:
    expected = f"Bearer {SHARED_SECRET}"
    if authorization != expected:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid bearer token")


# ---------------------------------------------------------------------------
# Matrix helpers
# ---------------------------------------------------------------------------


async def _matrix(method: str, path: str, **kwargs: Any) -> httpx.Response:
    assert _http is not None
    resp = await _http.request(method, path, **kwargs)
    if resp.status_code >= 400:
        log.warning("matrix %s %s -> %s %s", method, path, resp.status_code, resp.text[:300])
    return resp


async def _ensure_dm(bot_mxid: str) -> str:
    """Return the admin <-> bot DM room id, creating it if needed."""
    if bot_mxid in _dm_room_cache:
        return _dm_room_cache[bot_mxid]

    # 1) Check m.direct account data — the canonical DM mapping.
    direct_resp = await _matrix(
        "GET",
        f"/_matrix/client/v3/user/{urllib.parse.quote(ADMIN_USER_ID)}/account_data/m.direct",
    )
    if direct_resp.status_code == 200:
        for room_id in direct_resp.json().get(bot_mxid, []) or []:
            members = await _matrix(
                "GET",
                f"/_matrix/client/v3/rooms/{urllib.parse.quote(room_id)}/joined_members",
            )
            if members.status_code == 200 and bot_mxid in members.json().get("joined", {}):
                _dm_room_cache[bot_mxid] = room_id
                return room_id

    # 2) Otherwise create a fresh DM and remember it in m.direct.
    create = await _matrix(
        "POST",
        "/_matrix/client/v3/createRoom",
        json={
            "preset": "trusted_private_chat",
            "invite": [bot_mxid],
            "is_direct": True,
        },
    )
    if create.status_code != 200:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            f"failed to create DM with {bot_mxid}: {create.text}",
        )
    room_id = create.json()["room_id"]

    existing = direct_resp.json() if direct_resp.status_code == 200 else {}
    existing.setdefault(bot_mxid, [])
    if room_id not in existing[bot_mxid]:
        existing[bot_mxid].append(room_id)
    await _matrix(
        "PUT",
        f"/_matrix/client/v3/user/{urllib.parse.quote(ADMIN_USER_ID)}/account_data/m.direct",
        json=existing,
    )

    _dm_room_cache[bot_mxid] = room_id
    return room_id


async def _send_text(room_id: str, text: str) -> str:
    txn = f"auth-relay-{int(time.time() * 1000)}"
    resp = await _matrix(
        "PUT",
        f"/_matrix/client/v3/rooms/{urllib.parse.quote(room_id)}/send/m.room.message/{txn}",
        json={"msgtype": "m.text", "body": text},
    )
    if resp.status_code != 200:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"send failed: {resp.text}")
    return resp.json()["event_id"]


async def _ensure_management_room(room_id: str, command_prefix: str) -> None:
    """Mark the DM as the user's management room so naked commands work.

    bridgev2 (used by mautrix-slack and current mautrix-discord) only treats
    naked commands as bridge commands when the DM is the user's management
    room. Until that's set, only `!<prefix>` commands are handled. This call
    is idempotent — repeating it just gets a "Management room updated" reply.
    """
    if room_id in _management_room_set:
        return
    await _send_text(room_id, f"{command_prefix} set-management-room")
    _management_room_set.add(room_id)
    # Give the bridge a moment to commit the management-room state before
    # subsequent naked commands land.
    await asyncio.sleep(1.5)


async def _wait_for_replies(
    room_id: str,
    bot_mxid: str,
    after_ts_ms: int,
    *,
    timeout: float,
    stop_predicate=None,
) -> list[dict[str, Any]]:
    """Poll the timeline until `stop_predicate(events)` is truthy or timeout elapses.

    Returns every bot-authored timeline event after `after_ts_ms`.
    """
    deadline = time.time() + timeout
    seen_event_ids: set[str] = set()
    collected: list[dict[str, Any]] = []

    while time.time() < deadline:
        resp = await _matrix(
            "GET",
            f"/_matrix/client/v3/rooms/{urllib.parse.quote(room_id)}/messages"
            "?dir=b&limit=20",
        )
        if resp.status_code == 200:
            for ev in resp.json().get("chunk", []):
                if ev.get("sender") != bot_mxid:
                    continue
                if ev.get("type") not in ("m.room.message",):
                    continue
                if ev.get("origin_server_ts", 0) <= after_ts_ms:
                    continue
                ev_id = ev.get("event_id")
                if ev_id in seen_event_ids:
                    continue
                seen_event_ids.add(ev_id)
                collected.append(ev)

        # newest-first chunk; keep collected ordered chronologically
        collected.sort(key=lambda e: e.get("origin_server_ts", 0))

        if stop_predicate and stop_predicate(collected):
            return collected
        await asyncio.sleep(1.0)

    return collected


def _bodies(events: list[dict[str, Any]]) -> list[str]:
    return [e.get("content", {}).get("body", "") for e in events]


async def _download_mxc_as_data_url(mxc: str) -> str:
    """Download an mxc:// URI and return a data: URL."""
    if not mxc.startswith("mxc://"):
        raise ValueError(f"not an mxc uri: {mxc}")
    server, media_id = mxc[len("mxc://") :].split("/", 1)
    # Authenticated media endpoint, falling back to legacy.
    paths = [
        f"/_matrix/client/v1/media/download/{server}/{media_id}",
        f"/_matrix/media/v3/download/{server}/{media_id}",
    ]
    last_err = None
    for path in paths:
        resp = await _matrix("GET", path)
        if resp.status_code == 200:
            mimetype = resp.headers.get("content-type", "image/png")
            b64 = base64.b64encode(resp.content).decode()
            return f"data:{mimetype};base64,{b64}"
        last_err = resp.text
    raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"could not download {mxc}: {last_err}")


# ---------------------------------------------------------------------------
# API models
# ---------------------------------------------------------------------------


class DiscordLogin(BaseModel):
    token: str = Field(..., description="Discord user token (NOT a bot token)")


class SlackLogin(BaseModel):
    auth_token: str = Field(..., description="xoxc-... browser token")
    cookie_token: str = Field(..., description="xoxd-... d cookie value")


class TelegramQRStart(BaseModel):
    pass


class LoginReply(BaseModel):
    ok: bool
    bot: str
    room_id: str
    messages: list[str]
    rooms_joined: int = 0


class TelegramQRReply(LoginReply):
    qr_data_url: Optional[str] = None
    qr_mxc: Optional[str] = None
    needs_password: bool = False


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/healthz")
async def healthz() -> dict[str, Any]:
    return {"ok": True, "admin": ADMIN_USER_ID, "homeserver": HOMESERVER}


@app.post("/login/discord", response_model=LoginReply, dependencies=[Depends(require_secret)])
async def login_discord(req: DiscordLogin) -> LoginReply:
    room = await _ensure_dm(DISCORD_BOT)
    await _ensure_management_room(room, "!discord")
    started = int(time.time() * 1000)
    await _send_text(room, f"login-token user {req.token}")

    def stop(events: list[dict[str, Any]]) -> bool:
        text = " ".join(_bodies(events)).lower()
        return any(s in text for s in ("successfully logged in", "invalid token", "error logging in", "login failed", "you're already logged in"))

    events = await _wait_for_replies(room, DISCORD_BOT, started, timeout=DEFAULT_TIMEOUT, stop_predicate=stop)
    bodies = _bodies(events)
    ok = any("successfully logged in" in b.lower() for b in bodies)
    rooms_joined = await _accept_bridge_invites("discord") if ok else 0
    return LoginReply(ok=ok, bot=DISCORD_BOT, room_id=room, messages=bodies, rooms_joined=rooms_joined)


@app.post("/login/slack", response_model=LoginReply, dependencies=[Depends(require_secret)])
async def login_slack(req: SlackLogin) -> LoginReply:
    room = await _ensure_dm(SLACK_BOT)
    await _ensure_management_room(room, "!slack")
    # Clear any half-finished login from a previous attempt before starting a new one.
    await _send_text(room, "!slack cancel")
    await asyncio.sleep(1.0)
    started = int(time.time() * 1000)
    # bridgev2 flow: send `login token`, then a single JSON object containing
    # both auth_token (xoxc-...) and cookie_token (xoxd-...).
    await _send_text(room, "login token")
    await asyncio.sleep(2.0)
    payload = json.dumps({"auth_token": req.auth_token, "cookie_token": req.cookie_token})
    await _send_text(room, payload)

    def stop(events: list[dict[str, Any]]) -> bool:
        text = " ".join(_bodies(events)).lower()
        return any(s in text for s in (
            "successfully logged in",
            "login failed",
            "invalid value",
            "missing some keys",
            "failed to parse input",
            "invalid_auth",
            "not_authed",
        ))

    events = await _wait_for_replies(room, SLACK_BOT, started, timeout=DEFAULT_TIMEOUT, stop_predicate=stop)
    bodies = _bodies(events)
    ok = any("successfully logged in" in b.lower() for b in bodies)
    rooms_joined = await _accept_bridge_invites("slack") if ok else 0
    return LoginReply(ok=ok, bot=SLACK_BOT, room_id=room, messages=bodies, rooms_joined=rooms_joined)


@app.post("/login/telegram/qr", response_model=TelegramQRReply, dependencies=[Depends(require_secret)])
async def login_telegram_qr(req: TelegramQRStart) -> TelegramQRReply:
    room = await _ensure_dm(TELEGRAM_BOT)
    started = int(time.time() * 1000)
    await _send_text(room, "login qr")

    def stop(events: list[dict[str, Any]]) -> bool:
        if any(e.get("content", {}).get("msgtype") == "m.image" for e in events):
            return True
        text = " ".join(_bodies(events)).lower()
        return "login failed" in text or "error" in text

    events = await _wait_for_replies(room, TELEGRAM_BOT, started, timeout=QR_TIMEOUT, stop_predicate=stop)

    qr_data_url: Optional[str] = None
    qr_mxc: Optional[str] = None
    for ev in events:
        content = ev.get("content", {})
        if content.get("msgtype") == "m.image":
            qr_mxc = content.get("url")
            if qr_mxc:
                qr_data_url = await _download_mxc_as_data_url(qr_mxc)
                break

    bodies = _bodies(events)
    text_blob = " ".join(bodies).lower()
    needs_password = "password" in text_blob and "two-factor" in text_blob
    ok = qr_data_url is not None
    return TelegramQRReply(
        ok=ok,
        bot=TELEGRAM_BOT,
        room_id=room,
        messages=bodies,
        qr_data_url=qr_data_url,
        qr_mxc=qr_mxc,
        needs_password=needs_password,
    )


class TelegramStatusReq(BaseModel):
    room_id: str
    since_ts_ms: int = 0


@app.post("/login/telegram/status", response_model=LoginReply, dependencies=[Depends(require_secret)])
async def login_telegram_status(req: TelegramStatusReq) -> LoginReply:
    """Poll for login progress after the QR was shown."""
    events = await _wait_for_replies(
        req.room_id, TELEGRAM_BOT, req.since_ts_ms, timeout=2.0,
    )
    bodies = _bodies(events)
    ok = any("successfully logged in" in b.lower() for b in bodies)
    rooms_joined = await _accept_bridge_invites("telegram") if ok else 0
    return LoginReply(ok=ok, bot=TELEGRAM_BOT, room_id=req.room_id, messages=bodies, rooms_joined=rooms_joined)


# ---------------------------------------------------------------------------
# Bridge status / logout
# ---------------------------------------------------------------------------


_BRIDGES: dict[str, dict[str, str]] = {
    "discord": {"bot": DISCORD_BOT, "prefix": "!discord", "status_cmd": "ping", "ghost_prefix": "@discord_"},
    "slack": {"bot": SLACK_BOT, "prefix": "!slack", "status_cmd": "list-logins", "ghost_prefix": "@slack_"},
    "telegram": {"bot": TELEGRAM_BOT, "prefix": "!tg", "status_cmd": "ping", "ghost_prefix": "@telegram_"},
}


class BridgeStatus(BaseModel):
    ok: bool
    bridge: str
    connected: bool
    identity: Optional[str] = None
    remote_id: Optional[str] = None
    messages: list[str]


def _parse_status(bridge: str, bodies: list[str]) -> tuple[bool, Optional[str], Optional[str]]:
    """Best-effort extraction of (connected, identity, remote_id) from a `ping` reply."""
    text = "\n".join(bodies)
    lower = text.lower()

    # Common "not logged in" signatures across bridgev2 bridges.
    not_logged_in_markers = (
        "you're not logged in",
        "you are not logged in",
        "no logins",
        "not logged into",
        "no remote",
    )
    if any(m in lower for m in not_logged_in_markers):
        return False, None, None

    if bridge == "discord":
        # bridgev2 mautrix-discord ping → "You're logged in as @kouji1609 (`351588786385190923`)"
        m = re.search(r"logged in as\s+@?([^\s\(]+)\s*\(\s*`?(\d+)`?\s*\)", text, re.IGNORECASE)
        if m:
            return True, m.group(1).strip(), m.group(2).strip()
    elif bridge == "slack":
        # bridgev2 mautrix-slack list-logins:
        # "* `T0700DDQN3E-U08M8RNTE68` (Novita AI - kouji@novita.ai) - `CONNECTED`"
        m = re.search(
            r"\*\s*`([^`]+)`\s*\(([^)]+)\)\s*-\s*`?([A-Z_]+)`?",
            text,
        )
        if m and m.group(3).upper() == "CONNECTED":
            login_id = m.group(1).strip()
            remote_name = m.group(2).strip()
            return True, remote_name, login_id
        # Fallback: bridgev2 ping output if status_cmd ever switches.
        m = re.search(
            r"logged in as\s+@?([^\s\(]+)\s*\(\s*`?([^)`]+)`?\s*\)\s+in\s+([^(]+)\(\s*`?([^)`]+)`?\s*\)",
            text,
            re.IGNORECASE,
        )
        if m:
            user = m.group(1).strip()
            team = m.group(3).strip()
            return True, f"{user} · {team}", m.group(2).strip()
        m = re.search(r"logged in as\s+@?([^\s\(]+)", text, re.IGNORECASE)
        if m:
            return True, m.group(1).strip(), None
    elif bridge == "telegram":
        # mautrix-telegram ping → "You're logged in as @username (Telegram ID 12345)"
        m = re.search(r"logged in as\s+@?([^\s\(]+).*?(\d{5,})", text, re.IGNORECASE | re.DOTALL)
        if m:
            return True, m.group(1).strip(), m.group(2).strip()

    if "logged in" in lower and "not" not in lower.split("logged in")[0][-12:]:
        return True, None, None
    return False, None, None


@app.post("/status/{bridge}", response_model=BridgeStatus, dependencies=[Depends(require_secret)])
async def bridge_status(bridge: str) -> BridgeStatus:
    cfg = _BRIDGES.get(bridge)
    if not cfg:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"unknown bridge: {bridge}")
    bot = cfg["bot"]
    prefix = cfg["prefix"]

    room = await _ensure_dm(bot)
    await _ensure_management_room(room, prefix)
    # Slack's bridgev2 flow consumes the next message as JSON when mid-login.
    # Cancel any stuck flow before issuing ping so the prefix is honored.
    if bridge == "slack":
        await _send_text(room, f"{prefix} cancel")
        await asyncio.sleep(1.0)
    started = int(time.time() * 1000)
    await _send_text(room, f"{prefix} {cfg['status_cmd']}")

    def stop(events: list[dict[str, Any]]) -> bool:
        text = " ".join(_bodies(events)).lower()
        return any(s in text for s in (
            "logged in as",
            "not logged in",
            "no logins",
            "no remote",
            "you have no logins",
            "you don't have any logins",
            "unknown command",
        ))

    events = await _wait_for_replies(room, bot, started, timeout=DEFAULT_TIMEOUT, stop_predicate=stop)
    bodies = _bodies(events)
    connected, identity, remote_id = _parse_status(bridge, bodies)
    return BridgeStatus(
        ok=True,
        bridge=bridge,
        connected=connected,
        identity=identity,
        remote_id=remote_id,
        messages=bodies,
    )


class BridgeLogoutReply(BaseModel):
    ok: bool
    bridge: str
    messages: list[str]
    rooms_left: int = 0


async def _accept_bridge_invites(bridge: str, *, deadline_s: float = 8.0) -> int:
    """Eagerly join every pending invite from this bridge's namespace.

    Synapse's auto_accept_invites module also handles this, but bursty
    portal-room invites during a fresh login can hit rate limits and stall.
    We poll /sync briefly and join invites ourselves so portals appear in
    Element without manual intervention.
    """
    cfg = _BRIDGES[bridge]
    bot_mxid = cfg["bot"]
    ghost_prefix = cfg["ghost_prefix"]

    deadline = time.time() + deadline_s
    accepted = 0
    seen: set[str] = set()
    while time.time() < deadline:
        # Filter to keep the response small: only invite state per room.
        sync = await _matrix(
            "GET",
            "/_matrix/client/v3/sync"
            "?filter={\"room\":{\"timeline\":{\"limit\":0},\"state\":{\"limit\":0}}}"
            "&timeout=0",
        )
        if sync.status_code != 200:
            await asyncio.sleep(0.5)
            continue
        invites = (sync.json().get("rooms", {}) or {}).get("invite", {}) or {}
        new_invites = [r for r in invites.keys() if r not in seen]
        if not new_invites:
            await asyncio.sleep(0.7)
            continue
        for room_id in new_invites:
            seen.add(room_id)
            # Inspect invite_state to find inviter / member namespaces.
            ev = (invites[room_id].get("invite_state", {}) or {}).get("events", []) or []
            inviter = None
            has_namespace_member = False
            for e in ev:
                if e.get("type") == "m.room.member":
                    state_key = e.get("state_key", "")
                    if state_key.startswith(ghost_prefix) or state_key == bot_mxid:
                        has_namespace_member = True
                    if state_key == ADMIN_USER_ID:
                        inviter = e.get("sender")
            from_bridge = (
                inviter == bot_mxid
                or (inviter or "").startswith(ghost_prefix)
                or has_namespace_member
            )
            if not from_bridge:
                continue
            join = await _matrix(
                "POST",
                f"/_matrix/client/v3/rooms/{urllib.parse.quote(room_id)}/join",
            )
            if join.status_code == 200:
                accepted += 1
            elif join.status_code == 429:
                # Back off briefly; loop will retry on next sync tick.
                await asyncio.sleep(1.0)
                seen.discard(room_id)
        # Keep the loop running for the full deadline to catch trailing invites.
    return accepted


async def _evacuate_portals(bridge: str, dm_room: str) -> int:
    """Leave every room that contains a ghost from this bridge, except the DM.

    After a bridge `logout`, mautrix bridges leave portal rooms in place
    (the rooms still exist with admin as a member but no live bridge bot).
    To keep Element clean, admin leaves them all here. The management DM
    is preserved so we can still send commands later.
    """
    cfg = _BRIDGES[bridge]
    ghost_prefix = cfg["ghost_prefix"]
    bot_mxid = cfg["bot"]

    joined = await _matrix("GET", "/_matrix/client/v3/joined_rooms")
    if joined.status_code != 200:
        return 0
    room_ids = joined.json().get("joined_rooms", []) or []

    left = 0
    for room_id in room_ids:
        if room_id == dm_room:
            continue
        members = await _matrix(
            "GET",
            f"/_matrix/client/v3/rooms/{urllib.parse.quote(room_id)}/joined_members",
        )
        if members.status_code != 200:
            continue
        joined_map = members.json().get("joined", {}) or {}
        # Portal heuristic: room contains a ghost user from this bridge,
        # OR the bridge bot itself (covers DMs with the bot for old workflows).
        has_ghost = any(mxid.startswith(ghost_prefix) for mxid in joined_map)
        has_bot = bot_mxid in joined_map
        if not has_ghost and not has_bot:
            continue
        # Skip rooms that contain ghosts from a *different* bridge (shouldn't happen,
        # but defensive — don't leave a room because it shares one user namespace).
        leave = await _matrix(
            "POST",
            f"/_matrix/client/v3/rooms/{urllib.parse.quote(room_id)}/leave",
            json={"reason": f"pixdesk: cleaning up {bridge} portals after logout"},
        )
        if leave.status_code == 200:
            left += 1
            # Forget the room so it's removed from the room list entirely.
            await _matrix(
                "POST",
                f"/_matrix/client/v3/rooms/{urllib.parse.quote(room_id)}/forget",
            )
    return left


@app.post("/logout/{bridge}", response_model=BridgeLogoutReply, dependencies=[Depends(require_secret)])
async def bridge_logout(bridge: str) -> BridgeLogoutReply:
    cfg = _BRIDGES.get(bridge)
    if not cfg:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"unknown bridge: {bridge}")
    bot = cfg["bot"]
    prefix = cfg["prefix"]

    room = await _ensure_dm(bot)
    await _ensure_management_room(room, prefix)
    started = int(time.time() * 1000)
    await _send_text(room, f"{prefix} logout")

    def stop(events: list[dict[str, Any]]) -> bool:
        text = " ".join(_bodies(events)).lower()
        return any(s in text for s in (
            "logged out",
            "logout successful",
            "successfully logged out",
            "not logged in",
            "no logins",
            "removed login",
        ))

    events = await _wait_for_replies(room, bot, started, timeout=DEFAULT_TIMEOUT, stop_predicate=stop)
    bodies = _bodies(events)
    text = " ".join(bodies).lower()
    ok = any(s in text for s in ("logged out", "successful", "removed login", "not logged in"))

    rooms_left = 0
    try:
        rooms_left = await _evacuate_portals(bridge, room)
    except Exception as exc:
        log.warning("portal evacuation for %s failed: %s", bridge, exc)

    return BridgeLogoutReply(ok=ok, bridge=bridge, messages=bodies, rooms_left=rooms_left)


# ---------------------------------------------------------------------------
# Gmail OAuth (separate from bridge logins; talks to Google directly)
# ---------------------------------------------------------------------------

GMAIL_CLIENT_ID = os.environ.get("GMAIL_CLIENT_ID", "")
GMAIL_CLIENT_SECRET = os.environ.get("GMAIL_CLIENT_SECRET", "")
GMAIL_REDIRECT_URI = os.environ.get("GMAIL_REDIRECT_URI", "http://127.0.0.1:8765/login/gmail/callback")
GMAIL_TOKEN_DIR = os.environ.get("GMAIL_TOKEN_DIR", "/data/gmail")
GMAIL_SCOPES = "https://www.googleapis.com/auth/gmail.modify"
GMAIL_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GMAIL_TOKEN_URL = "https://oauth2.googleapis.com/token"
GMAIL_REVOKE_URL = "https://oauth2.googleapis.com/revoke"
GMAIL_PROFILE_URL = "https://gmail.googleapis.com/gmail/v1/users/me/profile"


def _gmail_token_path() -> str:
    return os.path.join(GMAIL_TOKEN_DIR, "tokens.json")


def _gmail_persist(payload: dict[str, Any]) -> None:
    """Write tokens to disk with mode 0600. Parent dir to 0700."""
    os.makedirs(GMAIL_TOKEN_DIR, mode=0o700, exist_ok=True)
    try:
        os.chmod(GMAIL_TOKEN_DIR, 0o700)
    except OSError:
        pass
    path = _gmail_token_path()
    tmp = path + ".tmp"
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as f:
        json.dump(payload, f)
    os.replace(tmp, path)


def _gmail_load() -> Optional[dict[str, Any]]:
    try:
        with open(_gmail_token_path()) as f:
            return json.load(f)
    except FileNotFoundError:
        return None
    except Exception as exc:
        log.warning("gmail token load failed: %s", exc)
        return None


class GmailStartReply(BaseModel):
    auth_url: str = Field(...)
    redirect_uri: str
    scopes: str


class GmailCallbackReq(BaseModel):
    code: str
    redirect_uri: Optional[str] = None


class GmailCallbackReply(BaseModel):
    ok: bool
    email: Optional[str] = None
    detail: Optional[str] = None


class GmailStatusReply(BaseModel):
    logged_in: bool
    email: Optional[str] = None
    captured_at: Optional[str] = None


@app.get("/login/gmail/start", response_model=GmailStartReply, dependencies=[Depends(require_secret)])
async def gmail_start(redirect_uri: Optional[str] = None) -> GmailStartReply:
    if not GMAIL_CLIENT_ID:
        raise HTTPException(status_code=503, detail="GMAIL_CLIENT_ID not configured")
    rd = redirect_uri or GMAIL_REDIRECT_URI
    params = {
        "client_id": GMAIL_CLIENT_ID,
        "redirect_uri": rd,
        "response_type": "code",
        "scope": GMAIL_SCOPES,
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
    }
    return GmailStartReply(
        auth_url=f"{GMAIL_AUTH_URL}?{urllib.parse.urlencode(params)}",
        redirect_uri=rd,
        scopes=GMAIL_SCOPES,
    )


@app.post("/login/gmail/callback", response_model=GmailCallbackReply, dependencies=[Depends(require_secret)])
async def gmail_callback(req: GmailCallbackReq) -> GmailCallbackReply:
    if not GMAIL_CLIENT_ID or not GMAIL_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="GMAIL_CLIENT_ID/SECRET not configured")
    rd = req.redirect_uri or GMAIL_REDIRECT_URI
    async with httpx.AsyncClient(timeout=20.0) as client:
        token_resp = await client.post(
            GMAIL_TOKEN_URL,
            data={
                "code": req.code,
                "client_id": GMAIL_CLIENT_ID,
                "client_secret": GMAIL_CLIENT_SECRET,
                "redirect_uri": rd,
                "grant_type": "authorization_code",
            },
        )
        if token_resp.status_code >= 400:
            return GmailCallbackReply(ok=False, detail=f"token exchange failed: {token_resp.text[:300]}")
        tok = token_resp.json()
        if "refresh_token" not in tok:
            return GmailCallbackReply(ok=False, detail="no refresh_token returned (need prompt=consent)")
        access = tok.get("access_token", "")
        prof_resp = await client.get(
            GMAIL_PROFILE_URL,
            headers={"Authorization": f"Bearer {access}"},
        )
        email = ""
        if prof_resp.status_code < 400:
            email = (prof_resp.json() or {}).get("emailAddress", "")
    payload = {
        "email": email,
        "refresh_token": tok["refresh_token"],
        "scopes": GMAIL_SCOPES,
        "captured_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    _gmail_persist(payload)
    return GmailCallbackReply(ok=True, email=email or None)


@app.get("/status/gmail", response_model=GmailStatusReply, dependencies=[Depends(require_secret)])
async def gmail_status() -> GmailStatusReply:
    data = _gmail_load()
    if not data or not data.get("refresh_token"):
        return GmailStatusReply(logged_in=False)
    return GmailStatusReply(
        logged_in=True,
        email=data.get("email") or None,
        captured_at=data.get("captured_at") or None,
    )


@app.post("/logout/gmail", response_model=GmailCallbackReply, dependencies=[Depends(require_secret)])
async def gmail_logout() -> GmailCallbackReply:
    data = _gmail_load()
    if not data or not data.get("refresh_token"):
        return GmailCallbackReply(ok=True, detail="not logged in")
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            await client.post(GMAIL_REVOKE_URL, params={"token": data["refresh_token"]})
        except Exception as exc:
            log.warning("gmail revoke failed: %s", exc)
    try:
        os.remove(_gmail_token_path())
    except FileNotFoundError:
        pass
    return GmailCallbackReply(ok=True, email=data.get("email") or None)
