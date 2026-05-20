#!/usr/bin/env bash
# Quick smoke test for the auth-relay service.
#
# Usage:
#   ADMIN_PASSWORD='...' scripts/test-auth-relay.sh
#
# Expects pixdesk-auth-relay to be reachable at $RELAY_URL (default
# http://127.0.0.1:8765). Reads RELAY_SHARED_SECRET from .env if not set.
#
# This script does NOT pass real platform tokens; it intentionally feeds
# obviously-bogus values so we can confirm:
#   - the relay reaches Synapse with admin credentials,
#   - the bot DM is created/found,
#   - the bridge bot replies (with an "invalid token" / "missing keys" error).
#
# For Telegram it triggers the QR flow without scanning.

set -u

cd "$(dirname "$0")/.."

if [[ -z "${RELAY_SHARED_SECRET:-}" ]]; then
  if [[ -f .env ]]; then
    RELAY_SHARED_SECRET="$(grep -E '^RELAY_SHARED_SECRET=' .env | head -1 | cut -d= -f2-)"
  fi
fi
RELAY_URL="${RELAY_URL:-http://127.0.0.1:8765}"

if [[ -z "${RELAY_SHARED_SECRET:-}" ]]; then
  echo "RELAY_SHARED_SECRET not set and not found in .env" >&2
  exit 2
fi

JQ() { jq -r "$1"; }
HDR=(-H "Authorization: Bearer ${RELAY_SHARED_SECRET}" -H "Content-Type: application/json")

section() { printf '\n========== %s ==========\n' "$1"; }
emit() { printf '%s\n' "$1"; }

section "GET /healthz"
curl -sS "$RELAY_URL/healthz" | jq .

section "POST /login/discord  (bogus token, expecting 'Invalid token' error path)"
curl -sS "$RELAY_URL/login/discord" "${HDR[@]}" \
  -d '{"token":"NOT-A-REAL-DISCORD-TOKEN"}' | jq .

section "POST /login/slack    (bogus values, expecting 'Invalid value' or 'Missing some keys' error path)"
curl -sS "$RELAY_URL/login/slack" "${HDR[@]}" \
  -d '{"auth_token":"xoxc-bogus","cookie_token":"xoxd-bogus"}' | jq '.ok, .messages'

section "POST /login/telegram/qr   (real flow, just to confirm we get a QR data URL)"
curl -sS "$RELAY_URL/login/telegram/qr" "${HDR[@]}" \
  -d '{}' \
  | jq '{ok, bot, room_id, has_qr: (.qr_data_url != null), qr_mxc, needs_password, messages}'

echo
echo "Done. Check that:"
echo "  - /healthz returned ok=true"
echo "  - Discord and Slack 'messages' contain a bridgebot error reply"
echo "    (this proves the DM flow works end-to-end without changing accounts)"
echo "  - Telegram has_qr=true (you can render qr_data_url in any browser/img tag)"
