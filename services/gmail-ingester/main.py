#!/usr/bin/env python3
"""PixDesk Gmail Ingester — pulls messages from Gmail API into agent.*.

Authenticates via the refresh_token captured by auth-relay
(/data/gmail/tokens.json). On cold start, backfills the most recent N
messages. After that, polls users.history.list with the saved historyId
to pick up new messages incrementally.

Output rows match the listener's agent.messages shape:
  platform     = 'gmail'
  workspace_id = the logged-in email address
  channel_id   = 'INBOX'
  thread_id    = Gmail thread_id
  message_id   = Gmail message_id (internal id, not RFC822 Message-ID)
"""

import base64
import email
import email.utils
import html
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
import urllib.error

import httpx
import psycopg2
import psycopg2.extras

DATABASE_URL = os.environ["DATABASE_URL"]
TOKEN_DIR = os.environ.get("GMAIL_TOKEN_DIR", "/data/gmail")
STATE_DIR = os.environ.get("GMAIL_STATE_DIR", "/data/gmail-ingester")
CLIENT_ID = os.environ.get("GMAIL_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("GMAIL_CLIENT_SECRET", "")
POLL_SECONDS = int(os.environ.get("POLL_SECONDS", "30"))
COLD_START_LIMIT = int(os.environ.get("COLD_START_LIMIT", "200"))
COLD_START_QUERY = os.environ.get("COLD_START_QUERY", "newer_than:30d")
CONVERSATION_GAP_SECONDS = int(os.environ.get("CONVERSATION_GAP_SECONDS", "1800"))

GMAIL_TOKEN_URL = "https://oauth2.googleapis.com/token"
GMAIL_API = "https://gmail.googleapis.com/gmail/v1"


def log(msg, **fields):
    parts = [msg] + [f"{k}={v}" for k, v in fields.items()]
    print(" ".join(parts), flush=True)


def err(msg, **fields):
    parts = [msg] + [f"{k}={v}" for k, v in fields.items()]
    print(" ".join(parts), file=sys.stderr, flush=True)


def load_tokens():
    path = os.path.join(TOKEN_DIR, "tokens.json")
    with open(path) as f:
        return json.load(f)


def load_state():
    path = os.path.join(STATE_DIR, "state.json")
    try:
        with open(path) as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def save_state(state):
    os.makedirs(STATE_DIR, exist_ok=True)
    path = os.path.join(STATE_DIR, "state.json")
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(state, f)
    os.replace(tmp, path)


class GmailClient:
    """Thin wrapper holding a refresh_token and rotating access_tokens."""

    def __init__(self, refresh_token, client_id, client_secret):
        self.refresh_token = refresh_token
        self.client_id = client_id
        self.client_secret = client_secret
        self.access_token = ""
        self.expires_at = 0.0
        self._http = httpx.Client(timeout=30.0)

    def close(self):
        self._http.close()

    def _refresh(self):
        resp = self._http.post(
            GMAIL_TOKEN_URL,
            data={
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "refresh_token": self.refresh_token,
                "grant_type": "refresh_token",
            },
        )
        resp.raise_for_status()
        tok = resp.json()
        self.access_token = tok["access_token"]
        self.expires_at = time.time() + max(60, int(tok.get("expires_in", 3600)) - 60)

    def get(self, path, params=None, retry=True):
        if not self.access_token or time.time() >= self.expires_at:
            self._refresh()
        url = GMAIL_API + path
        resp = self._http.get(
            url,
            params=params,
            headers={"Authorization": f"Bearer {self.access_token}"},
        )
        if resp.status_code == 401 and retry:
            self._refresh()
            return self.get(path, params, retry=False)
        resp.raise_for_status()
        return resp.json()


def parse_addr(header_val):
    """Returns (display_name, email_address) from a From/Reply-To header."""
    if not header_val:
        return ("", "")
    name, addr = email.utils.parseaddr(header_val)
    return (name or "", addr or "")


_HTML_TAG = re.compile(r"<[^>]+>")
_WS = re.compile(r"\n{3,}")


def html_to_text(s):
    if not s:
        return ""
    s = re.sub(r"<br\s*/?>", "\n", s, flags=re.I)
    s = re.sub(r"</p>", "\n\n", s, flags=re.I)
    s = _HTML_TAG.sub("", s)
    s = html.unescape(s)
    s = _WS.sub("\n\n", s)
    return s.strip()


def b64url_decode(data):
    data = data.replace("-", "+").replace("_", "/")
    pad = (-len(data)) % 4
    return base64.b64decode(data + "=" * pad)


def extract_body(payload):
    """Walk a Gmail payload tree and return the best body text.
    Prefers text/plain; falls back to stripped text/html; never both.
    """
    plain = []
    html_bodies = []

    def walk(part):
        mime = part.get("mimeType", "")
        body = part.get("body") or {}
        data = body.get("data")
        if data and mime.startswith("text/"):
            try:
                decoded = b64url_decode(data).decode("utf-8", errors="replace")
            except Exception:
                decoded = ""
            if mime == "text/plain":
                plain.append(decoded)
            elif mime == "text/html":
                html_bodies.append(decoded)
        for sub in part.get("parts") or []:
            walk(sub)

    walk(payload)
    if plain:
        return "\n".join(plain).strip()
    if html_bodies:
        return html_to_text("\n".join(html_bodies))
    return ""


def parse_message(msg, workspace_email):
    """Convert a Gmail API message resource into our row shape."""
    payload = msg.get("payload") or {}
    headers = {(h["name"] or "").lower(): h["value"] for h in (payload.get("headers") or [])}
    sender_name, sender_addr = parse_addr(headers.get("from", ""))
    subject = headers.get("subject", "")
    text = extract_body(payload)
    if subject and text:
        text = f"Subject: {subject}\n\n{text}"
    elif subject:
        text = f"Subject: {subject}"
    ts = int(msg.get("internalDate", 0)) / 1000.0
    return {
        "workspace_id": workspace_email,
        "channel_id": "INBOX",
        "message_id": msg["id"],
        "thread_id": msg.get("threadId") or None,
        "sender_id": sender_addr,
        "sender_name": sender_name or sender_addr,
        "text": text,
        "ts": ts,
    }


def find_or_create_conversation(db, info):
    with db.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """
            select id, last_activity_at
            from agent.conversations
            where platform = 'gmail' and workspace_id = %s and channel_id = %s
              and coalesce(thread_id, '') = coalesce(%s, '')
              and status != 'resolved'
            order by last_activity_at desc limit 1
            """,
            (info["workspace_id"], info["channel_id"], info["thread_id"]),
        )
        row = cur.fetchone()
        if row:
            cur.execute(
                "update agent.conversations set last_activity_at = now() where id = %s",
                (row["id"],),
            )
            return str(row["id"])
        cur.execute(
            """
            insert into agent.conversations
              (platform, workspace_id, channel_id, thread_id, matrix_room_id)
            values ('gmail', %s, %s, %s, NULL)
            returning id
            """,
            (info["workspace_id"], info["channel_id"], info["thread_id"]),
        )
        return str(cur.fetchone()["id"])


def store_message(db, info, raw_msg, conversation_id):
    ts_iso = time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime(info["ts"]))
    with db.cursor() as cur:
        cur.execute(
            """
            insert into agent.messages
              (platform, workspace_id, channel_id, message_id, thread_id,
               sender_id, sender_name, text, ts, raw,
               status, conversation_id)
            values ('gmail', %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb,
                    'new', %s)
            on conflict (platform, workspace_id, channel_id, message_id) do update set
              sender_name = coalesce(nullif(excluded.sender_name, ''), agent.messages.sender_name),
              text = excluded.text
            returning xmax = 0 as is_insert
            """,
            (
                info["workspace_id"], info["channel_id"], info["message_id"],
                info["thread_id"], info["sender_id"], info["sender_name"],
                info["text"], ts_iso, json.dumps(raw_msg),
                conversation_id,
            ),
        )
        result = cur.fetchone()
        return bool(result and result[0])


def fetch_and_store(client, db, workspace_email, message_id):
    try:
        msg = client.get(f"/users/me/messages/{message_id}", params={"format": "full"})
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            err("message gone", id=message_id)
            return False
        raise
    info = parse_message(msg, workspace_email)
    convo = find_or_create_conversation(db, info)
    return store_message(db, info, msg, convo)


def cold_start_backfill(client, db, workspace_email):
    """Pull recent messages on first run; persist current historyId."""
    log("cold start backfill", query=COLD_START_QUERY, limit=COLD_START_LIMIT)
    page_token = None
    fetched = 0
    while fetched < COLD_START_LIMIT:
        params = {"maxResults": min(100, COLD_START_LIMIT - fetched), "q": COLD_START_QUERY}
        if page_token:
            params["pageToken"] = page_token
        resp = client.get("/users/me/messages", params=params)
        for m in resp.get("messages") or []:
            try:
                if fetch_and_store(client, db, workspace_email, m["id"]):
                    fetched += 1
            except Exception as e:
                err("fetch failed", id=m.get("id"), error=str(e))
        page_token = resp.get("nextPageToken")
        if not page_token:
            break
    profile = client.get("/users/me/profile")
    history_id = str(profile.get("historyId", ""))
    log("cold start done", fetched=fetched, history_id=history_id)
    return history_id


def incremental_sync(client, db, workspace_email, start_history_id):
    """Apply history.list deltas. Returns the new historyId to persist."""
    page_token = None
    new_msg_ids = set()
    last_history = start_history_id
    while True:
        params = {
            "startHistoryId": start_history_id,
            "historyTypes": "messageAdded",
        }
        if page_token:
            params["pageToken"] = page_token
        try:
            resp = client.get("/users/me/history", params=params)
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                err("historyId stale, resetting via profile", start=start_history_id)
                profile = client.get("/users/me/profile")
                return str(profile.get("historyId", start_history_id))
            raise
        last_history = str(resp.get("historyId", last_history))
        for h in resp.get("history") or []:
            for added in h.get("messagesAdded") or []:
                m = added.get("message") or {}
                if m.get("id"):
                    new_msg_ids.add(m["id"])
        page_token = resp.get("nextPageToken")
        if not page_token:
            break
    for mid in new_msg_ids:
        try:
            fetch_and_store(client, db, workspace_email, mid)
        except Exception as e:
            err("incremental fetch failed", id=mid, error=str(e))
    if new_msg_ids:
        log("incremental tick", added=len(new_msg_ids), history_id=last_history)
    return last_history


def get_pg():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    return conn


def main():
    if not CLIENT_ID or not CLIENT_SECRET:
        err("GMAIL_CLIENT_ID/SECRET not configured; exiting")
        sys.exit(1)
    while True:
        try:
            tokens = load_tokens()
        except FileNotFoundError:
            log("no Gmail token yet; sleeping", path=os.path.join(TOKEN_DIR, "tokens.json"))
            time.sleep(POLL_SECONDS)
            continue
        break
    workspace_email = tokens.get("email") or ""
    if not workspace_email:
        err("no email on stored token; cannot proceed")
        sys.exit(1)
    client = GmailClient(tokens["refresh_token"], CLIENT_ID, CLIENT_SECRET)
    pg = get_pg()
    state = load_state()
    history_id = state.get("history_id", "")
    log("ingester started", email=workspace_email, history_id=history_id or "(cold)")
    if not history_id:
        history_id = cold_start_backfill(client, pg, workspace_email)
        save_state({"history_id": history_id})
    while True:
        try:
            new_id = incremental_sync(client, pg, workspace_email, history_id)
            if new_id and new_id != history_id:
                history_id = new_id
                save_state({"history_id": history_id})
        except Exception as e:
            err("sync error", error=str(e))
            try:
                pg.close()
            except Exception:
                pass
            time.sleep(5)
            pg = get_pg()
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
