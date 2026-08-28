-- Shift end-of-day settlement: SRE-escalation marker + login→roster identity map.
-- Additive migration (2026-07-06). Idempotent. Applied to the writable tenant
-- schema (issue_tc on Tencent). Deploy:
--   sed 's/__SCHEMA__/issue_tc/g' sql/shift_settlement_schema.sql \
--     | docker exec -i pixdesk-pg psql -U synapse -d synapse -v ON_ERROR_STOP=1
--
-- Escalate-to-SRE is a MARKER only (per user 2026-07-06): the issue stays in the
-- unclosed list and keeps being tracked; we just record the SRE ticket number
-- (free text, e.g. WO-20260703-0038), who escalated, and when. No new terminal
-- lifecycle_state — so no CHECK-constraint change needed.
ALTER TABLE __SCHEMA__.issues
  ADD COLUMN IF NOT EXISTS escalated_ticket_id text,
  ADD COLUMN IF NOT EXISTS escalated_at        timestamptz,
  ADD COLUMN IF NOT EXISTS escalated_by_mxid   text;

-- Map a Feishu login (dashboard OAuth) to the roster nickname it settles as.
-- `support` is a shared login and the roster is keyed by nickname (绿巨人/阿杰/
-- 温迪/火娃/迪卢克), so the settlement window resolves "who am I" via this table.
-- person MUST match agent.shift_roster.person exactly.
CREATE TABLE IF NOT EXISTS __SCHEMA__.roster_identity (
    feishu_user_id text PRIMARY KEY,   -- dashboard_users.feishu_user_id
    person         text NOT NULL,       -- = agent.shift_roster.person
    email          text,
    updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS roster_identity_person ON __SCHEMA__.roster_identity (person);

SELECT 'shift settlement schema ready' ok;
