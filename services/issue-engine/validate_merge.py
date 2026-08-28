"""P4 merge dry-run: how many of the over-segmented issues are actually the
same underlying problem?

Walks each conversation that has >=2 unreviewed open issues, takes adjacent
pairs ordered by opened_at within MERGE_WINDOW_DAYS, formats minimal
transcripts from issue_messages, asks GLM judge_same_problem, and reports:
  * total candidate pairs
  * verdict mix (same_problem / different / uncertain)
  * expected post-merge issue count assuming SAME pairs collapse
This is READ-ONLY — no DB writes. Run before flipping the engine to merge mode.

Run via:
  ssh root@192.168.72.185 'docker exec -i beeper-matrix-pixdesk-issue-engine-1 \
    python3 /app/validate_merge.py 200'
where 200 caps total LLM calls.
"""
from __future__ import annotations

import os
import sys
import time
from collections import defaultdict
from typing import Optional

import psycopg2
import psycopg2.extras

import detector
import llm
from config import SCHEMA

DATABASE_URL = os.environ["DATABASE_URL"]
MAX_CALLS = int(sys.argv[1]) if len(sys.argv) > 1 else 100
MERGE_WINDOW_DAYS = float(os.environ.get("VALIDATE_MERGE_WINDOW_DAYS", "30"))


def _issue_transcript(conn, issue_id: str, *, max_chars: int = 1200) -> str:
    f"""Mini transcript from this issue's evidence messages only (the rows the
    detector pinned to {SCHEMA}.issue_messages). Falls back to title if there is
    no evidence (issue from a reply-only segment, etc.)."""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"""SELECT m.platform, m.workspace_id, m.channel_id, m.message_id,
                      im.role, am.text, am.ts
               FROM {SCHEMA}.issue_messages im
               JOIN {SCHEMA}.issues i ON i.id = im.issue_id
               LEFT JOIN agent.messages am
                 ON am.platform = im.platform AND am.workspace_id = im.workspace_id
                AND am.channel_id = im.channel_id AND am.message_id = im.message_id
               JOIN {SCHEMA}.issue_messages m
                 ON m.issue_id = im.issue_id AND m.platform = im.platform
                AND m.workspace_id = im.workspace_id AND m.channel_id = im.channel_id
                AND m.message_id = im.message_id
               WHERE im.issue_id = %s
               ORDER BY am.ts NULLS LAST
               LIMIT 50""",
            (issue_id,),
        )
        rows = cur.fetchall()
    if not rows:
        return ""
    lines = []
    for r in rows:
        text = (r.get("text") or "").replace("\n", " ").strip()
        if not text:
            continue
        lines.append(f"[{r.get('role') or '?'}] {text}")
    full = "\n".join(lines)
    return full if len(full) <= max_chars else (
        full[: int(max_chars * 0.6)] + "\n... [truncated] ...\n" + full[-int(max_chars * 0.4):]
    )


def main() -> int:
    if not llm.enabled():
        print("LLM disabled — set ISSUE_LLM_BACKEND=api + creds", file=sys.stderr)
        return 1
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"""SELECT id, conversation_id, title, opened_at, lifecycle_state,
                      customer_workspace_id, customer_platform
               FROM {SCHEMA}.issues
               WHERE review_state = 'unreviewed'
                 AND lifecycle_state NOT IN ('closed_confirmed','dismissed')
               ORDER BY conversation_id, opened_at"""
        )
        issues = cur.fetchall()

    by_conv: dict[str, list[dict]] = defaultdict(list)
    for it in issues:
        by_conv[str(it["conversation_id"])].append(it)

    convs_with_pairs = sum(1 for v in by_conv.values() if len(v) >= 2)
    print(f"total open unreviewed issues: {len(issues)}  in {len(by_conv)} conversations")
    print(f"conversations with >=2 issues (mergeable candidates): {convs_with_pairs}")
    print(f"merge window: {MERGE_WINDOW_DAYS} days   call cap: {MAX_CALLS}\n")

    counts = {"same_problem": 0, "different": 0, "uncertain": 0}
    tokens_total = 0
    calls = 0
    same_pairs: list[tuple[str, str, str]] = []   # (conv_id, issue_a, issue_b)
    pairs_seen = 0

    for conv_id, group in by_conv.items():
        if len(group) < 2 or calls >= MAX_CALLS:
            continue
        # Adjacent pairs in opened_at order, within MERGE_WINDOW_DAYS.
        for a, b in zip(group, group[1:]):
            if calls >= MAX_CALLS:
                break
            if not (a["opened_at"] and b["opened_at"]):
                continue
            gap_days = (b["opened_at"] - a["opened_at"]).total_seconds() / 86400
            if gap_days > MERGE_WINDOW_DAYS:
                continue
            ta = _issue_transcript(conn, str(a["id"]))
            tb = _issue_transcript(conn, str(b["id"]))
            if not ta or not tb:
                continue
            pairs_seen += 1
            out = llm.judge_same_problem(ta, tb)
            v = out.get("verdict", "uncertain")
            counts[v] = counts.get(v, 0) + 1
            tokens_total += int(out.get("prompt_tokens", 0)) + int(out.get("completion_tokens", 0))
            calls += 1
            label = (a.get("title") or "")[:30]
            label_b = (b.get("title") or "")[:30]
            print(f"  [{calls:3d}] {v:13s} gap={gap_days:5.1f}d  "
                  f"{label!r:35s} <-> {label_b!r}")
            if v == "same_problem":
                same_pairs.append((conv_id, str(a["id"]), str(b["id"])))
            time.sleep(0.05)  # tiny pacing

    total_decided = counts["same_problem"] + counts["different"]
    print(f"\n=== summary (out of {pairs_seen} pairs evaluated, {calls} LLM calls) ===")
    for k, v in counts.items():
        pct = 100.0 * v / max(1, calls)
        print(f"  {k:14s}: {v:4d}  ({pct:.0f}%)")
    print(f"  total tokens used: {tokens_total}")
    if calls and counts["same_problem"]:
        # Estimate post-merge count: each SAME pair collapses two issues into one.
        # This is a lower bound — chains of merges (A==B, B==C) collapse further.
        approx_collapsed = counts["same_problem"]
        print(f"\n  expected reduction: at least ~{approx_collapsed} issues collapse "
              f"({len(issues)} -> ~{len(issues) - approx_collapsed})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
