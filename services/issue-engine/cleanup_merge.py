"""One-shot parallel cleanup-merger.

The detector's per-conversation merge loop is single-threaded and gates on the
30-second tick cadence, so chewing through ~1000 mergeable pairs takes hours.
This script does the same work offline with a small thread pool of GLM calls,
clearing the post-backfill backlog in minutes.

What it does:
  1. List all conversations with >=2 unreviewed open issues.
  2. For each, walk adjacent pairs (opened_at order, within MERGE_WINDOW_DAYS).
  3. Fire judge_same_problem in parallel via N workers.
  4. Apply each SAME merge in a single short transaction (same logic as
     detector._do_merge), with the system actor.

Idempotent: pairs already judged in issue_signals are skipped.
Read-only safety guard removed deliberately — this DOES write.

Run via:
  ssh root@192.168.72.185 'docker exec -i beeper-matrix-pixdesk-issue-engine-1 \
     python3 /app/cleanup_merge.py 8 600'
where 8 = workers, 600 = max merges before exiting.
"""
from __future__ import annotations

import os
import sys
import threading
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional

import psycopg2
import psycopg2.extras

import config
import detector
import llm

DATABASE_URL = os.environ["DATABASE_URL"]
WORKERS = int(sys.argv[1]) if len(sys.argv) > 1 else 8
MAX_MERGES = int(sys.argv[2]) if len(sys.argv) > 2 else 1000

# Per-thread connections so writes don't serialize on a single conn.
_thread_local = threading.local()


def conn():
    if not hasattr(_thread_local, "c"):
        c = psycopg2.connect(DATABASE_URL)
        c.autocommit = False
        _thread_local.c = c
    return _thread_local.c


def list_pairs() -> list[tuple[str, dict, dict]]:
    """Snapshot of (conv_id, src_issue, dst_issue) tuples for adjacent pairs
    within the merge window. Built ONCE up front; chained merges (A->B->C)
    will leave some pairs invalid by the time they're processed — those skip
    cleanly thanks to the same-judged + lifecycle guards in _do_merge."""
    c = psycopg2.connect(DATABASE_URL)
    c.autocommit = True
    with c.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """SELECT id, conversation_id, opened_at, title
               FROM issue.issues
               WHERE review_state = 'unreviewed'
                 AND lifecycle_state NOT IN ('closed_confirmed','dismissed')
               ORDER BY conversation_id, opened_at"""
        )
        rows = cur.fetchall()
    by_conv: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        by_conv[str(r["conversation_id"])].append(r)
    pairs = []
    for cid, group in by_conv.items():
        for a, b in zip(group, group[1:]):
            if not (a["opened_at"] and b["opened_at"]):
                continue
            gap = (b["opened_at"] - a["opened_at"]).total_seconds() / 86400
            if gap > config.MERGE_WINDOW_DAYS:
                continue
            pairs.append((cid, a, b))
    c.close()
    return pairs


_merge_count = 0
_count_lock = threading.Lock()


def process_pair(pair) -> tuple[str, str]:
    """Returns (verdict, src_id). Performs the merge if SAME."""
    global _merge_count
    cid, a, b = pair
    src_id = str(b["id"])
    dst_id = str(a["id"])
    c = conn()
    try:
        with c.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Skip if already judged.
            cur.execute(
                """SELECT 1 FROM issue.issue_signals
                   WHERE issue_id = %s AND evaluator = %s LIMIT 1""",
                (src_id, f"llm-merge:{dst_id}"),
            )
            if cur.fetchone():
                c.rollback()
                return "skipped_already_judged", src_id
            # Refresh lifecycle/review_state — chained merges may have killed
            # this pair already.
            cur.execute(
                """SELECT id, lifecycle_state, review_state FROM issue.issues
                   WHERE id IN (%s, %s)""",
                (src_id, dst_id),
            )
            states = {str(r["id"]): r for r in cur.fetchall()}
            for iid in (src_id, dst_id):
                s = states.get(iid)
                if not s or s["review_state"] != "unreviewed" \
                        or s["lifecycle_state"] in ("closed_confirmed", "dismissed"):
                    c.rollback()
                    return "skipped_state_changed", src_id

            ta = detector._issue_transcript(c, src_id)
            tb = detector._issue_transcript(c, dst_id)
        if not ta or not tb:
            c.rollback()
            return "skipped_no_transcript", src_id

        out = llm.judge_same_problem(tb, ta)  # dst first, src second (consistent with detector)
        verdict = out.get("verdict", "uncertain")

        with c.cursor() as cur:
            detector._record_signal(cur, src_id, f"llm-merge:{dst_id}", out,
                                    score=1.0 if verdict == "same_problem" else 0.0)
            if verdict == "same_problem":
                detector._do_merge(cur, src_id, dst_id)
                with _count_lock:
                    _merge_count += 1
        c.commit()
        return verdict, src_id
    except Exception as exc:
        c.rollback()
        return f"error:{type(exc).__name__}", src_id


def main() -> int:
    if not llm.enabled():
        print("LLM disabled — set ISSUE_LLM_BACKEND=api + creds", file=sys.stderr)
        return 1
    pairs = list_pairs()
    print(f"candidate pairs: {len(pairs)}  workers: {WORKERS}  max_merges: {MAX_MERGES}\n")
    counts = defaultdict(int)
    completed = 0
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futures = [ex.submit(process_pair, p) for p in pairs]
        for fut in as_completed(futures):
            verdict, _src = fut.result()
            counts[verdict] += 1
            completed += 1
            if completed % 25 == 0:
                with _count_lock:
                    mc = _merge_count
                print(f"  [{completed:4d}/{len(pairs)}]  merges={mc}  "
                      f"same={counts['same_problem']} diff={counts['different']} "
                      f"unc={counts['uncertain']} skip={counts['skipped_already_judged']+counts['skipped_state_changed']+counts['skipped_no_transcript']} "
                      f"err={sum(v for k,v in counts.items() if k.startswith('error:'))}")
            with _count_lock:
                if _merge_count >= MAX_MERGES:
                    print(f"hit MAX_MERGES={MAX_MERGES}, stopping")
                    break
    print(f"\nfinal verdicts: {dict(counts)}")
    print(f"merges performed: {_merge_count}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
