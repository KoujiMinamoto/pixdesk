# openclaw integration — pixdesk-memory skill

Bridges the **pixdesk Closed-Loop Engine** (the issue/summary/profile knowledge it
distills) into the existing **openclaw** agent platform on the Tencent host, so the
already-running Feishu bot (`feishu-claw`) can answer from customer history instead
of cold.

openclaw is a separate self-hosted multi-channel agent runtime (`feishu` / telegram /
wecom / qq / dingtalk) living at `/root/.openclaw` on the Tencent box. We do **not**
fork it — we drop in one skill.

## What it gives the bot
- **复现历史解法** — `search`: trigram candidate retrieval over issue title + zh/en
  summary (cross-language via the English summary field), ranked by similarity. The
  agent's own LLM judges relevance and reuses the past solution.
- **客户画像记忆** — `profile`: the per-customer rolling profile (products / scale /
  recurring problems / demands / sensitivities) + current open issues.
- **消歧** — `customers`: list known customers.

This is the **v1, embedding-free** design — no API embedding source was available
(ppio out of budget, paigod is chat-only). Semantic vector recall (zh↔en paraphrase)
is the clean v2: add a vector column + cosine, the skill interface stays the same.

## Pieces
- `skills/pixdesk-memory/SKILL.md` + `query.py` — deployed to
  `/root/.openclaw/workspace-feishu/skills/pixdesk-memory/` (feishu-claw's workspace;
  skills are auto-discovered by folder).
- `../../sql/memory_schema.sql` — `pg_trgm` + `issue_tc.customer_profile` + trigram
  indexes (run against the pixdesk Postgres).
- Writer side lives in the engine: `distill.refresh_customer_profile()` keeps each
  active channel's profile fresh (throttled to once / 12h), wired into the distill
  loop in `services/issue-engine/main.py`.

## Deploy
1. `psql < sql/memory_schema.sql` on the pixdesk Postgres.
2. Backfill profiles once (one-pass `llm._ask` over each channel's issues).
3. Copy `skills/pixdesk-memory/` into `/root/.openclaw/workspace-feishu/skills/`.
4. Set the DB DSN: the deployed `query.py` reads `PIXDESK_PG_DSN`
   (`host=127.0.0.1 port=5432 dbname=synapse user=synapse password=…`). The repo copy
   ships a `__SET_PIXDESK_PG_DSN__` placeholder — never commit the real password.
