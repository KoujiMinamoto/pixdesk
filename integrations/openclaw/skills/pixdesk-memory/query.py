#!/usr/bin/env python3
"""PixDesk 客服记忆库查询工具（供 openclaw / feishu-claw skill 调用）。

子命令：
  search  -q "<问题描述>" [--customer "<客户名>"] [-k 8]   历史相似问题 + 当时的解法
  profile -c "<客户名>"                                     某客户的画像 + 当前未闭环
  customers [-q "<名字片段>"]                               列出已知客户（消歧用）

数据来自 pixdesk 引擎库（issue_tc schema）。默认连本机 5432，可用 PIXDESK_PG_DSN 覆盖。
"""
import argparse, json, os, sys
import psycopg2, psycopg2.extras

DSN = os.environ.get(
    "PIXDESK_PG_DSN",
    "host=127.0.0.1 port=5432 dbname=synapse user=synapse "
    "password=__SET_PIXDESK_PG_DSN__",
)
SCHEMA = os.environ.get("PIXDESK_SCHEMA", "issue_tc")

STATE = {
    "awaiting_agent": "待我方", "awaiting_customer": "等客户", "active": "进行中",
    "resolution_proposed": "已答待确认", "closed_inferred": "疑似闭环",
    "closed_confirmed": "已闭环", "reopened": "已重开", "detected": "新发现",
}


def _conn():
    return psycopg2.connect(DSN)


def _prods(v):
    if not v:
        return ""
    arr = v if isinstance(v, list) else []
    return ("，产品：" + "/".join(arr)) if arr else ""


def cmd_search(a):
    q = a.q.strip()
    # Search title + Chinese summary + English summary, so an English query
    # ("sandbox") still hits issues whose zh summary says 沙箱 (the English
    # summary / title usually carries the English term). Cross-lingual paraphrase
    # is still embeddings territory (v2); this covers the common cases.
    fields = ["i.title", "(i.metadata->>'summary_zh')", "(i.metadata->>'summary')"]
    ors = []
    for f in fields:
        ors.append(f"{f} %% %(q)s")
        ors.append(f"{f} ILIKE '%%'||%(q)s||'%%'")
    where = ["i.lifecycle_state <> 'dismissed'", "i.review_state <> 'rejected'",
             "(" + " OR ".join(ors) + ")"]
    params = {"q": q, "k": a.k}
    if a.customer:
        where.append(
            "EXISTS (SELECT 1 FROM agent.channels ch WHERE ch.platform=i.customer_platform "
            "AND ch.workspace_id=i.customer_workspace_id AND ch.channel_id=i.customer_channel_id "
            "AND (ch.channel_name ILIKE '%%'||%(cust)s||'%%' "
            "OR i.customer_workspace_id ILIKE '%%'||%(cust)s||'%%'))")
        params["cust"] = a.customer.strip()
    sql = f"""
        SELECT i.code, i.title, i.lifecycle_state, i.closure_reason,
               (i.metadata->>'summary_zh') sz, (i.metadata->'products') prods,
               i.last_activity_at,
               (SELECT ch.channel_name FROM agent.channels ch
                  WHERE ch.platform=i.customer_platform AND ch.workspace_id=i.customer_workspace_id
                    AND ch.channel_id=i.customer_channel_id LIMIT 1) cn,
               GREATEST(similarity(i.title, %(q)s),
                        similarity(COALESCE(i.metadata->>'summary_zh',''), %(q)s),
                        similarity(COALESCE(i.metadata->>'summary',''), %(q)s)) sim
        FROM {SCHEMA}.issues i
        WHERE {' AND '.join(where)}
        ORDER BY sim DESC, i.last_activity_at DESC
        LIMIT %(k)s
    """
    with _conn() as c, c.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("SET pg_trgm.similarity_threshold = 0.1")  # lenient % operator
        cur.execute(sql, params)
        rows = cur.fetchall()
    if a.json:
        print(json.dumps([dict(r, last_activity_at=str(r["last_activity_at"])) for r in rows],
                         ensure_ascii=False, default=str))
        return
    if not rows:
        print(f"（没有匹配「{q}」的历史问题）")
        return
    print(f"匹配「{q}」的历史问题（{len(rows)} 条，相似度降序）：\n")
    for r in rows:
        st = STATE.get(r["lifecycle_state"], r["lifecycle_state"])
        sol = f"  解法/结论：{r['closure_reason']}" if r.get("closure_reason") else ""
        print(f"### {r['code']} · {r.get('cn') or '?'} · {st}{_prods(r.get('prods'))}")
        print(f"  {r.get('sz') or r['title']}")
        if sol:
            print(sol)
        print()


def cmd_profile(a):
    name = a.customer.strip()
    with _conn() as c, c.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"""SELECT channel_name, profile_md, products, issue_count, updated_at,
                      platform, workspace_id, channel_id
               FROM {SCHEMA}.customer_profile
               WHERE channel_name ILIKE '%%'||%s||'%%' OR workspace_id ILIKE '%%'||%s||'%%'
               ORDER BY issue_count DESC LIMIT 1""",
            (name, name),
        )
        p = cur.fetchone()
        if not p:
            print(f"（没有找到客户「{name}」的画像；可先用 customers 查可用客户名）")
            return
        cur.execute(
            f"""SELECT code, title, lifecycle_state FROM {SCHEMA}.issues
               WHERE customer_platform=%s AND customer_workspace_id=%s AND customer_channel_id=%s
                 AND lifecycle_state NOT IN ('closed_confirmed','closed_inferred','dismissed')
                 AND review_state<>'rejected'
               ORDER BY last_activity_at DESC LIMIT 15""",
            (p["platform"], p["workspace_id"], p["channel_id"]),
        )
        opens = cur.fetchall()
    if a.json:
        print(json.dumps({"profile": dict(p, updated_at=str(p["updated_at"])),
                          "open_issues": opens}, ensure_ascii=False, default=str))
        return
    print(f"# 客户画像：{p.get('channel_name') or name}")
    print(f"（共 {p.get('issue_count')} 个历史问题，更新于 {str(p['updated_at'])[:16]}）\n")
    print(p["profile_md"])
    if opens:
        print(f"\n## 当前未闭环（{len(opens)} 个）")
        for o in opens:
            print(f"- {o['code']} [{STATE.get(o['lifecycle_state'], o['lifecycle_state'])}] {o['title']}")


def cmd_customers(a):
    where = ""
    params = []
    if a.q:
        where = "WHERE cn ILIKE '%%'||%s||'%%'"
        params = [a.q.strip()]
    sql = f"""
        SELECT cn, count(*) total,
               count(*) FILTER (WHERE lifecycle_state NOT IN
                 ('closed_confirmed','closed_inferred','dismissed')) open_n
        FROM (
          SELECT i.lifecycle_state,
                 (SELECT ch.channel_name FROM agent.channels ch
                    WHERE ch.platform=i.customer_platform AND ch.workspace_id=i.customer_workspace_id
                      AND ch.channel_id=i.customer_channel_id LIMIT 1) cn
          FROM {SCHEMA}.issues i
          WHERE i.lifecycle_state<>'dismissed' AND i.review_state<>'rejected'
            AND i.last_activity_at >= '2026-06-01'
        ) s
        WHERE cn IS NOT NULL {('AND' + where[5:]) if where else ''}
        GROUP BY cn ORDER BY open_n DESC, total DESC LIMIT 60
    """
    with _conn() as c, c.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(sql, params)
        rows = cur.fetchall()
    if a.json:
        print(json.dumps(rows, ensure_ascii=False))
        return
    print(f"已知客户（{len(rows)}，按未闭环数降序）：")
    for r in rows:
        print(f"- {r['cn']}  未闭环{r['open_n']}/共{r['total']}")


def main():
    ap = argparse.ArgumentParser(description="PixDesk 客服记忆库")
    ap.add_argument("--json", action="store_true", help="输出 JSON")
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("search"); s.add_argument("-q", required=True); s.add_argument("--customer", default=None); s.add_argument("-k", type=int, default=8); s.set_defaults(fn=cmd_search)
    pf = sub.add_parser("profile"); pf.add_argument("-c", "--customer", required=True); pf.set_defaults(fn=cmd_profile)
    cu = sub.add_parser("customers"); cu.add_argument("-q", default=None); cu.set_defaults(fn=cmd_customers)
    a = ap.parse_args()
    try:
        a.fn(a)
    except Exception as e:
        print(f"查询出错：{e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
