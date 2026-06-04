#!/usr/bin/env python3
"""Install the PixDesk ticket widget into every bridged portal room.

Walks the rooms `@admin` is currently joined to, classifies each as a
bridge portal by looking for slack_/discord_/telegram_ ghosts in the
member list, and posts the widget state event idempotently. Writes both
`m.widget` and `im.vector.modular.widgets` for Element compatibility.

If the admin user lacks the power level to send state events in a room,
attempts the `make_room_admin` Synapse admin endpoint as a fallback.
Rooms where promotion fails (e.g. highest power level belongs to a
non-local user / bridge ghost) are reported at the end so the operator
can drop a manual `/addwidget …` in Element.

Env:
  MATRIX_HOMESERVER       default http://192.168.72.185:8008
  MATRIX_ADMIN_USER_ID    e.g. @admin:192.168.72.185
  MATRIX_ADMIN_ACCESS_TOKEN
  WIDGET_PUBLIC_BASE_URL  default http://192.168.72.185:8767
"""
import json
import os
import sys
import urllib.parse
import urllib.request
import urllib.error
from typing import Any, Optional

HOMESERVER = os.environ.get("MATRIX_HOMESERVER", "http://192.168.72.185:8008")
ADMIN_USER_ID = os.environ["MATRIX_ADMIN_USER_ID"]
ADMIN_TOKEN = os.environ["MATRIX_ADMIN_ACCESS_TOKEN"]
WIDGET_BASE = os.environ.get("WIDGET_PUBLIC_BASE_URL", "http://192.168.72.185:8767")
WIDGET_STATE_KEY = "pixdesk-tickets"
BRIDGE_PUPPET_PREFIXES = ("@slack_", "@discord_", "@telegram_")
BRIDGE_BOT_LOCALPARTS = {"slackbot", "discordbot", "telegrambot"}


def matrix(method: str, path: str, body: Optional[dict] = None) -> tuple[int, Any]:
    url = HOMESERVER + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {ADMIN_TOKEN}")
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            text = resp.read().decode("utf-8") or "{}"
            return resp.status, json.loads(text) if text.strip() else {}
    except urllib.error.HTTPError as e:
        text = (e.read() or b"").decode("utf-8")
        try:
            return e.code, json.loads(text) if text else {}
        except Exception:
            return e.code, {"errcode": "NON_JSON", "error": text}
    except Exception as e:
        return 0, {"errcode": "NETWORK", "error": str(e)}


def joined_rooms() -> list[str]:
    code, body = matrix("GET", "/_matrix/client/v3/joined_rooms")
    if code != 200:
        print(f"joined_rooms failed: {code} {body}", file=sys.stderr)
        sys.exit(1)
    return body.get("joined_rooms", []) or []


def joined_members(room_id: str) -> list[str]:
    code, body = matrix(
        "GET",
        f"/_matrix/client/v3/rooms/{urllib.parse.quote(room_id)}/joined_members",
    )
    if code != 200:
        return []
    return list((body.get("joined", {}) or {}).keys())


def is_bridge_portal(members: list[str]) -> bool:
    for mxid in members:
        local = mxid.split(":")[0].lstrip("@")
        if local in BRIDGE_BOT_LOCALPARTS:
            return True
        if any(mxid.startswith(p) for p in BRIDGE_PUPPET_PREFIXES):
            return True
    return False


def get_state(room_id: str, ev_type: str, state_key: str) -> Optional[dict]:
    code, body = matrix(
        "GET",
        f"/_matrix/client/v3/rooms/{urllib.parse.quote(room_id)}/state/"
        f"{urllib.parse.quote(ev_type)}/{urllib.parse.quote(state_key)}",
    )
    return body if code == 200 else None


def put_state(room_id: str, ev_type: str, state_key: str, content: dict) -> tuple[int, Any]:
    return matrix(
        "PUT",
        f"/_matrix/client/v3/rooms/{urllib.parse.quote(room_id)}/state/"
        f"{urllib.parse.quote(ev_type)}/{urllib.parse.quote(state_key)}",
        body=content,
    )


def make_room_admin(room_id: str, user_id: str) -> tuple[int, Any]:
    return matrix(
        "POST",
        f"/_synapse/admin/v1/rooms/{urllib.parse.quote(room_id)}/make_room_admin",
        body={"user_id": user_id},
    )


def power_level_ok(room_id: str) -> bool:
    pl = get_state(room_id, "m.room.power_levels", "")
    if not pl:
        return False
    needed = pl.get("state_default", 50)
    users = pl.get("users", {}) or {}
    have = users.get(ADMIN_USER_ID, pl.get("users_default", 0))
    return have >= needed


def widget_content() -> dict:
    return {
        "type": "m.custom",
        "name": "Tickets",
        "url": (
            f"{WIDGET_BASE}/widget/"
            "?roomId=$matrix_room_id"
            "&widgetId=$matrix_widget_id"
            "&userId=$matrix_user_id"
            "&theme=$matrix_theme"
        ),
        "data": {},
    }


def install_in_room(room_id: str, content: dict) -> str:
    """Returns one of: 'skipped', 'installed', 'updated', 'manual', 'failed'."""
    members = joined_members(room_id)
    if not is_bridge_portal(members):
        return "skipped"
    existing = get_state(room_id, "im.vector.modular.widgets", WIDGET_STATE_KEY)
    if existing == content:
        return "skipped"
    action = "updated" if existing else "installed"
    if not power_level_ok(room_id):
        promote_code, promote_body = make_room_admin(room_id, ADMIN_USER_ID)
        if promote_code != 200:
            print(
                f"  [MANUAL] {room_id}: cannot promote ({promote_code} "
                f"{promote_body.get('errcode', '')}); run /addwidget manually",
                file=sys.stderr,
            )
            return "manual"
    for ev_type in ("m.widget", "im.vector.modular.widgets"):
        code, body = put_state(room_id, ev_type, WIDGET_STATE_KEY, content)
        if code != 200:
            print(
                f"  [FAIL] {room_id} {ev_type}: {code} "
                f"{body.get('errcode', '')} {body.get('error', '')}",
                file=sys.stderr,
            )
            return "failed"
    return action


def main() -> int:
    rooms = joined_rooms()
    print(f"scanning {len(rooms)} joined room(s)…")
    content = widget_content()
    counts = {"skipped": 0, "installed": 0, "updated": 0, "manual": 0, "failed": 0}
    failures: list[str] = []
    for room_id in rooms:
        result = install_in_room(room_id, content)
        counts[result] = counts.get(result, 0) + 1
        if result in ("manual", "failed"):
            failures.append(room_id)
        if result in ("installed", "updated"):
            print(f"  [{result.upper()}] {room_id}")
    print(
        f"\nDONE. installed={counts['installed']} updated={counts['updated']} "
        f"already={counts['skipped']} manual={counts['manual']} failed={counts['failed']}"
    )
    if failures:
        print("\nManual install needed for:")
        for r in failures:
            print(f"  {r}")
        print(
            "\nIn each of those rooms, run in Element:\n"
            f"  /addwidget {WIDGET_BASE}/widget/?roomId=$matrix_room_id"
            "&widgetId=$matrix_widget_id&theme=$matrix_theme"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())


