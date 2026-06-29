-- Real bridge connection status, pushed from 185 (where the mautrix bridges run).
-- One row per platform. Distinct from message-freshness: this is the actual
-- gateway/websocket connection state parsed from the bridge logs.
CREATE TABLE IF NOT EXISTS agent.bridge_status (
    platform        text PRIMARY KEY,
    connected       boolean NOT NULL,
    last_event      text,               -- e.g. "Connected to Discord" / "Disconnected"
    last_event_at   timestamptz,        -- when that lifecycle event happened
    reconnects_24h  int DEFAULT 0,
    detail          text,
    reported_at     timestamptz NOT NULL DEFAULT now()  -- when 185 last pushed (liveness of the probe itself)
);
SELECT 'bridge_status ready' AS ok;
