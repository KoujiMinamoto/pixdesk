SHELL := /bin/bash

.PHONY: init start-core create-admin init-agent-db bridge-init install-registrations start-bridges restart-synapse logs down clean

init:
	./scripts/init.sh

start-core:
	docker compose up -d postgres synapse element

create-admin:
	@if [[ -z "$(MX_USER)" || -z "$(MX_PASS)" ]]; then \
		echo "Usage: make create-admin MX_USER=admin MX_PASS='strong-password'"; \
		exit 1; \
	fi
	docker compose exec synapse register_new_matrix_user http://localhost:8008 -c /data/extra-config.yaml --admin -u "$(MX_USER)" -p "$(MX_PASS)" --exists-ok

init-agent-db:
	docker compose exec -T postgres psql -U synapse -d synapse -v ON_ERROR_STOP=1 < sql/agent_schema.sql

bridge-init:
	@mkdir -p data/mautrix-telegram data/mautrix-discord data/mautrix-slack
	@for bridge in telegram discord slack; do \
		echo "Generating config/registration for mautrix-$$bridge"; \
		docker compose --profile bridges run --rm --no-deps "mautrix-$$bridge" || true; \
	done

install-registrations:
	./scripts/install-registrations.sh

start-bridges:
	docker compose --profile bridges up -d mautrix-telegram mautrix-discord mautrix-slack

restart-synapse:
	docker compose restart synapse

logs:
	docker compose --profile bridges logs -f --tail=200

down:
	docker compose --profile bridges down

clean:
	@echo "This deletes local Matrix, bridge, and Postgres data."
	@echo "Run manually if you really want it: rm -rf data"
