-- Raw inbound Feishu (internal team) messages captured via event subscription.
-- Kept separate from agent.messages for now (user chose "collect & store first,
-- don't wire into distill yet"). Internal discussion = our staff talking in a
-- customer's internal group, complementary to the external Slack/Discord chat.
CREATE SCHEMA IF NOT EXISTS feishu;
CREATE TABLE IF NOT EXISTS feishu.messages (
    message_id    text PRIMARY KEY,          -- Feishu im message_id (dedup key)
    chat_id       text,                       -- group/chat id
    chat_type     text,                       -- group | p2p
    sender_id     text,                       -- open_id / union_id of sender
    sender_type   text,                       -- user | bot | app
    msg_type      text,                       -- text | post | image | ...
    text          text,                       -- best-effort extracted plain text
    create_time   timestamptz,                -- Feishu create_time (ms epoch -> ts)
    raw           jsonb NOT NULL,             -- full event for later re-parse
    received_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS feishu_messages_chat ON feishu.messages (chat_id, create_time);
CREATE INDEX IF NOT EXISTS feishu_messages_time ON feishu.messages (create_time);

-- Optional: map a Feishu chat_id to a customer (filled in later when we wire
-- internal<->external together). Empty for now.
CREATE TABLE IF NOT EXISTS feishu.chat_map (
    chat_id       text PRIMARY KEY,
    chat_name     text,
    customer_key  text,          -- platform:workspace:channel of the matching external group, when known
    note          text,
    updated_at    timestamptz NOT NULL DEFAULT now()
);
SELECT 'feishu schema ready' ok;
