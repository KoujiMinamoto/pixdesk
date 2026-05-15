-- PixDesk Agent Schema v2: operational workflow support
-- Run after agent_schema.sql (v1) has been applied.

-- 1. Conversations table
CREATE TABLE IF NOT EXISTS agent.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  workspace_id text NOT NULL,
  channel_id text NOT NULL,
  thread_id text,
  matrix_room_id text,
  status text NOT NULL DEFAULT 'open',
  priority text DEFAULT 'normal',
  tags text[] DEFAULT '{}',
  opened_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by text,
  metadata jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS agent_conversations_status_idx
  ON agent.conversations (status) WHERE status != 'resolved';

CREATE INDEX IF NOT EXISTS agent_conversations_channel_idx
  ON agent.conversations (platform, workspace_id, channel_id);

-- 2. Extend agent.messages with operational columns
ALTER TABLE agent.messages
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES agent.conversations(id),
  ADD COLUMN IF NOT EXISTS matrix_event_id text,
  ADD COLUMN IF NOT EXISTS matrix_room_id text;

CREATE INDEX IF NOT EXISTS agent_messages_status_idx
  ON agent.messages (status) WHERE status != 'resolved';

CREATE INDEX IF NOT EXISTS agent_messages_conversation_idx
  ON agent.messages (conversation_id) WHERE conversation_id IS NOT NULL;

-- 3. Agent replies audit trail
CREATE TABLE IF NOT EXISTS agent.replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES agent.conversations(id),
  in_reply_to_message_id text,
  platform text NOT NULL,
  workspace_id text NOT NULL,
  channel_id text NOT NULL,
  matrix_room_id text,
  matrix_event_id text,
  reply_text text NOT NULL,
  reply_type text DEFAULT 'auto',
  agent_id text,
  status text DEFAULT 'pending',
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  metadata jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS agent_replies_conversation_idx
  ON agent.replies (conversation_id);

CREATE INDEX IF NOT EXISTS agent_replies_pending_idx
  ON agent.replies (status) WHERE status = 'pending';

-- 4. Webhook configuration
CREATE TABLE IF NOT EXISTS agent.webhook_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  secret text,
  events text[] DEFAULT '{message.new}',
  filter_platforms text[],
  filter_channels text[],
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 5. Team action audit log
CREATE TABLE IF NOT EXISTS agent.team_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_mxid text NOT NULL,
  action text NOT NULL,
  conversation_id uuid REFERENCES agent.conversations(id),
  message_id text,
  details jsonb DEFAULT '{}',
  ts timestamptz NOT NULL DEFAULT now()
);
