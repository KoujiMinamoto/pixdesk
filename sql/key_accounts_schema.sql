-- Key-account tiering (重点客户): L5+ customers from the sales-side CRM list.
-- Source of truth is the CRM export the user pastes in (Company/Level/Sales/UUID);
-- scripts/key_accounts_import.py turns it into an idempotent upsert + re-match.
-- UUID is the CRM's stable id — future list updates align on it.

CREATE TABLE IF NOT EXISTS issue_tc.key_accounts (
    uuid        uuid PRIMARY KEY,
    company     text,                    -- may be blank in the CRM export
    level       text NOT NULL,           -- 'L5' | 'L6' | 'L7' (text sort = level sort)
    sales_cn    text,                    -- CRM 花名: 闻仲 / 罗杰斯
    sales_name  text,                    -- our colleague: Peter / junyu
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- A company usually spans several chat channels (ext-*, billing splits,
-- tri-party ant-* rooms, Discord servers). matched_by='auto' rows are wiped and
-- regenerated on every import; 'manual' rows survive re-imports — use them to
-- fix a bad fuzzy match.
CREATE TABLE IF NOT EXISTS issue_tc.key_account_channels (
    uuid         uuid NOT NULL REFERENCES issue_tc.key_accounts(uuid) ON DELETE CASCADE,
    platform     text NOT NULL,
    workspace_id text NOT NULL,
    channel_id   text NOT NULL,
    matched_by   text NOT NULL DEFAULT 'auto',   -- auto | manual
    PRIMARY KEY (uuid, platform, workspace_id, channel_id)
);

CREATE INDEX IF NOT EXISTS key_account_channels_chan_idx
    ON issue_tc.key_account_channels (platform, workspace_id, channel_id);

SELECT 'key_accounts ready' AS ok;
