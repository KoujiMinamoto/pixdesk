#!/usr/bin/env bash
# Deploy ticket schema to publisher (185) AND subscriber (Tencent), then
# extend the logical-replication publication and refresh the subscription.
#
# Order matters: schema must exist on BOTH sides before ALTER PUBLICATION
# adds it on the publisher and REFRESH PUBLICATION pulls it on the subscriber.
# The FK from ticket.tickets.conversation_id is DEFERRABLE INITIALLY DEFERRED
# in the schema file, so out-of-order WAL apply on the subscriber is safe.
#
# Run from the repo root. Reads passwords from MEMORY hosts; override via env
# if you've rotated them.

set -euo pipefail

LAN_HOST="${LAN_HOST:-192.168.72.185}"
LAN_PASS="${LAN_PASS:-ppio123}"
LAN_PG_CONTAINER="${LAN_PG_CONTAINER:-beeper-matrix-postgres-1}"

TC_HOST="${TC_HOST:-124.221.98.230}"
TC_PASS="${TC_PASS:-@Z:k\)~|4MytC\`6}"
TC_PG_CONTAINER="${TC_PG_CONTAINER:-pixdesk-pg}"

PUBLICATION="${PUBLICATION:-agent_pub}"
SUBSCRIPTION="${SUBSCRIPTION:-agent_sub}"

SCHEMA_FILE="$(cd "$(dirname "$0")/.." && pwd)/sql/ticket_schema.sql"
if [[ ! -f "$SCHEMA_FILE" ]]; then
  echo "schema file not found: $SCHEMA_FILE" >&2
  exit 1
fi

run_lan() {
  sshpass -p "$LAN_PASS" ssh -o StrictHostKeyChecking=no "root@${LAN_HOST}" "$@"
}
scp_lan() {
  sshpass -p "$LAN_PASS" scp -o StrictHostKeyChecking=no "$1" "root@${LAN_HOST}:$2"
}
run_tc() {
  sshpass -p "$TC_PASS" ssh -o StrictHostKeyChecking=no "root@${TC_HOST}" "$@"
}
scp_tc() {
  sshpass -p "$TC_PASS" scp -o StrictHostKeyChecking=no "$1" "root@${TC_HOST}:$2"
}

echo "==> staging schema file on both hosts"
scp_lan "$SCHEMA_FILE" /tmp/ticket_schema.sql
scp_tc  "$SCHEMA_FILE" /tmp/ticket_schema.sql

echo "==> applying DDL on publisher (${LAN_HOST})"
run_lan "cat /tmp/ticket_schema.sql | docker exec -i ${LAN_PG_CONTAINER} psql -U synapse -d synapse -v ON_ERROR_STOP=1"

echo "==> applying DDL on subscriber (${TC_HOST})"
run_tc "cat /tmp/ticket_schema.sql | docker exec -i ${TC_PG_CONTAINER} psql -U synapse -d synapse -v ON_ERROR_STOP=1"

echo "==> granting replicator role read access on publisher"
# pgoutput's COPY for initial sync runs as the publication owner role
# (`replicator`); without USAGE+SELECT on the new schema the table-sync
# workers stall in state 'd' with "permission denied for schema ticket".
run_lan "docker exec -i ${LAN_PG_CONTAINER} psql -U synapse -d synapse -v ON_ERROR_STOP=1 <<'SQL'
GRANT USAGE ON SCHEMA ticket TO replicator;
GRANT SELECT ON ALL TABLES IN SCHEMA ticket TO replicator;
ALTER DEFAULT PRIVILEGES IN SCHEMA ticket GRANT SELECT ON TABLES TO replicator;
SQL"

echo "==> seeding default template on publisher only (replicates to subscriber)"
# Seeding on both sides would race with the initial COPY and hit a unique-key
# violation on ticket_templates.name; subscriber receives the row via WAL.
run_lan "docker exec -i ${LAN_PG_CONTAINER} psql -U synapse -d synapse -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO ticket.ticket_templates (name, default_priority)
SELECT 'default', 'standard'
WHERE NOT EXISTS (SELECT 1 FROM ticket.ticket_templates WHERE name = 'default');
SQL"

echo "==> granting agent_ro read access on subscriber"
run_tc "docker exec -i ${TC_PG_CONTAINER} psql -U synapse -d synapse -v ON_ERROR_STOP=1 <<'SQL'
GRANT USAGE ON SCHEMA ticket TO agent_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA ticket TO agent_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA ticket
  GRANT SELECT ON TABLES TO agent_ro;
SQL"

echo "==> extending publication on publisher: ${PUBLICATION} += SCHEMA ticket"
# ALTER PUBLICATION ... ADD TABLES IN SCHEMA is idempotent-ish: it errors if
# the schema is already published. Detect and skip in that case.
if run_lan "docker exec -i ${LAN_PG_CONTAINER} psql -U synapse -d synapse -tAc \"SELECT 1 FROM pg_publication_namespace pn JOIN pg_publication p ON pn.pnpubid = p.oid JOIN pg_namespace n ON pn.pnnspid = n.oid WHERE p.pubname = '${PUBLICATION}' AND n.nspname = 'ticket'\"" | grep -q 1; then
  echo "    (already published; skipping ALTER PUBLICATION)"
else
  run_lan "docker exec -i ${LAN_PG_CONTAINER} psql -U synapse -d synapse -v ON_ERROR_STOP=1 -c \"ALTER PUBLICATION ${PUBLICATION} ADD TABLES IN SCHEMA ticket;\""
fi

echo "==> refreshing subscription on subscriber: ${SUBSCRIPTION}"
run_tc "docker exec -i ${TC_PG_CONTAINER} psql -U synapse -d synapse -v ON_ERROR_STOP=1 -c \"ALTER SUBSCRIPTION ${SUBSCRIPTION} REFRESH PUBLICATION WITH (copy_data = true);\""

echo "==> verifying subscription state on subscriber"
run_tc "docker exec -i ${TC_PG_CONTAINER} psql -U synapse -d synapse -c \"
SELECT n.nspname AS schema, c.relname AS table, sr.srsubstate AS state
FROM pg_subscription_rel sr
JOIN pg_class c ON c.oid = sr.srrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'ticket'
ORDER BY c.relname;
\""

echo "==> verifying agent_ro grants on subscriber"
run_tc "docker exec -i ${TC_PG_CONTAINER} psql -U synapse -d synapse -c \"
SELECT table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'agent_ro' AND table_schema = 'ticket'
ORDER BY table_name;
\""

echo
echo "DONE. Schema ready on both sides; replication active; agent_ro has SELECT."
echo "Now bring up the API:  docker compose --profile tickets up -d pixdesk-ticket-api"

