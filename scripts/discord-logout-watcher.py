#!/usr/bin/env python3
"""Watch the mautrix-discord container logs and post a Matrix notice the moment
the Discord session gets logged out (invalid/expired user token).

Mirrors discord-qr-helper.py: logs into Matrix with the admin password and
sends an m.notice into the bridge management room. Runs as a systemd unit that
follows `docker logs -f`, so an alert lands in Element within seconds of a
logout instead of being noticed days later.
"""
import json
import os
import re
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request

BASE_URL = os.environ.get("MATRIX_BASE_URL", "http://127.0.0.1:8008")
ROOM_ID = os.environ.get("ALERT_ROOM", "!tamUeVfRRugKCTyYto:192.168.72.185")
ADMIN_FILE = os.environ.get("MATRIX_ADMIN_FILE", "/root/beeper-matrix-admin.txt")
CONTAINER = os.environ.get("DISCORD_CONTAINER", "beeper-matrix-mautrix-discord-1")
# Re-alert at most once per this window, so a reconnect storm = one ping.
DEBOUNCE_SECONDS = int(os.environ.get("ALERT_DEBOUNCE_SECONDS", "1800"))
# Cache the access token so a service restart reuses it instead of hitting
# /login again — repeated logins trip Synapse's M_LIMIT_EXCEEDED rate limit.
TOKEN_CACHE = os.environ.get("TOKEN_CACHE", "/opt/beeper-matrix/data/agent/discord-logout-watcher.token")


# Signatures that mean "the session is dead and won't recover on its own".
LOGOUT_RE = re.compile(
    r"Got logged out from Discord|"
    r"close 4004|"          # Authentication failed
    r"emit invalid auth event|"
    r"User logged out",
)


def request(method, path, data=None, token=None, timeout=30):
    body = None if data is None else json.dumps(data).encode()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(BASE_URL + path, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode() or "{}")


def admin_password():
    with open(ADMIN_FILE) as fh:
        for line in fh:
            if line.startswith("admin_password="):
                return line.split("=", 1)[1].strip()
    raise RuntimeError(f"admin_password not found in {ADMIN_FILE}")


def login():
    resp = request("POST", "/_matrix/client/v3/login", {
        "type": "m.login.password",
        "identifier": {"type": "m.id.user", "user": "admin"},
        "password": admin_password(),
    })
    return resp["access_token"]


def whoami(token):
    request("GET", "/_matrix/client/v3/account/whoami", token=token)


def get_token():
    """Resolve an admin token without hammering /login.

    Priority: (1) ADMIN_ACCESS_TOKEN env (the long-lived token already in
    .env that auth-relay uses) — preferred, never touches /login; (2) a
    previously cached token that still validates; (3) password login with
    backoff, as a last resort. Re-logging-in on every restart trips Synapse's
    M_LIMIT_EXCEEDED limiter, so we avoid /login whenever possible."""
    env_token = os.environ.get("ADMIN_ACCESS_TOKEN", "").strip()
    if env_token:
        return env_token

    try:
        with open(TOKEN_CACHE) as fh:
            cached = fh.read().strip()
        if cached:
            whoami(cached)  # raises if expired/invalid
            return cached
    except FileNotFoundError:
        pass
    except urllib.error.HTTPError:
        pass  # cached token no longer valid → fall through to fresh login

    delay = 5
    while True:
        try:
            token = login()
            break
        except urllib.error.HTTPError as err:
            if err.code in (429, 403):
                try:
                    body = json.loads(err.read().decode())
                    wait = body.get("retry_after_ms", delay * 1000) / 1000 + 1
                except Exception:
                    wait = delay
                print(f"login rate-limited, retrying in {wait:.0f}s", flush=True)
                time.sleep(wait)
                delay = min(delay * 2, 300)
                continue
            raise
    try:
        os.makedirs(os.path.dirname(TOKEN_CACHE), exist_ok=True)
        with open(TOKEN_CACHE, "w") as fh:
            fh.write(token)
        os.chmod(TOKEN_CACHE, 0o600)
    except Exception as err:  # noqa: BLE001 — caching is best-effort
        print(f"could not cache token: {err}", flush=True)
    return token



def send_notice(token, text):
    room = urllib.parse.quote(ROOM_ID, safe="")
    txn = f"discord-logout-watcher-{int(time.time() * 1000)}"
    request("PUT", f"/_matrix/client/v3/rooms/{room}/send/m.room.message/{txn}",
            {"msgtype": "m.notice", "body": text}, token=token)


def alert(token, line):
    msg = (
        "⚠️ Discord 桥已掉线（token 失效 / 会话被注销）。\n"
        "新消息不再进入数据库和 Element，直到重新登录。\n"
        "恢复：用浏览器抓 Discord token，POST 到 auth-relay /login/discord，"
        "或在本房间给 @discordbot 发 login-qr 扫码。\n"
        f"日志信号：{line.strip()[:300]}"
    )
    try:
        send_notice(token, msg)
        print(f"alert sent: {line.strip()[:120]}", flush=True)
    except Exception as err:  # noqa: BLE001
        print(f"failed to send alert: {err}", flush=True)


def follow_logs():
    """Yield new log lines from the container, restarting the follow if the
    docker logs process dies (container restart, etc.)."""
    while True:
        proc = subprocess.Popen(
            ["docker", "logs", "-f", "--since", "0s", CONTAINER],
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1,
        )
        try:
            for line in proc.stdout:
                yield line
        finally:
            proc.terminate()
        print("docker logs -f ended; restarting in 5s", flush=True)
        time.sleep(5)


def main():
    token = get_token()
    last_alert = 0.0
    print(f"watching {CONTAINER}; alerts -> {ROOM_ID}", flush=True)
    for line in follow_logs():
        if not LOGOUT_RE.search(line):
            continue
        now = time.time()
        if now - last_alert < DEBOUNCE_SECONDS:
            continue
        last_alert = now
        try:
            alert(token, line)
        except urllib.error.HTTPError as err:  # token expired
            if err.code in (401, 403):
                token = get_token()
                alert(token, line)


if __name__ == "__main__":
    main()
