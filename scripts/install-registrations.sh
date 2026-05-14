#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

mkdir -p data/appservices
chmod 0755 data data/appservices

missing=0
for bridge in telegram discord slack; do
  src="data/mautrix-${bridge}/registration.yaml"
  dst="data/appservices/mautrix-${bridge}.yaml"
  if [[ -f "$src" ]]; then
    cp "$src" "$dst"
    chmod 0644 "$dst"
    echo "Installed $dst"
  else
    echo "Missing $src. Run make bridge-init after editing data/mautrix-${bridge}/config.yaml."
    missing=1
  fi
done

if [[ "$missing" -ne 0 ]]; then
  exit 1
fi

echo
echo "Registrations installed. Restart Synapse:"
echo "  make restart-synapse"
