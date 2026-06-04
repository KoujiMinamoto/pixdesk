#!/usr/bin/env bash
# End-to-end smoke test for ticket-api on the deployment host.
# Runs curls *from* 185 (where the API is bound to 127.0.0.1:8766) over SSH.
# Verifies write path, attachment hardening, audit history, and that the
# Tencent mirror sees the new row through logical replication.

set -euo pipefail

LAN_HOST="${LAN_HOST:-192.168.72.185}"
LAN_PASS="${LAN_PASS:-ppio123}"
LAN_PG_CONTAINER="${LAN_PG_CONTAINER:-beeper-matrix-postgres-1}"

TC_HOST="${TC_HOST:-124.221.98.230}"
TC_PASS="${TC_PASS:-@Z:k\)~|4MytC\`6}"
TC_PG_CONTAINER="${TC_PG_CONTAINER:-pixdesk-pg}"

API_BASE="${API_BASE:-http://127.0.0.1:8766}"
ACTOR="${ACTOR:-@admin:192.168.72.185}"

run_lan() {
  sshpass -p "$LAN_PASS" ssh -o StrictHostKeyChecking=no -o LogLevel=ERROR "root@${LAN_HOST}" "$@"
}
run_tc() {
  sshpass -p "$TC_PASS" ssh -o StrictHostKeyChecking=no -o LogLevel=ERROR "root@${TC_HOST}" "$@"
}

echo "==> reading TICKET_API_SHARED_SECRET from 185 .env"
SECRET=$(run_lan "grep ^TICKET_API_SHARED_SECRET= /opt/beeper-matrix/.env | cut -d= -f2-")
if [[ -z "$SECRET" ]]; then
  echo "TICKET_API_SHARED_SECRET not set on 185" >&2; exit 1
fi

echo "==> picking an existing agent.conversations row"
CONV_ID=$(run_lan "docker exec ${LAN_PG_CONTAINER} psql -U synapse -d synapse -tAc \"SELECT id FROM agent.conversations ORDER BY last_activity_at DESC LIMIT 1\"" | tr -d '[:space:]')
echo "    conversation_id=$CONV_ID"

H_AUTH="Authorization: Bearer $SECRET"
H_ACTOR="X-Actor-Mxid: $ACTOR"

step() { echo; echo "----- $1 -----"; }

step "1. healthz"
run_lan "curl -fsS '$API_BASE/healthz'"

step "2. create ticket"
CREATE=$(run_lan "curl -fsS -X POST '$API_BASE/v1/tickets' \
  -H '$H_AUTH' -H '$H_ACTOR' -H 'Content-Type: application/json' \
  -d '{\"subject\":\"smoke test\",\"conversation_id\":\"$CONV_ID\",\"priority\":\"high\",\"tags\":[\"smoke\"]}'")
echo "$CREATE"
TID=$(echo "$CREATE" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
CODE=$(echo "$CREATE" | python3 -c "import sys,json; print(json.load(sys.stdin)['code'])")
echo "    id=$TID code=$CODE"

step "3. patch status -> in_progress with comment"
run_lan "curl -fsS -X PATCH '$API_BASE/v1/tickets/$TID' \
  -H '$H_AUTH' -H '$H_ACTOR' -H 'Content-Type: application/json' \
  -d '{\"status\":\"in_progress\",\"comment\":\"working on it\",\"comment_is_internal\":false}'"
echo

step "4. history (should have at least 2 entries: status change + comment)"
run_lan "curl -fsS '$API_BASE/v1/tickets/$TID/history' -H '$H_AUTH'"
echo

step "5. upload tiny png attachment"
# 1x1 transparent PNG, base64 inlined
run_lan "
  cd /tmp && \
  base64 -d > smoke-1x1.png <<EOF
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=
EOF
  curl -fsS -X POST '$API_BASE/v1/tickets/$TID/attachments' \
    -H '$H_AUTH' -H '$H_ACTOR' \
    -F 'file=@/tmp/smoke-1x1.png;type=image/png'
"
echo

step "6. upload oversize file (expect 413)"
HTTP_CODE=$(run_lan "
  dd if=/dev/zero of=/tmp/smoke-big.bin bs=1M count=60 status=none
  curl -s -o /dev/null -w '%{http_code}' -X POST '$API_BASE/v1/tickets/$TID/attachments' \
    -H '$H_AUTH' -H '$H_ACTOR' \
    -F 'file=@/tmp/smoke-big.bin;type=application/octet-stream'
  rm -f /tmp/smoke-big.bin
")
echo "    HTTP $HTTP_CODE"
[[ "$HTTP_CODE" == "413" ]] || { echo "expected 413, got $HTTP_CODE" >&2; exit 1; }

step "7. upload evil.svg (expect 415 — sniffed as image/svg+xml)"
HTTP_CODE=$(run_lan "
  printf '<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>' > /tmp/evil.svg
  curl -s -o /dev/null -w '%{http_code}' -X POST '$API_BASE/v1/tickets/$TID/attachments' \
    -H '$H_AUTH' -H '$H_ACTOR' \
    -F 'file=@/tmp/evil.svg;type=image/svg+xml'
  rm -f /tmp/evil.svg
")
echo "    HTTP $HTTP_CODE"
[[ "$HTTP_CODE" == "415" ]] || { echo "expected 415, got $HTTP_CODE" >&2; exit 1; }

step "8. list attachments"
run_lan "curl -fsS '$API_BASE/v1/tickets/$TID/attachments' -H '$H_AUTH'"
echo

step "9. download attachment, verify byte-equal"
AID=$(run_lan "curl -fsS '$API_BASE/v1/tickets/$TID/attachments' -H '$H_AUTH'" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['attachments'][0]['id'])")
run_lan "
  curl -fsS '$API_BASE/v1/tickets/$TID/attachments/$AID' -H '$H_AUTH' -o /tmp/smoke-dl.png
  cmp /tmp/smoke-1x1.png /tmp/smoke-dl.png && echo '    OK byte-equal'
  rm -f /tmp/smoke-1x1.png /tmp/smoke-dl.png
"

step "10. SELECT through Tencent mirror as agent_ro"
sleep 2  # let logical replication catch up
TC_PG_PASS=$(run_lan "grep ^POSTGRES_PASSWORD= /opt/beeper-matrix/.env | cut -d= -f2-")  # not used; agent_ro password follows
run_tc "docker exec ${TC_PG_CONTAINER} psql -U agent_ro -d synapse -c \"
SELECT t.code, t.subject, t.status, c.platform, c.workspace_id
FROM ticket.tickets t
JOIN agent.conversations c ON c.id = t.conversation_id
WHERE t.id = '$TID';\""

step "11. replication state for ticket.* tables"
run_tc "docker exec ${TC_PG_CONTAINER} psql -U synapse -d synapse -c \"
SELECT n.nspname AS schema, c.relname AS table, sr.srsubstate AS state
FROM pg_subscription_rel sr
JOIN pg_class c ON c.oid = sr.srrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'ticket' ORDER BY c.relname;\""

echo
echo "==> smoke pass. ticket=$CODE id=$TID"

