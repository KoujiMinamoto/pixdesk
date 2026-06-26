# Closed-Loop Engine + Dashboard — Change Log (2026-06)

Covers the work after the P0–P9 commits: distill robustness, dashboard role/
product/Chinese-summary features, Feishu auth, weekly metrics, and the Nova
Brain API sync. Deployment is the **Tencent host** (`124.221.98.230`,
`/opt/pixdesk-issue`, schema `issue_tc`), engine LLM = Claude Sonnet 4.6 via
the paigod proxy. Deploy = scp changed files + `docker compose build/up`.

## 1. Distill: role + product + Chinese summary

- **Content-based role judgement.** distill's LLM now decides each message's
  role (customer/agent/bot) from conversation *content*; `ISSUE_AGENT_SENDERS`
  is a hint only. Added a CHANNEL CONTEXT block (`_customer_label` derived from
  the channel name) + an "address rule" so mixed channels (customer staff +
  our support both present) don't mislabel. Roles stored on
  `issue_messages.role`; `last_speaker`/`last_*_at` computed LLM-first with the
  name-list as fallback.
- **Product tags.** Each issue classified into `config.PRODUCT_TAGS`
  (env `ISSUE_PRODUCT_TAGS`, default LLM/GPU/Sandbox/Image-Video/Billing/
  Account/API/Other), stored in `issues.metadata.products`.
- **Chinese summary.** distill emits `summary_zh` (≤80 字) → stored in
  `issues.metadata.summary_zh`. No DDL change.

## 2. Distill: robustness fixes (root-caused the hard way)

- **Watermark safety.** If every window of a run fails at the LLM (proxy 503),
  do NOT advance `last_distilled_ts` — retry next pass. Partial-failure: hold
  the watermark just before the first failed window so unread messages aren't
  skipped.
- **Incremental MUST open new issues.** Rule 5b: new problems in new messages
  get fresh issues even if memory didn't mention them (fixed June problems
  being silently swallowed into old issues).
- **Delta output (Rule 5c).** Output only issues the current window creates or
  changes — never re-emit the whole backlog. This fixed the paigod proxy's
  ~21KB response-body truncation that destroyed big-channel issues
  (e.g. openrouter once dropped 543→199). Keep `ISSUE_DISTILL_WINDOW_CHARS`
  at 10000 (6000 over-fragments huge channels into 800+ windows).
- **Per-window memory re-render** so a problem spanning a window boundary
  isn't duplicated/dropped.
- `max_tokens` for distill calls raised to 32768.

## 3. Auto-discovery of new customer channels

- `distill.discover_channels`: channels with ≥`ISSUE_DISCOVER_MIN_CUSTOMER_MSGS`
  (default 2) customer messages and no `channel_memory` row get bootstrapped
  each pass. Two gates: `_is_customer_channel` name filter
  (`ISSUE_DISCOVER_REQUIRE_CUSTOMER_NAME=1` — keeps ext-*/`<>`/novita/support,
  drops #general/#announcements/internal-*/bare-name DMs) and a TIME_FLOOR
  recency gate (skip channels with no customer msg since 2026-06-01).
- detector.py also got the name gate so the heuristic detector stops flooding
  noise channels with issues distill would never adopt.

## 4. Dashboard (ticket-widget) — Feishu auth + approval flow

- **Feishu OAuth login** gates the cross-customer dashboard (closed the
  prior public-no-auth hole on all `/api/v1/dashboard/*` reads). Config:
  `FEISHU_APP_ID` / `FEISHU_APP_SECRET` / `FEISHU_ADMIN_EMAILS`.
- **Approval flow** in `nova`-style table `issue_tc.dashboard_users`
  (feishu_user_id PK, status pending/approved/rejected, role reviewer/admin).
  First login becomes admin (bootstrap), or emails in `FEISHU_ADMIN_EMAILS`.
  Non-admins land on an "申请访问" screen; admins approve via the `#/admin`
  page. Feishu may not return email → identity keyed on open_id.
- Write actions (review/merge/promote) now record the Feishu user as actor
  (`@<email>:feishu`) into issue_history.
- ⚠️ Feishu app "可用范围" must be opened to staff or they're blocked before
  reaching our approval screen.

## 5. Dashboard UI fixes

- **Back button** fixed (was a `history` var shadowing `window.history` →
  silent throw); now navigates to the parent customer view explicitly.
- Customer cards drop raw workspace IDs; show platform + product chips.
- Issue list **grouped** 待处理/进行中 vs 已闭环.
- **Customer search box** on the home filter bar.
- Issue-detail **meta row** restructured (chips, not " · " text).
- Transcript **day dividers** for long threads; dual-color customer/agent.
- Mobile layout fixes for the issue rows.

## 6. Weekly summary strip

- `/v1/dashboard/summary` rewritten to "this week" = since last Friday 00:00
  (SQL-computed, auto-rolling). 6 cards: 本周活跃客户 / 本周新增问题 /
  本周活跃问题 / 本周新增对话 (from `agent.conversations`, customer channels
  only) / 本周新闭环 / 待我方回复 (always-current).

## 7. Refresh cadence

- `ISSUE_DISTILL_INTERVAL_SECONDS` 12h → **1h**. distill is incremental
  (watermark per channel): idle channels are skipped at zero cost; only
  channels with new messages spend an LLM call on just the new turns. So
  dashboard now reflects customer activity within ~1h.

## 8. Nova Brain API sync (new)

- Mirrors Novita's internal read-only API into Tencent `nova.*` schema
  (`sql/nova_schema.sql`: customer_revenue / sla_model / pricing_model /
  or_intel_snapshot). Script `scripts/nova-sync.py` runs on 185 hourly via
  `deploy/systemd/nova-sync.{service,timer}`, reaching Tencent through the
  existing SSH-out trust (185→Tencent `docker exec psql`; direct 5432 is
  firewalled). Key in `/etc/nova-sync.env` (mode 600). Dedupes rows by PK
  (API returns duplicate model/product names). Two base URLs (.190 main,
  .123 or-intel). Contains customer PII — internal only.

## 9. Shift-review panel (8h handoff)

Support runs **3 rotating 8-hour shifts**; reviewers need an end-of-shift
"what moved on my watch" view. Added a dedicated panel reachable from the
header ("班次复盘", `#/shift`).

- **Engine** `/v1/dashboard/shift?hours=8` (default 8, 1–72). Returns the
  issues in a rolling N-hour window split into three **mutually-exclusive**
  buckets, each a full issue list (+ `channel_name` so cross-customer rows are
  legible):
  - `closed` — closure detected in-window (terminal state wins priority),
  - `new` — opened in-window and still open,
  - `active` — opened earlier but had activity in-window (still open).
  Plus a `counts` summary and the window's `since` timestamp.
- **Widget** proxies it at `/api/v1/dashboard/shift` behind the same
  `require_dash_approved` gate as the rest of the dashboard.
- **Frontend** `renderShift()`: a 3-card count strip (新增/活跃/已闭环) over
  three issue sections, a window selector (8 / 12 / 24 小时), and a header
  link. Issue rows in this view carry a clickable customer chip
  (`issueRow(it, {showCustomer:true})`) that jumps to that customer's page.

## 10. Closure actions, top-level nav, and the ticket archive

A reviewer needs to act on a 疑似闭环, and every issue needs an archival
"ticket" record with handler attribution. Three linked changes:

### 10a. Human closure actions (确认闭环 / 未闭环)
`/v1/issues/{id}/review` gains two actions on top of confirm/reject/dismiss:
- **`close`** (确认闭环) — sets `lifecycle_state=closed_confirmed` (the
  human-only terminal state the closure_agent is forbidden from setting),
  `review_state=confirmed`, fills `closed_at`/`closure_detected_at`. This is
  how a 疑似闭环 is promoted to a real closure and archived as a finished
  ticket.
- **`reopen`** (未闭环) — the auto-closure was wrong. Lifecycle returns to an
  open state derived from who spoke last (我方 last → `awaiting_customer`;
  else `awaiting_agent` + `unanswered_customer`), bumps `reopened_count`, and
  sets `review_state=confirmed` so the closure_agent won't silently re-close it
  — a human now owns the close.

Issue-detail buttons are now state-aware: 疑似闭环 shows 确认闭环 / 未闭环 /
忽略; 已闭环 shows 重新打开; open issues show 确认为真问题 / 标记已闭环 /
忽略.

### 10b. Top-level nav (总览 / 班次复盘 / Ticket 记录)
A tab bar under the header switches between the three top-level views
(`#/`, `#/shift`, `#/tickets`); hidden on drilldowns and gate screens. (The
old per-link header shortcut for 班次复盘 was removed in favour of the tabs.)

### 10c. Ticket archive page + handler attribution
`/v1/dashboard/tickets` returns every issue as a flat "ticket record"
(status/q/platform/product filters, paginated, default newest-closed-first).
Because **`support` is a shared on-duty login**, the real handler can't come
from the auth identity — so each ticket derives `last_handler` and
`handler_count` from the distinct **我方 senders** in the chat itself. The
issue-detail page shows the full 经手同学 chip list (derived client-side from
the transcript roles). This is the hook a future **support shift-roster** will
use to attribute who worked/resolved each issue by time. Frontend
`renderTickets()` is a searchable, status-tabbed list → existing issue detail.

## Known follow-ups
- Auto-discovery runs once per distill pass; detector can still create a few
  redundant heuristic issues in distill-owned channels (cleaned via
  `DELETE ... detector='heuristic-v1' AND channel has channel_memory`).
- Residual heuristic issues outside the dashboard window (pre-June / non-
  customer channels) are harmless but present.
