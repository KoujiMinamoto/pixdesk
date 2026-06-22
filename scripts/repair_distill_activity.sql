-- Recompute last_activity_at / opened_at / last_speaker / last_customer_at /
-- last_agent_at for all glm-distill issues from their evidence messages.
-- Role inference uses a behavioral signal: a sender appearing in >=3 distinct
-- customer channels is Novita staff (agent); customers live in one channel.
-- Bots filtered by name.

CREATE TEMP TABLE staff_senders AS
SELECT sender_name
FROM agent.messages m
JOIN agent.channels ch USING (platform, workspace_id, channel_id)
WHERE (ch.channel_name ILIKE 'ext-%' OR ch.channel_name ILIKE '%novita%' OR ch.channel_name ILIKE '%<>%')
  AND sender_name IS NOT NULL AND sender_name <> ''
GROUP BY sender_name
HAVING count(DISTINCT channel_id) >= 3;

WITH ev AS (
  SELECT im.issue_id,
         am.ts,
         CASE
           WHEN lower(coalesce(am.sender_name,'')) LIKE '%bot%' THEN 'bot'
           WHEN am.sender_id ~ '^B' AND length(am.sender_id) >= 6 THEN 'bot'
           WHEN am.sender_name IN (SELECT sender_name FROM staff_senders) THEN 'agent'
           ELSE 'customer'
         END AS role
  FROM issue_tc.issue_messages im
  JOIN issue_tc.issues i ON i.id = im.issue_id
  JOIN agent.messages am ON am.platform=im.platform AND am.workspace_id=im.workspace_id
                        AND am.channel_id=im.channel_id AND am.message_id=im.message_id
  WHERE i.detector = 'glm-distill' AND am.ts IS NOT NULL
),
agg AS (
  SELECT issue_id,
         min(ts) AS opened_at,
         max(ts) AS last_activity_at,
         max(ts) FILTER (WHERE role='customer') AS last_customer_at,
         max(ts) FILTER (WHERE role='agent') AS last_agent_at,
         (array_agg(role ORDER BY ts DESC) FILTER (WHERE role IN ('customer','agent')))[1] AS last_speaker
  FROM ev GROUP BY issue_id
)
UPDATE issue_tc.issues i SET
  opened_at = COALESCE(agg.opened_at, i.opened_at),
  last_activity_at = COALESCE(agg.last_activity_at, i.last_activity_at),
  last_customer_at = agg.last_customer_at,
  last_agent_at = agg.last_agent_at,
  last_speaker = agg.last_speaker,
  -- recompute open-state nonclosure: agent-last = awaiting_customer (no flag);
  -- customer-last = awaiting_agent (unanswered). Only touch still-open issues.
  lifecycle_state = CASE
    WHEN i.lifecycle_state IN ('awaiting_agent','awaiting_customer','active')
      THEN (CASE WHEN agg.last_speaker='agent' THEN 'awaiting_customer' ELSE 'awaiting_agent' END)
    ELSE i.lifecycle_state END,
  nonclosure_reason = CASE
    WHEN i.lifecycle_state IN ('awaiting_agent','awaiting_customer','active')
      THEN (CASE WHEN agg.last_speaker='agent' THEN NULL ELSE 'unanswered_customer' END)
    ELSE i.nonclosure_reason END
FROM agg
WHERE i.id = agg.issue_id;

SELECT count(*) AS distilled,
       count(*) FILTER (WHERE last_speaker='customer') AS last_customer,
       count(*) FILTER (WHERE last_speaker='agent') AS last_agent,
       count(*) FILTER (WHERE last_speaker IS NULL) AS no_speaker,
       count(*) FILTER (WHERE lifecycle_state='awaiting_agent') AS awaiting_agent,
       count(*) FILTER (WHERE lifecycle_state='awaiting_customer') AS awaiting_customer
FROM issue_tc.issues WHERE detector='glm-distill';
