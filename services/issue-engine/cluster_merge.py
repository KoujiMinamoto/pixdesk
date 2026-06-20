"""Cluster-merge tool: collapse near-duplicate issues per channel.

distill is window-by-window — each window doesn't see the previous windows'
issue list verbatim, so it sometimes emits two near-identical issues for the
same underlying problem (e.g. "Low cache hit rate on DeepSeek v3.2" and
"Low cache hit rate on Novita DeepSeek v3.2 vs direct DeepSeek API"). After
distill we run this to ask Sonnet "look at all these titles+summaries, group
the duplicates" and merge each cluster into its first issue.

Usage:
  python3 cluster_merge.py <channel_substring>          # DRY-RUN
  python3 cluster_merge.py <channel_substring> --apply  # write merges

Reads from $ISSUE_SCHEMA (default issue or issue_tc), restricts to issues
active since ISSUE_DASHBOARD_TIME_FLOOR. Idempotent: already-merged issues
are excluded, so repeat runs only catch newly-spawned duplicates.
"""
from __future__ import annotations

import json
import os
import re
import sys
from typing import Any

import psycopg2
import psycopg2.extras

import config
import llm
from config import SCHEMA, TIME_FLOOR

DATABASE_URL = os.environ["DATABASE_URL"]
SYSTEM_ACTOR = config.SYSTEM_ACTOR
DRY_RUN = "--apply" not in sys.argv
ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]

SYSTEM_PROMPT = (
    "You receive a JSON list of customer-support issue records (id, title, "
    "summary, status). Group issues that are tracking the SAME underlying "
    "problem into clusters. Two issues are the same problem when they describe "
    "the same root request, the same bug/incident, or the same continuing "
    "thread between the same parties. Different aspects of the same broad "
    "topic (e.g. cache hit rate vs latency) are DIFFERENT problems unless the "
    "summaries clearly indicate they were treated as one ticket.\n\n"
    "Bias toward LEAVING ALONE — only cluster issues you are confident describe "
    "the SAME problem. A wrong merge hides distinct work; a missed merge just "
    "leaves a duplicate visible.\n\n"
    "Output COMPACT JSON only — keep titles short (<=60 chars). DO NOT include "
    "summary fields in the output. Schema:\n"
    "{\"clusters\":[{\"title\":\"<unified short title>\","
    "\"issue_ids\":[\"<id>\",\"<id>\",...]}]}\n"
    "Include ONLY clusters with 2+ issue_ids. Issues with no duplicate MUST "
    "NOT appear. Use the exact UUID strings from input."
)


def find_channel(conn, key: str) -> dict | None:
    """Pick the channel matching `key` that has the MOST open issues since the
    time floor. agent.channels has duplicate rows when a Discord DM dcid
    rotates; without this preference the older empty row gets picked and
    we report `nothing to cluster` even though the active row has work."""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"""SELECT ch.platform, ch.workspace_id, ch.channel_id, ch.channel_name,
                       (SELECT count(*) FROM {SCHEMA}.issues i
                        WHERE i.customer_platform=ch.platform
                          AND i.customer_workspace_id=ch.workspace_id
                          AND i.customer_channel_id=ch.channel_id
                          AND i.review_state <> 'rejected'
                          AND i.lifecycle_state <> 'dismissed') AS issue_count
               FROM agent.channels ch
               WHERE ch.channel_name ILIKE %s
               ORDER BY issue_count DESC, ch.channel_name LIMIT 1""",
            (f"%{key}%",),
        )
        return cur.fetchone()


def fetch_open_issues(conn, channel: dict) -> list[dict]:
    floor = f"AND last_activity_at >= '{TIME_FLOOR}'" if TIME_FLOOR else ""
    sql = (
        f"SELECT id::text AS id, code, title, "
        f"  COALESCE(metadata->>'summary','') AS summary, "
        f"  lifecycle_state, last_activity_at "
        f"FROM {SCHEMA}.issues "
        f"WHERE customer_platform=%s AND customer_workspace_id=%s "
        f"  AND customer_channel_id=%s "
        f"  AND review_state <> 'rejected' "
        f"  AND lifecycle_state <> 'dismissed' "
        f"  {floor} "
        f"ORDER BY last_activity_at DESC"
    )
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(sql, (channel["platform"], channel["workspace_id"],
                          channel["channel_id"]))
        return [dict(r) for r in cur.fetchall()]


def call_clusterer(issues: list[dict]) -> list[dict]:
    payload = [
        {"id": it["id"], "title": it["title"][:200],
         "summary": it.get("summary", "")[:600],
         "status": it["lifecycle_state"]}
        for it in issues
    ]
    user = "issues = " + json.dumps(payload, ensure_ascii=False)
    out = llm._ask(SYSTEM_PROMPT, user, max_tokens=32768, timeout=900)
    if out.get("verdict") == "uncertain":
        print(f"  LLM call failed: {out.get('reason')}")
        return []
    raw = (out.get("raw") or "").strip()
    print(f"  raw len: {len(raw)} chars  prompt_tokens={out.get('prompt_tokens')} "
          f"completion_tokens={out.get('completion_tokens')}")
    # save raw to /tmp for inspection if parse fails
    try:
        with open("/tmp/cluster_merge_last_raw.txt", "w") as f:
            f.write(raw)
    except Exception:
        pass
    if raw.startswith("```"):
        raw = raw.split("```", 2)[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.rsplit("```", 1)[0].strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        m = re.search(r"\{[\s\S]*\}", raw)
        if not m:
            print(f"  bad JSON: {raw[:300]}")
            return []
        data = json.loads(m.group(0))
    clusters = data.get("clusters", []) if isinstance(data, dict) else []
    valid_ids = {it["id"] for it in issues}
    cleaned = []
    for c in clusters:
        ids = [i for i in (c.get("issue_ids") or []) if i in valid_ids]
        if len(ids) < 2:
            continue
        cleaned.append({"title": (c.get("title") or "").strip()[:120],
                        "issue_ids": ids})
    return cleaned


def apply_merges(conn, channel: dict, clusters: list[dict]) -> int:
    """Apply: first id is survivor; others get merged into it."""
    merged = 0
    for cl in clusters:
        survivor, *src_ids = cl["issue_ids"]
        with conn.cursor() as cur:
            for src in src_ids:
                # repoint evidence (skip dupes)
                cur.execute(
                    f"""UPDATE {SCHEMA}.issue_messages m
                       SET issue_id = %s
                       WHERE m.issue_id = %s
                         AND NOT EXISTS (
                           SELECT 1 FROM {SCHEMA}.issue_messages t
                           WHERE t.issue_id = %s AND t.platform = m.platform
                             AND t.workspace_id = m.workspace_id
                             AND t.channel_id = m.channel_id
                             AND t.message_id = m.message_id)""",
                    (survivor, src, survivor),
                )
                cur.execute(
                    f"""UPDATE {SCHEMA}.issues
                       SET review_state='merged', lifecycle_state='dismissed',
                           merged_into_issue_id=%s, nonclosure_reason=NULL,
                           reviewed_by_mxid=%s, reviewed_at=now(), closed_at=now()
                       WHERE id=%s""",
                    (survivor, SYSTEM_ACTOR, src),
                )
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.merge_links
                          (kept_issue_id, merged_issue_id, actor_mxid)
                        VALUES (%s, %s, %s)""",
                    (survivor, src, SYSTEM_ACTOR),
                )
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.issue_history
                          (issue_id, field, new_value, actor_mxid)
                        VALUES (%s, 'merged', %s, %s),
                               (%s, 'merged_from', %s, %s)""",
                    (src, psycopg2.extras.Json({"into": survivor, "by": "cluster_merge"}),
                     SYSTEM_ACTOR,
                     survivor, psycopg2.extras.Json({"from": src, "by": "cluster_merge"}),
                     SYSTEM_ACTOR),
                )
                merged += 1
            # update survivor with the unified title
            cur.execute(
                f"""UPDATE {SCHEMA}.issues
                   SET title = %s,
                       metadata = metadata || %s
                   WHERE id = %s""",
                (cl["title"], psycopg2.extras.Json({"cluster_merged": True}),
                 survivor),
            )
        conn.commit()
    return merged


def main() -> int:
    if not ARGS:
        print(__doc__, file=sys.stderr)
        return 2
    if not llm.enabled():
        print("LLM not enabled — set ISSUE_LLM_BACKEND=api + creds", file=sys.stderr)
        return 1
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False

    channel = find_channel(conn, ARGS[0])
    if not channel:
        print(f"no channel matching {ARGS[0]!r}", file=sys.stderr)
        return 2
    print(f"channel: {channel['channel_name']}  "
          f"({channel['platform']}/{channel['channel_id']})")
    print(f"  schema: {SCHEMA}  time floor: {TIME_FLOOR}  "
          f"mode: {'DRY-RUN' if DRY_RUN else 'APPLY'}")

    issues = fetch_open_issues(conn, channel)
    print(f"  open issues since floor: {len(issues)}")
    if len(issues) < 2:
        print("  nothing to cluster")
        return 0

    print(f"  asking Sonnet to cluster…")
    clusters = call_clusterer(issues)
    if not clusters:
        print("  no clusters returned")
        return 0

    total_merge_targets = sum(len(c["issue_ids"]) - 1 for c in clusters)
    print(f"\n=== {len(clusters)} clusters, {total_merge_targets} issues to merge ===\n")
    by_id = {it["id"]: it for it in issues}
    for i, c in enumerate(clusters, 1):
        print(f"[{i}] {c['title']}")
        print(f"    survivor: {by_id.get(c['issue_ids'][0], {}).get('code', '?')} "
              f"{by_id.get(c['issue_ids'][0], {}).get('title', '')[:60]}")
        for src in c["issue_ids"][1:]:
            it = by_id.get(src, {})
            print(f"    +merge:   {it.get('code', '?')} {it.get('title', '')[:60]}")

    if DRY_RUN:
        print("\nDRY-RUN — no changes. Re-run with --apply to commit.")
        return 0

    n = apply_merges(conn, channel, clusters)
    print(f"\nAPPLIED: {n} merges across {len(clusters)} clusters")
    return 0


if __name__ == "__main__":
    sys.exit(main())
