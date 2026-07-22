-- Channel classification (标记系统): mark a chat channel as something other
-- than a customer — supplier 供应商 (exa, ori…), internal, or ignore — and it
-- disappears from every customer-facing surface (dashboard rollup/summary/
-- metric lists/stale queue/shift stats/tickets, SLA alerts, handoff digest).
-- No row (or class='customer') = normal customer, the default.
CREATE TABLE IF NOT EXISTS issue_tc.channel_class (
    platform     text NOT NULL,
    workspace_id text NOT NULL,
    channel_id   text NOT NULL,
    class        text NOT NULL CHECK (class IN ('customer','supplier','internal','ignore')),
    note         text,
    marked_by    text,                 -- actor mxid of whoever set it
    updated_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (platform, workspace_id, channel_id)
);
SELECT 'channel_class ready' AS ok;
