-- PixDesk Issue Schema v1 — Closed-Loop Engine
-- Adds an automatic problem-detection layer ("issues") on top of the chat
-- aggregation in agent.* and the manual ticket layer in ticket.*. An *issue*
-- is one detected customer problem with its own start→progress→closure
-- lifecycle, segmented from chat history. It is the DETECTION layer; a
-- ticket.tickets row is the human-confirmed WORK layer, linked via
-- issue.issues.ticket_id. The engine NEVER writes agent.* or ticket.* — it
-- only reads them and writes issue.*.
--
-- Apply on publisher (192.168.72.185) AND subscriber (Tencent pixdesk-pg) via
-- scripts/deploy-issue-schema.sh. After both sides have the DDL the script runs
-- on the publisher:
--   ALTER PUBLICATION agent_pub ADD TABLES IN SCHEMA issue;
-- then on the subscriber:
--   ALTER SUBSCRIPTION agent_sub REFRESH PUBLICATION;
--
-- Replication notes (mirror ticket_schema.sql):
--  * Cross-schema and self-referential FKs are DEFERRABLE INITIALLY DEFERRED so
--    the subscriber can apply rows out of WAL order without deadlock.
--  * In-schema child→parent FKs use plain ON DELETE CASCADE (issue + its
--    issue_messages/signals/history are written in ONE source transaction, so
--    they replicate atomically, parent-first).
--  * Sequences are not replicated; issue_code_seq on the subscriber stays at its
--    initial value, harmless because the mirror is read-only and never inserts.
--  * issue.detector_cursor is publisher-local working state; it IS in the schema
--    (so the file stays a single source of truth) but carries no rows worth
--    mirroring — the subscriber copy simply stays empty.

CREATE SCHEMA IF NOT EXISTS issue;

-- ---------------------------------------------------------------------------
-- 0. One allowed touch to agent.*: index the detector's watermark column.
--    agent.messages.imported_at has no index today; the incremental poll
--    (WHERE imported_at > cursor) would table-scan without it. Indexes are
--    local (not replicated), so the deploy script applies this file on BOTH
--    hosts and the index is built on each.
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS agent_messages_imported_at_idx
  ON agent.messages (imported_at);

-- ---------------------------------------------------------------------------
-- 1. Code sequence (publisher-side increments; subscriber stays put)
-- ---------------------------------------------------------------------------

CREATE SEQUENCE IF NOT EXISTS issue.issue_code_seq AS bigint START WITH 1;

-- ---------------------------------------------------------------------------
-- 2. Issues — the per-problem lifecycle unit
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS issue.issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,                       -- ISS-N, filled by trigger

  -- A representative conversation (the one containing the segment's first
  -- message). A problem may span several agent.conversations rows; the
  -- denormalized customer key below is the authoritative grouping.
  conversation_id uuid NOT NULL,

  -- Denormalized "customer" key, captured at detection time so dashboard
  -- rollups never re-join and a later conversation-row fork can't orphan it.
  customer_platform text NOT NULL,
  customer_workspace_id text NOT NULL,
  customer_channel_id text NOT NULL,
  thread_id text,

  -- The real end-customer. For Gmail (platform,workspace_id) is the OPERATOR
  -- inbox, not the customer, so we also pin the external party here.
  external_party_id text,
  external_party_name text,

  -- Content (heuristic- or LLM-suggested):
  title text,
  summary text,

  -- Lifecycle (engine enforces a real directed graph via _validate_transition):
  lifecycle_state text NOT NULL DEFAULT 'detected'
    CHECK (lifecycle_state IN ('detected','active','awaiting_agent','awaiting_customer',
                               'resolution_proposed','closed_inferred','closed_confirmed',
                               'reopened','dismissed')),
  -- Review state is ORTHOGONAL to lifecycle (detection vs human sign-off):
  review_state text NOT NULL DEFAULT 'unreviewed'
    CHECK (review_state IN ('unreviewed','confirmed','rejected','merged','promoted')),

  -- Why it is / isn't closed-loop (free text; documented value sets):
  nonclosure_reason text,    -- unanswered_customer | idle_open | awaiting_customer_stale | reopened
  closure_reason text,       -- customer_thanked | agent_confirmed | human | ...
  closure_confidence real NOT NULL DEFAULT 0,   -- 0..1, last adversarial closure score

  -- Role/time signals (the non-closure floor reads these):
  last_speaker text CHECK (last_speaker IN ('customer','agent') OR last_speaker IS NULL),
  last_customer_at timestamptz,
  last_agent_at timestamptz,
  message_count int NOT NULL DEFAULT 0,

  -- Detection metadata:
  detector text NOT NULL,                         -- heuristic-v1 | llm-glm | ...
  confidence real NOT NULL DEFAULT 0,

  -- Timeline:
  opened_at timestamptz NOT NULL DEFAULT now(),   -- first customer message ts
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  sla_due_at timestamptz,
  closure_detected_at timestamptz,
  closed_at timestamptz,
  reopened_count int NOT NULL DEFAULT 0,

  -- Links and audit:
  ticket_id uuid,                                  -- set on promotion
  merged_into_issue_id uuid,                       -- set on human merge
  reviewed_by_mxid text,
  reviewed_at timestamptz,
  signals jsonb NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}',            -- carries metadata->>'segment_key'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT issues_conversation_fk FOREIGN KEY (conversation_id)
    REFERENCES agent.conversations(id) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT issues_ticket_fk FOREIGN KEY (ticket_id)
    REFERENCES ticket.tickets(id) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT issues_merged_fk FOREIGN KEY (merged_into_issue_id)
    REFERENCES issue.issues(id) DEFERRABLE INITIALLY DEFERRED
);

-- Idempotent re-scan guard: one active issue per (conversation, segment_key).
-- The detector upserts on this so reprocessing a window EXTENDS the in-flight
-- issue instead of spawning duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS issues_open_segment_uniq
  ON issue.issues (conversation_id, (metadata->>'segment_key'))
  WHERE lifecycle_state NOT IN ('closed_confirmed','dismissed');

-- 未闭环 dashboard (dominant read path):
CREATE INDEX IF NOT EXISTS issues_noncloop_idx
  ON issue.issues (customer_platform, customer_workspace_id)
  WHERE nonclosure_reason IS NOT NULL
    AND lifecycle_state NOT IN ('closed_confirmed','dismissed');

CREATE INDEX IF NOT EXISTS issues_active_state_idx
  ON issue.issues (lifecycle_state)
  WHERE lifecycle_state NOT IN ('closed_confirmed','dismissed');

CREATE INDEX IF NOT EXISTS issues_review_idx
  ON issue.issues (review_state) WHERE review_state = 'unreviewed';

CREATE INDEX IF NOT EXISTS issues_customer_idx
  ON issue.issues (customer_platform, customer_workspace_id);

CREATE INDEX IF NOT EXISTS issues_conversation_idx
  ON issue.issues (conversation_id);

CREATE INDEX IF NOT EXISTS issues_sla_idx
  ON issue.issues (sla_due_at)
  WHERE sla_due_at IS NOT NULL AND lifecycle_state NOT IN ('closed_confirmed','dismissed');

CREATE INDEX IF NOT EXISTS issues_ticket_idx
  ON issue.issues (ticket_id) WHERE ticket_id IS NOT NULL;

-- Auto-fill `code` (ISS-N) on insert unless the caller already set one.
CREATE OR REPLACE FUNCTION issue.fill_issue_code() RETURNS trigger AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := 'ISS-' || nextval('issue.issue_code_seq')::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS issues_fill_code ON issue.issues;
CREATE TRIGGER issues_fill_code
  BEFORE INSERT ON issue.issues
  FOR EACH ROW EXECUTE FUNCTION issue.fill_issue_code();

-- Maintain updated_at on every mutation.
CREATE OR REPLACE FUNCTION issue.touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS issues_touch_updated_at ON issue.issues;
CREATE TRIGGER issues_touch_updated_at
  BEFORE UPDATE ON issue.issues
  FOR EACH ROW EXECUTE FUNCTION issue.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Issue ↔ agent.messages evidence map (segmentation result)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS issue.issue_messages (
  issue_id uuid NOT NULL REFERENCES issue.issues(id) ON DELETE CASCADE,
  platform text NOT NULL,
  workspace_id text NOT NULL,
  channel_id text NOT NULL,
  message_id text NOT NULL,
  role text CHECK (role IN ('customer','agent','bot','system') OR role IS NULL),
  signal_kind text,                                -- problem_start | progress | agent_proposed_fix | customer_thanks | reopen_trigger | ...
  is_segment_start boolean NOT NULL DEFAULT false,
  ts timestamptz,
  added_by text NOT NULL DEFAULT 'heuristic-v1',
  PRIMARY KEY (issue_id, platform, workspace_id, channel_id, message_id),
  CONSTRAINT issue_messages_msg_fk
    FOREIGN KEY (platform, workspace_id, channel_id, message_id)
    REFERENCES agent.messages(platform, workspace_id, channel_id, message_id)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS issue_messages_issue_idx
  ON issue.issue_messages (issue_id);

CREATE INDEX IF NOT EXISTS issue_messages_msg_idx
  ON issue.issue_messages (platform, workspace_id, channel_id, message_id);

-- ---------------------------------------------------------------------------
-- 4. Closure re-evaluation record (adversarial / explainable; one row per eval)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS issue.issue_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issue.issues(id) ON DELETE CASCADE,
  evaluated_at timestamptz NOT NULL DEFAULT now(),
  evaluator text NOT NULL,                         -- heuristic | llm-affirm | llm-challenge | sla
  closure_score real,
  signals jsonb NOT NULL DEFAULT '{}',             -- structured breakdown (acks, open question, silence secs, model, tokens...)
  verdict text CHECK (verdict IN ('likely_closed','likely_open','uncertain') OR verdict IS NULL),
  cost_micros bigint NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS issue_signals_issue_idx
  ON issue.issue_signals (issue_id, evaluated_at DESC);

-- ---------------------------------------------------------------------------
-- 5. Audit/lifecycle history (untyped `field` so new event types need no DDL)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS issue.issue_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issue.issues(id) ON DELETE CASCADE,
  field text NOT NULL,                             -- detected | state_change | progress | closure_inferred | closure_confirmed | reopened | nonclosure_flagged | dismissed | promoted | merged | ...
  old_value jsonb,
  new_value jsonb,
  actor_mxid text NOT NULL,                        -- system actor: @issue-engine:<server>
  ts timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS issue_history_issue_idx
  ON issue.issue_history (issue_id, ts DESC);

-- ---------------------------------------------------------------------------
-- 6. Detector watermark (publisher-local working state; crash/restart-safe)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS issue.detector_cursor (
  detector text PRIMARY KEY,                       -- e.g. 'messages_imported_at'
  last_imported_at timestamptz NOT NULL DEFAULT '-infinity',
  last_message_pk jsonb,                           -- tie-break for equal imported_at
  last_run_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'
);

-- ---------------------------------------------------------------------------
-- 7. Merge audit (human de-duplication / over-segmentation fixes)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS issue.merge_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kept_issue_id uuid NOT NULL,
  merged_issue_id uuid NOT NULL,
  actor_mxid text NOT NULL,
  ts timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT merge_links_kept_fk FOREIGN KEY (kept_issue_id)
    REFERENCES issue.issues(id) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT merge_links_merged_fk FOREIGN KEY (merged_issue_id)
    REFERENCES issue.issues(id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS merge_links_kept_idx ON issue.merge_links (kept_issue_id);
