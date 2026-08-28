#!/usr/bin/env python3
"""Turn the sales-side key-account list (Company / Level / Sales / UUID, tab or
multi-space separated, as pasted from the CRM sheet) into idempotent SQL on
stdout. Pipe it into the Tencent pixdesk-pg:

    python3 scripts/key_accounts_import.py accounts.tsv \
      | ssh root@124.221.98.230 'docker exec -i pixdesk-pg psql -U synapse -d synapse'

Full-replacement semantics: accounts missing from the new list are deleted
(their channel mappings cascade). Channel fuzzy-matching runs IN SQL against
agent.channels (normalized-substring on the full name, plus the first word when
it's >=4 chars), excludes internal-* rooms, and only touches matched_by='auto'
rows — manual mappings survive every re-import.
"""
import re
import sys

# CRM 花名 → colleague. Extend when sales joins.
SALES_MAP = {"闻仲": "Peter", "罗杰斯": "junyu"}

# Account id: CRM-style UUID or the website's numeric id (e.g. 4361855174763120).
LINE_RE = re.compile(
    r"^(?P<company>.*?)\s*(?P<level>L\d+)\s*(?P<sales>\S*?)\s*"
    r"(?P<uuid>[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d{6,})\s*$",
    re.IGNORECASE)


def parse(path: str):
    rows = []
    for raw in open(path, encoding="utf-8"):
        line = raw.strip()
        if not line or line.lower().startswith("company"):
            continue
        m = LINE_RE.match(line)
        if not m:
            print(f"-- SKIPPED unparseable line: {line!r}", file=sys.stderr)
            continue
        company = m.group("company").strip().strip("\t")
        sales_cn = m.group("sales").strip()
        rows.append({
            "uuid": m.group("uuid").lower(),
            "company": company or None,
            "level": m.group("level").upper(),
            "sales_cn": sales_cn or None,
            "sales_name": SALES_MAP.get(sales_cn),
        })
    return rows


def q(v):
    if v is None:
        return "NULL"
    return "'" + str(v).replace("'", "''") + "'"


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    rows = parse(sys.argv[1])
    if not rows:
        sys.exit("no rows parsed")
    print("BEGIN;")
    for r in rows:
        print(f"INSERT INTO issue_tc.key_accounts (uuid, company, level, sales_cn, sales_name, updated_at)\n"
              f"VALUES ({q(r['uuid'])}, {q(r['company'])}, {q(r['level'])}, "
              f"{q(r['sales_cn'])}, {q(r['sales_name'])}, now())\n"
              f"ON CONFLICT (uuid) DO UPDATE SET company=EXCLUDED.company, level=EXCLUDED.level,\n"
              f"  sales_cn=EXCLUDED.sales_cn, sales_name=EXCLUDED.sales_name, updated_at=now();")
    uuids = ", ".join(q(r["uuid"]) for r in rows)
    print(f"DELETE FROM issue_tc.key_accounts WHERE uuid NOT IN ({uuids});")
    # Regenerate auto matches; manual rows untouched; ON CONFLICT keeps manual
    # winners when auto rediscovers the same pair.
    print("""DELETE FROM issue_tc.key_account_channels WHERE matched_by = 'auto';
INSERT INTO issue_tc.key_account_channels (uuid, platform, workspace_id, channel_id, matched_by)
SELECT DISTINCT ka.uuid, ch.platform, ch.workspace_id, ch.channel_id, 'auto'
FROM issue_tc.key_accounts ka
JOIN agent.channels ch
  ON ch.channel_name IS NOT NULL AND ch.channel_name <> ''
 AND ch.channel_name NOT ILIKE 'internal-%'
 AND (
   regexp_replace(lower(ch.channel_name), '[^a-z0-9]', '', 'g')
     LIKE '%' || regexp_replace(lower(ka.company), '[^a-z0-9]', '', 'g') || '%'
   OR (
     length(regexp_replace(lower(split_part(ka.company, ' ', 1)), '[^a-z0-9]', '', 'g')) >= 4
     AND regexp_replace(lower(ch.channel_name), '[^a-z0-9]', '', 'g')
       LIKE '%' || regexp_replace(lower(split_part(ka.company, ' ', 1)), '[^a-z0-9]', '', 'g') || '%'
   )
 )
WHERE ka.company IS NOT NULL
  AND length(regexp_replace(lower(ka.company), '[^a-z0-9]', '', 'g')) >= 4
ON CONFLICT (uuid, platform, workspace_id, channel_id) DO NOTHING;
COMMIT;
SELECT count(*) AS accounts FROM issue_tc.key_accounts;
SELECT count(*) AS channel_mappings FROM issue_tc.key_account_channels;
SELECT ka.company, ka.level, count(kac.channel_id) AS channels
FROM issue_tc.key_accounts ka
LEFT JOIN issue_tc.key_account_channels kac ON kac.uuid = ka.uuid
GROUP BY ka.company, ka.level ORDER BY ka.level DESC, ka.company;""")


if __name__ == "__main__":
    main()
