-- Member-admin page: independent write-permission flag on dashboard users.
-- Additive migration (2026-07-13). Idempotent. Deploy:
--   docker exec -i pixdesk-pg psql -U synapse -d synapse -v ON_ERROR_STOP=1 < this
--
-- can_write decouples "who may mutate issue state" (确认闭环/非闭环/升级SRE/
-- merge/promote) from the duty-roster nickname mapping. roster_identity keeps
-- its rows but now ONLY drives settlement attribution (whose issues the 下班结算
-- window lists) — it no longer implies write permission.
ALTER TABLE issue_tc.dashboard_users
  ADD COLUMN IF NOT EXISTS can_write boolean NOT NULL DEFAULT false;

-- Backfill: everyone currently deriving write permission from the roster keeps
-- it, so the switchover is seamless for the 5 on-duty colleagues.
UPDATE issue_tc.dashboard_users d SET can_write = true
 WHERE can_write = false
   AND EXISTS (SELECT 1 FROM issue_tc.roster_identity ri
               WHERE ri.feishu_user_id = d.feishu_user_id);

SELECT 'member admin schema ready' ok;
