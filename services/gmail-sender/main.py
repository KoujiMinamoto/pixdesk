#!/usr/bin/env python3
"""PixDesk Gmail Sender — sends agent replies via Gmail API.

Polls agent.replies for rows where status='pending' and platform='gmail'.
For each row, looks up the original message to recover its RFC822
Message-ID and Subject, constructs an RFC 5322 reply, and posts it via
users.messages.send. On success, marks the row sent with the resulting
Gmail message_id stored in matrix_event_id (the column is repurposed for
non-Matrix platforms).
"""

import base64
import email.message
import email.utils
import json
import os
import sys
import time

import httpx
import psycopg2
import psycopg2.extras

DATABASE_URL = os.environ["DATABASE_URL"]
TOKEN_DIR = os.environ.get("GMAIL_TOKEN_DIR", "/data/gmail")
CLIENT_ID = os.environ.get("GMAIL_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("GMAIL_CLIENT_SECRET", "")
POLL_SECONDS = int(os.environ.get("POLL_SECONDS", "10"))

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


class GmailClient:
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

    def _auth_headers(self):
        if not self.access_token or time.time() >= self.expires_at:
            self._refresh()
        return {"Authorization": f"Bearer {self.access_token}"}

    def get(self, path, params=None, retry=True):
        resp = self._http.get(GMAIL_API + path, params=params, headers=self._auth_headers())
        if resp.status_code == 401 and retry:
            self._refresh()
            return self.get(path, params, retry=False)
        resp.raise_for_status()
        return resp.json()

    def post(self, path, payload, retry=True):
        headers = self._auth_headers()
        headers["Content-Type"] = "application/json"
        resp = self._http.post(GMAIL_API + path, json=payload, headers=headers)
        if resp.status_code == 401 and retry:
            self._refresh()
            return self.post(path, payload, retry=False)
        resp.raise_for_status()
        return resp.json()


def fetch_thread_context(client, message_id):
    """Look up the message we're replying to. Returns dict with
    rfc_message_id, subject, references, thread_id, from_email.
    """
    msg = client.get(f"/users/me/messages/{message_id}", params={"format": "metadata",
        "metadataHeaders": ["Message-ID", "References", "Subject", "From", "Reply-To"]})
    headers = {(h["name"] or "").lower(): h["value"] for h in (msg.get("payload", {}).get("headers") or [])}
    rfc_id = headers.get("message-id", "").strip()
    subject = headers.get("subject", "")
    refs = headers.get("references", "").strip()
    if rfc_id:
        refs = (refs + " " + rfc_id).strip() if refs else rfc_id
    reply_to = headers.get("reply-to") or headers.get("from", "")
    return {
        "rfc_message_id": rfc_id,
        "subject": subject,
        "references": refs,
        "thread_id": msg.get("threadId"),
        "to": reply_to,
    }


def build_mime(from_email, to_addr, subject, body, in_reply_to, references):
    msg = email.message.EmailMessage()
    msg["From"] = from_email
    msg["To"] = to_addr
    if not subject.lower().startswith("re:"):
        subject = f"Re: {subject}" if subject else "Re:"
    msg["Subject"] = subject
    msg["Date"] = email.utils.formatdate(localtime=False)
    msg["Message-ID"] = email.utils.make_msgid(domain=from_email.split("@", 1)[-1] or "localhost")
    if in_reply_to:
        msg["In-Reply-To"] = in_reply_to
    if references:
        msg["References"] = references
    msg.set_content(body)
    return base64.urlsafe_b64encode(msg.as_bytes()).decode("ascii").rstrip("=")


def claim_pending(db):
    """Atomically claim one pending row. Returns dict or None."""
    with db.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """
            update agent.replies
            set status = 'sending'
            where id = (
                select id from agent.replies
                where status = 'pending' and platform = 'gmail'
                order by created_at asc
                for update skip locked
                limit 1
            )
            returning id, in_reply_to_message_id, workspace_id, channel_id, reply_text
            """
        )
        return cur.fetchone()


def mark_sent(db, reply_id, gmail_msg_id):
    with db.cursor() as cur:
        cur.execute(
            """
            update agent.replies
            set status = 'sent', sent_at = now(), matrix_event_id = %s, error = NULL
            where id = %s
            """,
            (gmail_msg_id, reply_id),
        )


def mark_failed(db, reply_id, error_text):
    with db.cursor() as cur:
        cur.execute(
            """
            update agent.replies
            set status = 'failed', error = %s
            where id = %s
            """,
            (error_text[:1000], reply_id),
        )


def process_one(client, db, from_email, row):
    reply_id = row["id"]
    in_reply_to_msg_id = row["in_reply_to_message_id"]
    if not in_reply_to_msg_id:
        mark_failed(db, reply_id, "in_reply_to_message_id required for gmail replies")
        return
    try:
        ctx = fetch_thread_context(client, in_reply_to_msg_id)
    except Exception as e:
        mark_failed(db, reply_id, f"thread lookup failed: {e}")
        return
    if not ctx["to"]:
        mark_failed(db, reply_id, "could not resolve recipient address")
        return
    raw = build_mime(
        from_email=from_email,
        to_addr=ctx["to"],
        subject=ctx["subject"],
        body=row["reply_text"],
        in_reply_to=ctx["rfc_message_id"],
        references=ctx["references"],
    )
    payload = {"raw": raw}
    if ctx["thread_id"]:
        payload["threadId"] = ctx["thread_id"]
    try:
        sent = client.post("/users/me/messages/send", payload)
    except Exception as e:
        mark_failed(db, reply_id, f"send failed: {e}")
        return
    sent_id = sent.get("id", "")
    mark_sent(db, reply_id, sent_id)
    log("sent", reply_id=str(reply_id), gmail_id=sent_id, thread=ctx["thread_id"])


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
    from_email = tokens.get("email") or ""
    if not from_email:
        err("no email on stored token")
        sys.exit(1)
    client = GmailClient(tokens["refresh_token"], CLIENT_ID, CLIENT_SECRET)
    pg = get_pg()
    log("sender started", from_=from_email)
    while True:
        try:
            row = claim_pending(pg)
            if row is None:
                time.sleep(POLL_SECONDS)
                continue
            process_one(client, pg, from_email, row)
        except Exception as e:
            err("loop error", error=str(e))
            try:
                pg.close()
            except Exception:
                pass
            time.sleep(5)
            pg = get_pg()


if __name__ == "__main__":
    main()
