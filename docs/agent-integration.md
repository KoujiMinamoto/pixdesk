# Agent Integration Notes

Once bridges are connected, your agent should talk to Matrix, not directly to Slack/Discord/Telegram.

## Read messages

Use the Matrix Client-Server API with a dedicated Matrix user:

- `/sync` for realtime events
- room timeline events for message content
- room membership/state events for metadata

The agent user must be invited to rooms it should observe, or you can make the bridge/rooms invite it as part of your workflow.

## Send replies

Send Matrix room messages as the agent user:

- `PUT /_matrix/client/v3/rooms/{roomId}/send/m.room.message/{txnId}`

Bridges will relay the Matrix message back to the remote platform if the room is a bridged portal and permissions allow it.

## Suggested internal event shape

```ts
type MatrixBridgeMessage = {
  matrixRoomId: string;
  matrixEventId: string;
  senderMxid: string;
  body: string;
  timestamp: string;
  bridge?: "telegram" | "discord" | "slack";
  remoteNetwork?: string;
  raw: unknown;
};
```

## Safety defaults

- Start with analysis-only mode.
- Add an allowlist of Matrix room IDs before enabling auto-reply.
- Keep human approval for DMs until prompts and policies are stable.
- Log incoming event ID, generated response, final sent event ID, and model metadata.
- Avoid putting long-term secrets in bridge configs that are committed to git.

