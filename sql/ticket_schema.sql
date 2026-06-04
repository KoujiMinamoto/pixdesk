-- PixDesk Ticket Schema v1
-- Adds an explicit work-item layer ("tickets") on top of the chat
-- aggregation in agent.*. Tickets bind to a single agent.conversations row
-- and carry their own lifecycle: subject, assignee, customer (derived via
-- conversation→channel join), priority, comments, attachments, audit history.
--
-- Apply on publisher (192.168.72.185) AND subscriber (Tencent pixdesk-pg).
-- After both sides have the DDL, run on publisher:
--   ALTER PUBLICATION agent_pub ADD TABLES IN SCHEMA ticket;
-- then on subscriber:
--   ALTER SUBSCRIPTION agent_sub REFRESH PUBLICATION;
--
-- The FK from ticket.tickets.conversation_id → agent.conversations.id is
-- DEFERRABLE INITIALLY DEFERRED so the subscriber can apply rows out of
-- WAL order without deadlock. Sequences are not replicated; the subscriber
-- ticket_code_seq stays at its initial value, harmless because the mirror
-- is read-only.

CREATE SCHEMA IF NOT EXISTS ticket;

-- 1. Templates ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ticket.ticket_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  default_subject text,
  default_description text,
  default_priority text,
  default_tags text[] DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Note: the "default" template is seeded by deploy-ticket-schema.sh on the
-- publisher only. Seeding here would race with the subscriber's initial
-- COPY (both sides would have the row, COPY hits the unique-key on `name`).

-- 2. Code sequence (publisher-side increments; subscriber stays put) ---------

CREATE SEQUENCE IF NOT EXISTS ticket.ticket_code_seq AS bigint START WITH 1;

-- 3. Tickets -----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ticket.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  subject text NOT NULL,
  description text,
  conversation_id uuid NOT NULL,
  assignee_mxid text,
  created_by_mxid text NOT NULL,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'pending_customer', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'standard'
    CHECK (priority IN ('low', 'standard', 'high', 'urgent')),
  tags text[] NOT NULL DEFAULT '{}',
  template_id uuid REFERENCES ticket.ticket_templates(id),
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  due_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}',
  CONSTRAINT tickets_conversation_fk
    FOREIGN KEY (conversation_id) REFERENCES agent.conversations(id)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS tickets_active_status_idx
  ON ticket.tickets (status)
  WHERE status NOT IN ('resolved', 'closed');

CREATE INDEX IF NOT EXISTS tickets_assignee_idx
  ON ticket.tickets (assignee_mxid)
  WHERE assignee_mxid IS NOT NULL;

CREATE INDEX IF NOT EXISTS tickets_conversation_idx
  ON ticket.tickets (conversation_id);

CREATE INDEX IF NOT EXISTS tickets_tags_gin_idx
  ON ticket.tickets USING gin (tags);

CREATE INDEX IF NOT EXISTS tickets_due_idx
  ON ticket.tickets (due_at)
  WHERE due_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS tickets_opened_at_idx
  ON ticket.tickets (opened_at DESC);

-- Auto-fill `code` on insert. SECURITY DEFINER not needed; the column has
-- no default so we always overwrite. Skipped if the caller already set one.
CREATE OR REPLACE FUNCTION ticket.fill_ticket_code() RETURNS trigger AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := 'PIX-' || nextval('ticket.ticket_code_seq')::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tickets_fill_code ON ticket.tickets;
CREATE TRIGGER tickets_fill_code
  BEFORE INSERT ON ticket.tickets
  FOR EACH ROW EXECUTE FUNCTION ticket.fill_ticket_code();

-- Maintain updated_at on every row mutation.
CREATE OR REPLACE FUNCTION ticket.touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tickets_touch_updated_at ON ticket.tickets;
CREATE TRIGGER tickets_touch_updated_at
  BEFORE UPDATE ON ticket.tickets
  FOR EACH ROW EXECUTE FUNCTION ticket.touch_updated_at();

-- 4. Pinned chat messages (M2M ticket ↔ agent.messages) ---------------------

CREATE TABLE IF NOT EXISTS ticket.ticket_messages (
  ticket_id uuid NOT NULL REFERENCES ticket.tickets(id) ON DELETE CASCADE,
  platform text NOT NULL,
  workspace_id text NOT NULL,
  channel_id text NOT NULL,
  message_id text NOT NULL,
  pinned_by_mxid text NOT NULL,
  pinned_at timestamptz NOT NULL DEFAULT now(),
  note text,
  PRIMARY KEY (ticket_id, platform, workspace_id, channel_id, message_id),
  CONSTRAINT ticket_messages_msg_fk
    FOREIGN KEY (platform, workspace_id, channel_id, message_id)
    REFERENCES agent.messages(platform, workspace_id, channel_id, message_id)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS ticket_messages_ticket_idx
  ON ticket.ticket_messages (ticket_id);

-- 5. Comments ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ticket.ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES ticket.tickets(id) ON DELETE CASCADE,
  author_mxid text NOT NULL,
  body text NOT NULL,
  is_internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS ticket_comments_ticket_idx
  ON ticket.ticket_comments (ticket_id, created_at);

-- 6. Attachments -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ticket.ticket_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES ticket.tickets(id) ON DELETE CASCADE,
  filename text NOT NULL,
  mime text NOT NULL,
  size bigint NOT NULL CHECK (size >= 0),
  sha256 text,
  storage_path text NOT NULL,
  uploaded_by_mxid text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ticket_attachments_ticket_idx
  ON ticket.ticket_attachments (ticket_id, uploaded_at);

CREATE INDEX IF NOT EXISTS ticket_attachments_sha256_idx
  ON ticket.ticket_attachments (sha256)
  WHERE sha256 IS NOT NULL;

-- 7. Watchers ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ticket.ticket_watchers (
  ticket_id uuid NOT NULL REFERENCES ticket.tickets(id) ON DELETE CASCADE,
  watcher_mxid text NOT NULL,
  added_by_mxid text NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ticket_id, watcher_mxid)
);

-- 8. History (audit trail; one row per field change) ------------------------

CREATE TABLE IF NOT EXISTS ticket.ticket_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES ticket.tickets(id) ON DELETE CASCADE,
  field text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  actor_mxid text NOT NULL,
  ts timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ticket_history_ticket_idx
  ON ticket.ticket_history (ticket_id, ts DESC);
