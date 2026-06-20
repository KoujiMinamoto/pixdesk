"""P4 validation: sample-test judge_is_problem against real backfilled issues.

Pulls N (default 30) random unreviewed issues from the publisher (read-only),
formats their transcripts the way the engine would, runs the GLM problem
filter, and reports the verdict mix. No writes — this is a dry-run BEFORE
redeploying the engine with P4 turned on.

Run via:
  ssh root@192.168.72.185 'cd /opt/beeper-matrix && \
    DATABASE_URL=postgresql://synapse:$POSTGRES_PASSWORD@127.0.0.1:5432/synapse \
    ISSUE_LLM_BACKEND=api ISSUE_LLM_BASE_URL=... ISSUE_LLM_API_KEY=... ISSUE_LLM_MODEL=... \
    python3 services/issue-engine/validate_p4.py 30'
"""
import os
import random
import sys
import time

import psycopg2
import psycopg2.extras

import detector
import llm
from config import SCHEMA

DATABASE_URL = os.environ["DATABASE_URL"]
N = int(sys.argv[1]) if len(sys.argv) > 1 else 30


def main() -> int:
    if not llm.enabled():
        print("LLM disabled — set ISSUE_LLM_BACKEND=api + creds", file=sys.stderr)
        return 1
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"""SELECT id, conversation_id, title, lifecycle_state, nonclosure_reason
               FROM {SCHEMA}.issues
               WHERE review_state = 'unreviewed'
                 AND nonclosure_reason IS NOT NULL
                 AND lifecycle_state IN ('awaiting_agent','active','awaiting_customer','detected')
               ORDER BY random()
               LIMIT %s""",
            (N,),
        )
        issues = cur.fetchall()
    if not issues:
        print("no unreviewed issues to sample"); return 0

    counts = {"real_problem": 0, "not_a_problem": 0, "uncertain": 0, "error": 0}
    cost_tokens = 0
    print(f"sampling {len(issues)} issues...\n")
    for i, it in enumerate(issues, 1):
        turns = detector.fetch_conversation_messages(conn, str(it["conversation_id"]))
        # Filter to just this issue's segment is non-trivial; use the conversation
        # transcript trimmed to first ~2000 chars, which is what the engine sends.
        transcript = detector._format_transcript(turns)
        if not transcript:
            counts["error"] += 1
            continue
        out = llm.judge_is_problem(transcript)
        v = out.get("verdict", "uncertain")
        counts[v] = counts.get(v, 0) + 1
        cost_tokens += int(out.get("prompt_tokens", 0)) + int(out.get("completion_tokens", 0))
        title = (it.get("title") or "(no title)")[:50]
        print(f"  [{i:2d}] {v:13s}  {it['lifecycle_state']:18s}  {title!r}")
        time.sleep(0.1)  # pacing

    total = sum(counts.values())
    print("\n=== summary ===")
    for k, v in counts.items():
        pct = 100.0 * v / total if total else 0
        print(f"  {k:14s}: {v:3d}  ({pct:.0f}%)")
    print(f"  total tokens used: {cost_tokens}")
    if counts.get("not_a_problem", 0) >= total * 0.3:
        print("\nP4 looks promising — would dismiss "
              f"~{counts['not_a_problem']}/{total} of these noisy flags.")
    elif counts.get("not_a_problem", 0) >= total * 0.1:
        print("\nP4 helps modestly — some real noise filtered, more tuning needed.")
    else:
        print("\nP4 doesn't filter much. Heuristic + LLM may both be wrong; "
              "investigate segmentation or prompts before redeploying.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
