# Agent Interface Specification

This document defines the contract for external agents integrating with PixDesk.

## Overview

PixDesk provides two integration paths:

1. **Real-time** — register a webhook to receive new messages instantly, then insert replies into Postgres.
2. **Batch** — query Postgres directly for message history and analysis.

Both paths use the same reply mechanism: INSERT into `agent.replies`, and the sender worker delivers via Matrix.

## Database Connection

```
Host: postgres (from Docker network) or localhost:5432 (if exposed)
Database: synapse
User: synapse
Password: (from .env POSTGRES_PASSWORD)
Schema: agent
```

## Tables

### agent.messages

Incoming messages from all bridged platforms.

| Column | Type | Description |
|--------|------|-------------|
| platform | text | discord, slack, telegram |
| workspace_id | text | Guild/workspace ID or room ID |
| channel_id | text | Channel or room ID |
| message_id | text | Unique message identifier |
| thread_id | text | Thread reference |
| sender_id | text | Sender MXID or platform ID |
| sender_name | text | Display name |
| text | text | Message body |
| ts | timestamptz | Original timestamp |
| raw | jsonb | Full event payload |
| status | text | new, queued, replied, escalated, resolved |
| conversation_id | uuid | FK to agent.conversations |
| matrix_event_id | text | Matrix event ID |
| matrix_room_id | text | Matrix room ID |

### agent.conversations

Groups related messages into logical conversations.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| platform | text | Source platform |
| workspace_id | text | Workspace |
| channel_id | text | Channel |
| thread_id | text | Platform thread ID |
| matrix_room_id | text | Matrix room |
| status | text | open, waiting, resolved |
| priority | text | low, normal, high |
| tags | text[] | Custom labels |
| opened_at | timestamptz | When first message arrived |
| last_activity_at | timestamptz | Most recent message time |
| resolved_at | timestamptz | When marked resolved |
| resolved_by | text | Who resolved it |

### agent.replies

Insert a row here to send a reply. The sender worker handles delivery.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Auto-generated |
| conversation_id | uuid | FK to conversations |
| in_reply_to_message_id | text | Matrix event ID to reply to (optional) |
| platform | text | Target platform |
| workspace_id | text | Target workspace |
| channel_id | text | Target channel |
| matrix_room_id | text | **Required** — where to send |
| reply_text | text | **Required** — message body |
| reply_type | text | auto, manual, batch |
| agent_id | text | Your agent identifier |
| status | text | pending → sent / failed (managed by sender) |
| error | text | Error message if failed |
| created_at | timestamptz | Auto |
| sent_at | timestamptz | Set by sender on success |

### agent.webhook_config

Register webhooks to receive real-time notifications.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Auto-generated |
| name | text | Human-readable label |
| url | text | POST endpoint |
| secret | text | HMAC-SHA256 signing key |
| events | text[] | Event types: message.new |
| filter_platforms | text[] | null = all |
| filter_channels | text[] | null = all |
| enabled | boolean | Toggle |

## Webhook Payload

When a new message arrives, PixDesk POSTs to registered webhooks:

```json
{
  "event": "message.new",
  "timestamp": "2026-05-15T10:30:00Z",
  "message": {
    "platform": "discord",
    "workspace_id": "!room:server",
    "channel_id": "!room:server",
    "message_id": "$event_id",
    "sender_name": "CustomerName",
    "text": "How do I reset my password?",
    "matrix_room_id": "!abc:server",
    "matrix_event_id": "$xyz",
    "conversation_id": "uuid-here"
  }
}
```

### Signature Verification

If `secret` is set, the request includes:

```
X-Webhook-Signature: sha256=<hex-hmac-sha256(secret, body)>
```

## Sending Replies

Insert into `agent.replies`:

```sql
INSERT INTO agent.replies
  (conversation_id, matrix_room_id, reply_text, agent_id, reply_type)
VALUES
  ('conv-uuid', '!room:server', 'Here is how to reset your password...', 'my-agent-v1', 'auto');
```

The sender worker picks it up within seconds, sends via Matrix, and updates `status` to `sent`.

## Common Queries

### Unprocessed messages

```sql
SELECT * FROM agent.messages
WHERE status = 'new'
ORDER BY ts;
```

### Open conversations

```sql
SELECT c.*, count(m.message_id) as msg_count
FROM agent.conversations c
LEFT JOIN agent.messages m ON m.conversation_id = c.id
WHERE c.status = 'open'
GROUP BY c.id
ORDER BY c.last_activity_at DESC;
```

### Messages in a conversation

```sql
SELECT sender_name, text, ts
FROM agent.messages
WHERE conversation_id = 'uuid-here'
ORDER BY ts;
```

### Mark conversation resolved

```sql
UPDATE agent.conversations
SET status = 'resolved', resolved_at = now(), resolved_by = 'my-agent-v1'
WHERE id = 'uuid-here';

UPDATE agent.messages
SET status = 'resolved'
WHERE conversation_id = 'uuid-here';
```

## Message Status Lifecycle

```
new → queued → replied → resolved
         ↘ escalated (needs human)
```

- `new`: just arrived, not yet processed
- `queued`: agent has claimed it
- `replied`: agent sent a response
- `escalated`: agent deferred to human
- `resolved`: conversation closed

## Setup

```bash
make create-agent AGENT_PASS='strong-password'
# Login to get access token:
curl -s -X POST http://localhost:8008/_matrix/client/v3/login \
  -d '{"type":"m.login.password","identifier":{"type":"m.id.user","user":"agent"},"password":"strong-password"}' \
  | jq -r .access_token
# Add token to .env as AGENT_ACCESS_TOKEN
make migrate-agent-db
make start-agent
```
