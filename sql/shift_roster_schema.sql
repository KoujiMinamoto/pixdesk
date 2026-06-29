-- Duty roster expanded into absolute on-duty intervals (Asia/Shanghai -> UTC).
-- Populate with: python3 scripts/roster_expand.py --sql | psql ... (regenerate
-- when the 排班表/轮班表 changes). support is a shared login, so this table is
-- how per-colleague workload is attributed (join messages.ts into [start,end)).
CREATE TABLE IF NOT EXISTS agent.shift_roster (
    start_ts     timestamptz NOT NULL,
    end_ts       timestamptz NOT NULL,
    person       text NOT NULL,
    shift_letter text,
    shift_name   text,
    duty_date    date,
    PRIMARY KEY (start_ts, person)
);
CREATE INDEX IF NOT EXISTS shift_roster_range ON agent.shift_roster (start_ts, end_ts);
