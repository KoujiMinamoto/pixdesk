#!/usr/bin/env python3
import json
import os
import re
import subprocess
import time
import urllib.parse
import urllib.request

BASE_URL = os.environ.get("MATRIX_BASE_URL", "http://127.0.0.1:8008")
PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL", "https://biol-volleyball-stylus-arc.trycloudflare.com")
ROOM_ID = os.environ.get("DISCORD_BRIDGE_ROOM", "!tamUeVfRRugKCTyYto:192.168.72.185")
ADMIN_FILE = os.environ.get("MATRIX_ADMIN_FILE", "/root/beeper-matrix-admin.txt")
STATE_FILE = os.environ.get("DISCORD_QR_STATE", "/opt/beeper-matrix/data/agent/discord-qr-helper.json")
STATIC_DIR = os.environ.get("DISCORD_QR_STATIC_DIR", "/opt/beeper-matrix/caddy/static")
POLL_SECONDS = int(os.environ.get("DISCORD_QR_POLL_SECONDS", "3"))

LINK_RE = re.compile(r"https://discordapp\.com/ra/[A-Za-z0-9_-]+")


def request(method, path, data=None, token=None, headers=None, raw=None, timeout=30):
    body = raw if raw is not None else (None if data is None else json.dumps(data).encode())
    req_headers = headers or {"Content-Type": "application/json"}
    if token:
        req_headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(BASE_URL + path, data=body, headers=req_headers, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        payload = resp.read()
        ctype = resp.headers.get("Content-Type", "")
        if "json" in ctype:
            return json.loads(payload.decode() or "{}")
        return payload


def admin_password():
    with open(ADMIN_FILE) as fh:
        for line in fh:
            if line.startswith("admin_password="):
                return line.split("=", 1)[1].strip()
    raise RuntimeError(f"admin_password not found in {ADMIN_FILE}")


def login():
    response = request(
        "POST",
        "/_matrix/client/v3/login",
        {
            "type": "m.login.password",
            "identifier": {"type": "m.id.user", "user": "admin"},
            "password": admin_password(),
        },
    )
    return response["access_token"]


def load_state():
    try:
        with open(STATE_FILE) as fh:
            state = json.load(fh)
    except FileNotFoundError:
        return {"handled": [], "last_event_id": None}
    if "handled" not in state:
        state["handled"] = []
    return state


def save_state(state):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    tmp = STATE_FILE + ".tmp"
    with open(tmp, "w") as fh:
        json.dump(state, fh)
    os.replace(tmp, STATE_FILE)


def send_notice(token, text):
    room = urllib.parse.quote(ROOM_ID, safe="")
    txn = f"discord-qr-helper-notice-{int(time.time() * 1000)}"
    request(
        "PUT",
        f"/_matrix/client/v3/rooms/{room}/send/m.room.message/{txn}",
        {"msgtype": "m.notice", "body": text},
        token=token,
    )


def send_qr(token, link):
    png = "/tmp/discord-login-qr.png"
    subprocess.run(["qrencode", "-o", png, "-s", "12", "-m", "2", link], check=True)
    with open(png, "rb") as fh:
        data = fh.read()

    os.makedirs(STATIC_DIR, exist_ok=True)
    filename = f"discord-login-qr-{int(time.time())}.png"
    latest = os.path.join(STATIC_DIR, "discord-login-qr-latest.png")
    static_path = os.path.join(STATIC_DIR, filename)
    with open(static_path, "wb") as fh:
        fh.write(data)
    with open(latest, "wb") as fh:
        fh.write(data)
    static_url = f"{PUBLIC_BASE_URL.rstrip('/')}/static/{filename}"
    latest_url = f"{PUBLIC_BASE_URL.rstrip('/')}/static/discord-login-qr-latest.png"

    upload = request(
        "POST",
        "/_matrix/media/v3/upload?filename=discord-login-qr.png",
        token=token,
        headers={"Content-Type": "image/png"},
        raw=data,
    )
    room = urllib.parse.quote(ROOM_ID, safe="")
    txn = f"discord-qr-helper-image-{int(time.time() * 1000)}"
    request(
        "PUT",
        f"/_matrix/client/v3/rooms/{room}/send/m.room.message/{txn}",
        {
            "msgtype": "m.image",
            "body": "discord-login-qr.png",
            "url": upload["content_uri"],
            "info": {"mimetype": "image/png", "size": len(data)},
        },
        token=token,
    )
    send_notice(
        token,
        "Discord 登录二维码图片链接：\n"
        f"{static_url}\n\n"
        "如果 Element 提示图片无法显示，直接打开上面的 HTTPS 链接，用手机 Discord 扫码。"
        f"\n固定最新二维码链接：{latest_url}",
    )


def recent_messages(token):
    room = urllib.parse.quote(ROOM_ID, safe="")
    return request("GET", f"/_matrix/client/v3/rooms/{room}/messages?dir=b&limit=25", token=token)


def run():
    token = login()
    state = load_state()
    handled = set(state.get("handled", []))
    send_notice(token, "Discord QR helper started. Send `login-qr`; I will convert the login link into a QR image.")

    while True:
        try:
            messages = recent_messages(token)
            changed = False
            for event in reversed(messages.get("chunk", [])):
                event_id = event.get("event_id")
                if not event_id or event_id in handled:
                    continue
                content = event.get("content") or {}
                body = content.get("body") or ""
                match = LINK_RE.search(body)
                if not match:
                    continue
                send_qr(token, match.group(0))
                handled.add(event_id)
                changed = True
            if changed:
                state["handled"] = list(handled)[-200:]
                save_state(state)
        except urllib.error.HTTPError as err:
            if err.code in (401, 403):
                token = login()
            else:
                print(f"HTTP error: {err}", flush=True)
        except Exception as err:
            print(f"helper error: {err}", flush=True)
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    run()
