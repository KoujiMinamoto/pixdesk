"""Configuration for pixdesk-issue-engine, read from the environment.

All knobs live here so detector.py / llm.py / main.py never read os.environ
directly. Defaults are chosen so the service runs in its safest mode out of the
box: heuristics only, no LLM egress.
"""
from __future__ import annotations

import os

# --- DB --------------------------------------------------------------------
DATABASE_URL = os.environ["DATABASE_URL"]

# Postgres schema that holds issue.* tables. Default "issue" matches the
# publisher (185). Tenant deployments (e.g. the Tencent mirror) use a separate
# schema like "issue_tc" so they can write locally without conflicting with
# logical replication of the publisher's "issue" schema. Validated against a
# strict allowlist because it's interpolated into f-string SQL.
import re as _re
SCHEMA = os.environ.get("ISSUE_SCHEMA", "issue").strip()
if not _re.match(r"^[a-z_][a-z0-9_]{0,62}$", SCHEMA):
    raise RuntimeError(
        f"ISSUE_SCHEMA must match ^[a-z_][a-z0-9_]*$ (got {SCHEMA!r})"
    )

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

# --- Product tagging -------------------------------------------------------
# Fixed enum the distiller classifies each issue against (Novita's product
# surface). The LLM may only pick from this list; anything else is dropped.
# Override the whole list via ISSUE_PRODUCT_TAGS (comma-separated). "Other" is
# the catch-all so the model always has a valid choice.
_DEFAULT_PRODUCT_TAGS = "LLM,GPU,Sandbox,Image/Video,Billing,Account,API,Other"
PRODUCT_TAGS = tuple(
    s.strip()
    for s in os.environ.get("ISSUE_PRODUCT_TAGS", _DEFAULT_PRODUCT_TAGS).split(",")
    if s.strip()
)
# Case-insensitive lookup so the model's casing variance still maps to canonical.
PRODUCT_TAGS_LC = {t.lower(): t for t in PRODUCT_TAGS}

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

# Dashboard hides issues with last_activity_at older than this floor. The
# detector + distiller still see full history (so a thread starting in May
# that gets followed up in June produces ONE issue whose last_activity_at
# falls in June and stays visible). Default 2026-06-01 by user decision
# 2026-06-20: pre-June issues are dust, hide them. Set to empty string to
# disable.
TIME_FLOOR = os.environ.get("ISSUE_DASHBOARD_TIME_FLOOR", "2026-06-01").strip()
# Max LLM adjudication calls per detector tick. Throttles the post-backfill
# cleanup wave so we don't burn through tokens in a single sweep, and bounds
# steady-state cost per minute. Each tick = POLL_SECONDS apart.
LLM_PER_TICK_BUDGET = int(os.environ.get("ISSUE_LLM_PER_TICK_BUDGET", "100"))

# --- Auto-merge (P4f) -------------------------------------------------------
# When true, the engine asks GLM to compare adjacent unreviewed open issues in
# the SAME conversation, opened within MERGE_WINDOW_DAYS, and auto-merges them
# if the model says SAME. Off by default — enable only after a dry-run with
# validate_merge.py shows acceptable accuracy. The system actor performs the
# merge; humans can still un-merge by hand.
AUTO_MERGE = os.environ.get("ISSUE_AUTO_MERGE", "").strip() in ("1", "true", "yes")
MERGE_WINDOW_DAYS = float(os.environ.get("ISSUE_MERGE_WINDOW_DAYS", "30"))

# --- Backfill --------------------------------------------------------------
# Set ISSUE_BACKFILL=1 to run a one-shot historical pass from epoch instead of
# the live loop. Used by P1's 35k-message backfill.
BACKFILL = os.environ.get("ISSUE_BACKFILL", "").strip() in ("1", "true", "yes")
# Optional floor for backfill so a re-run can skip ancient history.
BACKFILL_SINCE = os.environ.get("ISSUE_BACKFILL_SINCE", "").strip()

# --- Internal (Feishu) discussion context ----------------------------------
# When on, distill injects our own team's INTERNAL Feishu-group discussion for a
# customer as a separate read-only context block alongside the external
# Slack/Discord transcript, so summaries reflect how WE saw the issue — never as
# a source of new issues. Requires feishu.chat_map to link the external channel
# (platform:workspace_id:channel_id) to a Feishu chat_id, and feishu.messages to
# be populated (see services/feishu-collector/backfill.py). Off by default so
# the change is fully reversible: when off, distill behaves exactly as before.
INTERNAL_CONTEXT = os.environ.get(
    "ISSUE_INTERNAL_CONTEXT", "").strip().lower() in ("1", "true", "yes", "on")
# Cap on internal-discussion chars injected per window, so a chatty internal
# group can't blow up the prompt. Oldest-trimmed, newest kept.
INTERNAL_CONTEXT_MAX_CHARS = int(
    os.environ.get("ISSUE_INTERNAL_CONTEXT_MAX_CHARS", "6000"))

# --- Proactive SLA alerts (Feishu) -----------------------------------------
# A background loop pushes an interactive card into the ops group and @-mentions
# whoever is on duty (agent.shift_roster) when a customer's issue has waited on
# us longer than ALERT_SLA_MINUTES and is still open. Deduped via
# issue_tc.sla_alert_log with an ALERT_COOLDOWN_HOURS window; capped at
# ALERT_MAX_PER_TICK cards per pass so a big backlog can't flood the group. On
# the very first run (empty log) we send ONE summary card and silence the
# existing backlog instead of firing a card per item. Off by default (needs
# Feishu creds) so nothing pushes until explicitly enabled in prod.
ALERT_ENABLED = os.environ.get(
    "ISSUE_ALERT_ENABLED", "").strip().lower() in ("1", "true", "yes", "on")
ALERT_CHAT_ID = os.environ.get("ISSUE_ALERT_CHAT_ID", "").strip()
ALERT_SLA_MINUTES = int(os.environ.get("ISSUE_ALERT_SLA_MINUTES", "30"))
ALERT_COOLDOWN_HOURS = float(os.environ.get("ISSUE_ALERT_COOLDOWN_HOURS", "4"))
ALERT_MAX_PER_TICK = int(os.environ.get("ISSUE_ALERT_MAX_PER_TICK", "5"))
ALERT_INTERVAL_SECONDS = int(os.environ.get("ISSUE_ALERT_INTERVAL_SECONDS", "300"))
# Shift-handoff digest: when someone comes on duty, @-mention them with the list
# of still-open customers they're inheriting. Fired once per shift, within this
# many minutes of the shift's start (must exceed ALERT_INTERVAL_SECONDS so a tick
# lands inside the window; wider = tolerates an engine restart around handoff).
ALERT_HANDOFF_WINDOW_MINUTES = int(
    os.environ.get("ISSUE_ALERT_HANDOFF_WINDOW_MINUTES", "30"))
# Before each alert pass, re-run the closure agent (LLM) on a few just-active,
# not-yet-audited issues, so alerts fire on LLM-verified state instead of the
# detector's mechanical "last speaker = customer → unanswered". This is what
# demotes e.g. a customer's "thanks" after we said we're on it from a false
# SLA breach. Off → alerts use whatever state is already stored.
ALERT_LLM_VERIFY = os.environ.get(
    "ISSUE_ALERT_LLM_VERIFY", "1").strip().lower() in ("1", "true", "yes", "on")
ALERT_VERIFY_CAP = int(os.environ.get("ISSUE_ALERT_VERIFY_CAP", "5"))
# Feishu app creds — the engine has none of its own, so accept either the shared
# ISSUE_-prefixed names or the plain FEISHU_ ones the collector/widget already use.
FEISHU_APP_ID = (os.environ.get("ISSUE_FEISHU_APP_ID")
                 or os.environ.get("FEISHU_APP_ID", "")).strip()
FEISHU_APP_SECRET = (os.environ.get("ISSUE_FEISHU_APP_SECRET")
                     or os.environ.get("FEISHU_APP_SECRET", "")).strip()
