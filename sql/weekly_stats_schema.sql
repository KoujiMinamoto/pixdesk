-- Weekly summary metrics, computed on a schedule (Thu 15:00 Asia/Shanghai).
-- Additive migration (2026-07-09). Idempotent. Applied to the writable tenant
-- schema (issue_tc on Tencent). Deploy:
--   sed 's/__SCHEMA__/issue_tc/g' sql/weekly_stats_schema.sql \
--     | docker exec -i pixdesk-pg psql -U synapse -d synapse -v ON_ERROR_STOP=1
--
-- One row per (window, metric). value NULL = NA (e.g. penetration_rate is a
-- placeholder until its formula is defined). Recomputing the same window+metric
-- overwrites via the UNIQUE key. Kept generic so future metrics (穿透率, 纠错数)
-- are just new metric rows — no schema change.
CREATE TABLE IF NOT EXISTS __SCHEMA__.weekly_stats (
    id          bigserial PRIMARY KEY,
    win_start   timestamptz NOT NULL,
    win_end     timestamptz NOT NULL,
    metric      text NOT NULL,   -- 'first_response_p50_minutes' | 'penetration_rate' | ...
    value       numeric,          -- NULL = NA
    sample_n    integer,          -- sample size behind the metric (e.g. #first-responses)
    detail      jsonb NOT NULL DEFAULT '{}',
    computed_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (win_start, win_end, metric)
);
CREATE INDEX IF NOT EXISTS weekly_stats_metric_time
  ON __SCHEMA__.weekly_stats (metric, win_end DESC);

SELECT 'weekly_stats schema ready' ok;
