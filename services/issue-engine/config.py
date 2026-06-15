"""Configuration for pixdesk-issue-engine, read from the environment.

All knobs live here so detector.py / llm.py / main.py never read os.environ
directly. Defaults are chosen so the service runs in its safest mode out of the
box: heuristics only, no LLM egress.
"""
from __future__ import annotations

import os

# --- DB --------------------------------------------------------------------
DATABASE_URL = os.environ["DATABASE_URL"]

# --- Service identity / auth ----------------------------------------------
# Bearer secret for the (future) BFF -> issue-engine trust boundary, mirroring
# ticket-api. Read endpoints in P1 are localhost-only; the secret gates writes.
ISSUE_API_SHARED_SECRET = os.environ.get("ISSUE_API_SHARED_SECRET", "")

# Matrix server name, used to build the system-actor mxid that lands in
# issue.issue_history.actor_mxid for every machine action.
MATRIX_SERVER_NAME = os.environ.get("MATRIX_SERVER_NAME", "localhost")
SYSTEM_ACTOR = f"@issue-engine:{MATRIX_SERVER_NAME}"

# --- Detector cadence / segmentation --------------------------------------
DETECTOR_NAME = os.environ.get("ISSUE_DETECTOR_NAME", "messages_imported_at")
POLL_SECONDS = int(os.environ.get("ISSUE_POLL_SECONDS", "30"))
# Batch of agent.messages rows pulled per incremental tick / backfill page.
BATCH_SIZE = int(os.environ.get("ISSUE_BATCH_SIZE", "500"))
# A problem segment subdivides a listener conversation. The listener already
# forks a new conversation after CONVERSATION_GAP_SECONDS (1800), so within one
# conversation consecutive turns are always <30min apart. This gap is therefore
# only a COARSE secondary boundary (a near-conversation-length lull); the primary
# segmentation signals are thread changes and closure-then-new-question. Set well
# above normal support reply latency to avoid over-segmenting one problem into
# many — over-segmentation floods the review queue.
GAP_SECONDS = int(os.environ.get("ISSUE_GAP_SECONDS", "1500"))

# --- SLA / closure ---------------------------------------------------------
# Customer message unanswered this long => unanswered_customer (decision: 2h,
# 7x24, no business-hours logic).
SLA_UNANSWERED_SECONDS = int(os.environ.get("ISSUE_SLA_UNANSWERED_SECONDS", "7200"))
# An open issue with no activity at all this long => idle_open.
IDLE_OPEN_SECONDS = int(os.environ.get("ISSUE_IDLE_OPEN_SECONDS", "86400"))
# Agent asked the customer something and they've been silent this long =>
# awaiting_customer_stale (a SOFTER flag — we're blocked on them).
AWAITING_CUSTOMER_STALE_SECONDS = int(
    os.environ.get("ISSUE_AWAITING_CUSTOMER_STALE_SECONDS", "172800")
)
# After an explicit customer thanks, auto-confirm closure once this grace window
# passes with no reopen. Silence-based inferred closures NEVER auto-confirm.
CLOSURE_GRACE_SECONDS = int(os.environ.get("ISSUE_CLOSURE_GRACE_SECONDS", "259200"))

# --- Role inference --------------------------------------------------------
# Comma-separated sender identifiers that are OUR operators, not customers.
# Matched against agent.messages.sender_id and sender_name (case-insensitive).
# Note: staff replies usually live in agent.replies (not agent.messages); this
# list catches operators who post through a bridged account that the listener
# does ingest.
AGENT_SENDERS = tuple(
    s.strip().lower()
    for s in os.environ.get("ISSUE_AGENT_SENDERS", "").split(",")
    if s.strip()
)

# --- LLM (decision: external API only; local self-hosting ruled out) -------
# none = pure heuristics, ZERO egress (P1-P3 default). api = OpenAI-compatible
# endpoint for the ambiguous residue only.
LLM_BACKEND = os.environ.get("ISSUE_LLM_BACKEND", "none").strip().lower()
LLM_BASE_URL = os.environ.get("ISSUE_LLM_BASE_URL", "").rstrip("/")
LLM_API_KEY = os.environ.get("ISSUE_LLM_API_KEY", "")
LLM_MODEL = os.environ.get("ISSUE_LLM_MODEL", "")
LLM_TIMEOUT_SECONDS = float(os.environ.get("ISSUE_LLM_TIMEOUT_SECONDS", "30"))
# Daily spend ceiling in CNY; when exceeded the backend degrades to none for the
# rest of the day (fail toward human review, never toward false closure).
LLM_DAILY_BUDGET_CNY = float(os.environ.get("ISSUE_LLM_DAILY_BUDGET_CNY", "0") or "0")

# --- Backfill --------------------------------------------------------------
# Set ISSUE_BACKFILL=1 to run a one-shot historical pass from epoch instead of
# the live loop. Used by P1's 35k-message backfill.
BACKFILL = os.environ.get("ISSUE_BACKFILL", "").strip() in ("1", "true", "yes")
# Optional floor for backfill so a re-run can skip ancient history.
BACKFILL_SINCE = os.environ.get("ISSUE_BACKFILL_SINCE", "").strip()
