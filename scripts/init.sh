#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example. Edit it before cloud deployment."
fi

set -a
source ./.env
set +a

mkdir -p data/synapse data/appservices data/postgres
mkdir -p data/mautrix-telegram data/mautrix-discord data/mautrix-slack
chmod 0755 data data/synapse data/appservices

for bridge in telegram discord slack; do
  placeholder="data/appservices/mautrix-${bridge}.yaml"
  if [[ ! -f "$placeholder" ]]; then
    cat > "$placeholder" <<YAML
id: placeholder-mautrix-${bridge}
url: null
as_token: placeholder-as-token-${bridge}
hs_token: placeholder-hs-token-${bridge}
sender_localpart: placeholder-mautrix-${bridge}
namespaces:
  users: []
  aliases: []
  rooms: []
rate_limited: false
YAML
  fi
done
chmod 0644 data/appservices/*.yaml

escape_sed() {
  printf '%s' "$1" | sed -e 's/[\/&]/\\&/g'
}

sed \
  -e "s/__MATRIX_PUBLIC_BASEURL__/$(escape_sed "${MATRIX_PUBLIC_BASEURL}")/g" \
  -e "s/__POSTGRES_PASSWORD__/$(escape_sed "${POSTGRES_PASSWORD}")/g" \
  -e "s/__SYNAPSE_REGISTRATION_SHARED_SECRET__/$(escape_sed "${SYNAPSE_REGISTRATION_SHARED_SECRET}")/g" \
  synapse/extra-config.yaml.template > data/synapse/extra-config.yaml
chmod 0644 data/synapse/extra-config.yaml

if [[ ! -f data/synapse/homeserver.yaml ]]; then
  docker compose run --rm --no-deps synapse generate
else
  echo "data/synapse/homeserver.yaml already exists; not regenerating."
fi

echo
echo "Init done."
echo "Next:"
echo "  make start-core"
echo "  make create-admin MX_USER=admin MX_PASS='strong-password'"
echo "  make bridge-init"
