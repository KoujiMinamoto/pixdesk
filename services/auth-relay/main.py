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
    started = int(time.time() * 1000)
    await _send_text(room, f"login-token user {req.token}")

    def stop(events: list[dict[str, Any]]) -> bool:
        text = " ".join(_bodies(events)).lower()
        return any(s in text for s in ("successfully logged in", "invalid token", "error logging in", "login failed"))

    events = await _wait_for_replies(room, DISCORD_BOT, started, timeout=DEFAULT_TIMEOUT, stop_predicate=stop)
    bodies = _bodies(events)
    ok = any("successfully logged in" in b.lower() for b in bodies)
    return LoginReply(ok=ok, bot=DISCORD_BOT, room_id=room, messages=bodies)


@app.post("/login/slack", response_model=LoginReply, dependencies=[Depends(require_secret)])
async def login_slack(req: SlackLogin) -> LoginReply:
    room = await _ensure_dm(SLACK_BOT)
    started = int(time.time() * 1000)
    # bridgev2 flow: `login token`, then JSON object with auth_token + cookie_token.
    await _send_text(room, "login token")
    await asyncio.sleep(2.0)
    payload = json.dumps({"auth_token": req.auth_token, "cookie_token": req.cookie_token})
    await _send_text(room, payload)

    def stop(events: list[dict[str, Any]]) -> bool:
        text = " ".join(_bodies(events)).lower()
        return any(s in text for s in ("successfully logged in", "login failed", "invalid value", "missing some keys"))

    events = await _wait_for_replies(room, SLACK_BOT, started, timeout=DEFAULT_TIMEOUT, stop_predicate=stop)
    bodies = _bodies(events)
    ok = any("successfully logged in" in b.lower() for b in bodies)
    return LoginReply(ok=ok, bot=SLACK_BOT, room_id=room, messages=bodies)


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
    return LoginReply(ok=ok, bot=TELEGRAM_BOT, room_id=req.room_id, messages=bodies)
