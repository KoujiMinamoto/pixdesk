-- Proactive-alert dedup log. One row per (issue, alert_type); sent_at is the
-- last time we pushed this alert, so the cooldown check is now()-sent_at.
CREATE TABLE IF NOT EXISTS issue_tc.sla_alert_log (
    issue_id     uuid NOT NULL,               -- matches issue_tc.issues.id (uuid)
    alert_type   text NOT NULL,              -- 'sla' (per-issue realtime alert)
    sent_at      timestamptz NOT NULL DEFAULT now(),
    on_duty      text,                        -- roster person at send time
    wait_minutes int,
    PRIMARY KEY (issue_id, alert_type)
);
CREATE INDEX IF NOT EXISTS sla_alert_log_sent ON issue_tc.sla_alert_log (alert_type, sent_at);

-- Shift-handoff digest dedup. One digest per shift = one row per
-- (shift_start, incoming person), so a shift never gets two handover cards.
CREATE TABLE IF NOT EXISTS issue_tc.handoff_log (
    shift_start  timestamptz NOT NULL,
    person       text NOT NULL,
    sent_at      timestamptz NOT NULL DEFAULT now(),
    issue_count  int,
    PRIMARY KEY (shift_start, person)
);
SELECT 'sla_alert_log + handoff_log ready' ok;
