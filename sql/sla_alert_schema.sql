-- Proactive-alert dedup log. One row per (issue, alert_type); sent_at is the
-- last time we pushed this alert, so the cooldown check is now()-sent_at.
CREATE TABLE IF NOT EXISTS issue_tc.sla_alert_log (
    issue_id     text NOT NULL,
    alert_type   text NOT NULL,              -- 'sla' | 'handoff' (future)
    sent_at      timestamptz NOT NULL DEFAULT now(),
    on_duty      text,                        -- roster person at send time
    wait_minutes int,
    PRIMARY KEY (issue_id, alert_type)
);
CREATE INDEX IF NOT EXISTS sla_alert_log_sent ON issue_tc.sla_alert_log (alert_type, sent_at);
SELECT 'sla_alert_log ready' ok;
