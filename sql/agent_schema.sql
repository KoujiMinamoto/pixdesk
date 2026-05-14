create schema if not exists agent;

create table if not exists agent.channels (
  platform text not null,
  workspace_id text not null,
  channel_id text not null,
  channel_name text,
  matrix_room_id text,
  raw jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (platform, workspace_id, channel_id)
);

create table if not exists agent.messages (
  platform text not null,
  workspace_id text not null,
  channel_id text not null,
  message_id text not null,
  thread_id text,
  sender_id text,
  sender_name text,
  text text,
  ts timestamptz,
  raw jsonb not null,
  imported_at timestamptz not null default now(),
  primary key (platform, workspace_id, channel_id, message_id)
);

create index if not exists agent_messages_channel_ts_idx
  on agent.messages (platform, workspace_id, channel_id, ts desc);

create index if not exists agent_messages_thread_idx
  on agent.messages (platform, workspace_id, channel_id, thread_id);
