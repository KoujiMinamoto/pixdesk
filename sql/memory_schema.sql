CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Per-customer rolling profile (画像记忆): one row per channel.
CREATE TABLE IF NOT EXISTS issue_tc.customer_profile (
    platform        text NOT NULL,
    workspace_id    text NOT NULL,
    channel_id      text NOT NULL,
    channel_name    text,
    profile_md      text NOT NULL DEFAULT '',
    products        text[] DEFAULT '{}',
    issue_count     int DEFAULT 0,
    updated_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (platform, workspace_id, channel_id)
);

-- Trigram candidate retrieval over issue title + Chinese summary (复现历史解法).
CREATE INDEX IF NOT EXISTS issues_title_trgm
    ON issue_tc.issues USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS issues_summaryzh_trgm
    ON issue_tc.issues USING gin ((metadata->>'summary_zh') gin_trgm_ops);

SELECT 'pg_trgm' AS ext, extversion FROM pg_extension WHERE extname='pg_trgm';
\d issue_tc.customer_profile
