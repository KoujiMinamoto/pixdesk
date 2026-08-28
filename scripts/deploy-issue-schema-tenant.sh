#!/usr/bin/env bash
# Deploy issue.* schema to a STANDALONE Postgres (no logical replication).
# Used to set up the Tencent tenant schema (issue_tc) on the same pixdesk-pg
# container that hosts the read-only agent.* mirror. The two schemas coexist:
#   - issue.*    (subscriber-replicated from publisher's issue.* — read-only here)
#   - issue_tc.* (this script — fully writable; the engine running on Tencent
#                 owns this schema)
# We rename via in-place sed of the publisher's sql/issue_schema.sql, then pipe
# into psql. Every "issue." reference (incl. CREATE SCHEMA, CREATE FUNCTION,
# triggers, FKs, sequences) becomes "<SCHEMA>." so a single template renders
# both sides.
#
# Run examples:
#   SCHEMA=issue_tc PG_CONTAINER=pixdesk-pg ./deploy-issue-schema-tenant.sh
#   (Tencent, default; runs locally — must be executed ON the Tencent box,
#    not via SSH from elsewhere.)

set -euo pipefail

SCHEMA="${SCHEMA:-issue_tc}"
PG_CONTAINER="${PG_CONTAINER:-pixdesk-pg}"
PG_USER="${PG_USER:-synapse}"
PG_DB="${PG_DB:-synapse}"

if [[ ! "$SCHEMA" =~ ^[a-z_][a-z0-9_]{0,62}$ ]]; then
  echo "SCHEMA must match ^[a-z_][a-z0-9_]*$ (got '$SCHEMA')" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_SQL="$REPO_ROOT/sql/issue_schema.sql"
if [[ ! -f "$SOURCE_SQL" ]]; then
  echo "schema file not found: $SOURCE_SQL" >&2
  exit 1
fi

echo "==> rendering DDL with SCHEMA=$SCHEMA"
RENDERED="$(mktemp -t issue_schema_XXXXXX.sql)"
trap 'rm -f "$RENDERED"' EXIT

# Conservative substitutions — only schema-qualified names of issue objects.
# We deliberately do NOT touch comments, since they describe the publisher
# layout. Function/trigger/sequence renames are explicit so we don't accidentally
# rewrite "issue.X" tokens that appear inside string literals (we have none).
sed -E \
  -e "s/CREATE SCHEMA IF NOT EXISTS issue;/CREATE SCHEMA IF NOT EXISTS ${SCHEMA};/" \
  -e "s/CREATE SEQUENCE IF NOT EXISTS issue\\./CREATE SEQUENCE IF NOT EXISTS ${SCHEMA}./g" \
  -e "s/CREATE TABLE IF NOT EXISTS issue\\./CREATE TABLE IF NOT EXISTS ${SCHEMA}./g" \
  -e "s/^  ON issue\\./  ON ${SCHEMA}./g" \
  -e "s/(CREATE [A-Z ]*INDEX[^;]+) ON issue\\./\\1 ON ${SCHEMA}./g" \
  -e "s/CREATE OR REPLACE FUNCTION issue\\./CREATE OR REPLACE FUNCTION ${SCHEMA}./g" \
  -e "s/DROP TRIGGER IF EXISTS ([a-z_]+) ON issue\\./DROP TRIGGER IF EXISTS \\1 ON ${SCHEMA}./g" \
  -e "s/(BEFORE (INSERT|UPDATE) ON) issue\\./\\1 ${SCHEMA}./g" \
  -e "s/EXECUTE FUNCTION issue\\./EXECUTE FUNCTION ${SCHEMA}./g" \
  -e "s/REFERENCES issue\\./REFERENCES ${SCHEMA}./g" \
  -e "s/nextval\\('issue\\./nextval('${SCHEMA}./g" \
  "$SOURCE_SQL" > "$RENDERED"

# Sanity: count remaining schema-qualified "issue." references in the rendered
# SQL — should be 0 outside comments. Comments are fine.
LEFT=$(grep -vE '^\s*--' "$RENDERED" | grep -cE '\bissue\.(issues|issue_messages|issue_signals|issue_history|detector_cursor|merge_links|channel_memory|fill_issue_code|touch_updated_at|touch_channel_memory_updated_at|issue_code_seq)\b' || true)
if [[ "$LEFT" != "0" ]]; then
  echo "==> WARNING: $LEFT 'issue.' references remain after rendering. Inspect:" >&2
  grep -vE '^\s*--' "$RENDERED" | grep -nE '\bissue\.(issues|issue_messages|issue_signals|issue_history|detector_cursor|merge_links|channel_memory|fill_issue_code|touch_updated_at|touch_channel_memory_updated_at|issue_code_seq)\b' | head -10 >&2
  exit 1
fi

echo "==> applying DDL on $PG_CONTAINER (schema=$SCHEMA)"
docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -v ON_ERROR_STOP=1 < "$RENDERED" | tail -10

echo
echo "==> verifying tables in schema=$SCHEMA"
docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -P pager=off -c \
  "SELECT relname, relkind FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='$SCHEMA' AND c.relkind IN ('r','S','i') ORDER BY relkind, relname;"

echo
echo "DONE. Tenant schema '$SCHEMA' deployed."
echo "Engine on this host should run with ISSUE_SCHEMA=$SCHEMA"
