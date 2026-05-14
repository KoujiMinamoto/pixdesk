# PixDesk

PixDesk is a deployable Matrix + mautrix bridge stack for aggregating Discord, Slack, and Telegram conversations into one Matrix/Element inbox, with a Postgres schema for agent-side history analysis.

The validated path is:

- Synapse Matrix homeserver as the message bus
- Element Web as the operator UI
- mautrix-discord, mautrix-slack, and mautrix-telegram as bridges
- Postgres for Synapse plus `agent.channels` / `agent.messages`
- Optional history import scripts for Slack and Discord

## Architecture

```text
Discord / Slack / Telegram
          |
      mautrix bridges
          |
       Synapse
       /     \
 Element   Postgres
             |
        agent schema
```

Agent applications should read from Matrix for realtime events and from Postgres for imported history. Replies can be sent through Matrix rooms, then bridged back to the source platform.

## Requirements

- Docker Engine or Docker Desktop with Compose v2
- A DNS name and HTTPS reverse proxy for cloud use
- A Matrix server name chosen before first boot, for example `matrix.example.com`
- Platform credentials/tokens for the bridges you enable
- `make`, `bash`, and `python3`

For Discord QR helper support, install `qrencode` on the host where the helper runs.

## Quick Start

```bash
git clone https://github.com/KoujiMinamoto/pixdesk.git
cd pixdesk
cp .env.example .env
```

Edit `.env` before first initialization:

```env
MATRIX_SERVER_NAME=matrix.example.com
MATRIX_PUBLIC_BASEURL=https://matrix.example.com/
POSTGRES_PASSWORD=replace-with-strong-password
SYNAPSE_REGISTRATION_SHARED_SECRET=replace-with-strong-secret
```

Initialize Synapse config and start the core services:

```bash
make init
make start-core
make create-admin MX_USER=admin MX_PASS='replace-with-admin-password'
make init-agent-db
```

Open Element:

```text
http://localhost:8080
```

For a cloud deployment, put Element and Synapse behind HTTPS before production use.

## Bridge Setup

Generate bridge configs and registrations:

```bash
make bridge-init
```

Edit the generated bridge configs under:

```text
data/mautrix-discord/config.yaml
data/mautrix-slack/config.yaml
data/mautrix-telegram/config.yaml
```

Install registrations into Synapse and start bridges:

```bash
make install-registrations
make restart-synapse
make start-bridges
```

Then in Element, open/direct-message the bridge bots:

```text
@discordbot:<server_name>
@slackbot:<server_name>
@telegrambot:<server_name>
```

Send `help` to each bot and follow login instructions.

## Discord Notes

For this stack, Discord user-token login was validated. QR login can be blocked by Discord CAPTCHA, which mautrix-discord cannot solve.

To show all existing Discord DMs in Element, raise this setting in `data/mautrix-discord/config.yaml` before or after login:

```yaml
bridge:
  startup_private_channel_create_limit: 150
```

Restart the bridge:

```bash
docker compose --profile bridges restart mautrix-discord
```

If some group DMs appear blank, use the Matrix room state or a small admin script to set `m.room.name` from Discord channel recipients. The bridge-created rooms are still valid even when Discord returns an empty channel name.

To enable initial history backfill for newly created Discord rooms:

```yaml
bridge:
  backfill:
    forward_limits:
      initial:
        dm: 100
        channel: 200
        thread: 50
      missed:
        dm: 100
        channel: 200
        thread: 50
```

Backfill only applies cleanly when a portal is created after the setting is enabled. For already-created rooms, use the import script below for agent history.

## Slack Notes

mautrix-slack supports token login. For workspaces where OAuth app setup is not available, token login may be the practical route.

Enable future room backfill in `data/mautrix-slack/config.yaml`:

```yaml
bridge:
  backfill:
    enabled: true
    max_initial_messages: 200
```

Slack history access depends on the logged-in token/cookie and Slack workspace permissions.

## Agent Database

Initialize the agent schema:

```bash
make init-agent-db
```

Schema:

- `agent.channels`: one row per bridged/imported channel or DM
- `agent.messages`: imported message history with original raw JSON

Useful query:

```sql
select ts, sender_name, text
from agent.messages
where platform = 'discord'
  and channel_id = '1297732407725920266'
order by ts desc
limit 50;
```

Connect to Postgres:

```bash
docker compose exec -T postgres psql -U synapse -d synapse
```

## Import Discord History

After Discord login, import a DM or channel by Discord channel ID or portal name:

```bash
scripts/import-discord-history.py HyGo --limit 5000 --max-pages 50
scripts/import-discord-history.py 1297732407725920266 --limit 5000 --max-pages 50
```

The script reads the mautrix-discord SQLite login token from:

```text
data/mautrix-discord/discord.db
```

and writes to:

```text
agent.channels
agent.messages
```

Override paths when needed:

```bash
PIXDESK_PROJECT_DIR=/opt/pixdesk scripts/import-discord-history.py HyGo
PIXDESK_DISCORD_DB=/path/to/discord.db scripts/import-discord-history.py HyGo
```

## Import Slack History

After Slack login, import a channel by name:

```bash
scripts/import-slack-history.py internal-testfeishu --limit 1000 --max-pages 5
```

The script reads mautrix-slack login metadata from:

```text
data/mautrix-slack/slack.db
```

and writes to the same `agent` schema.

Override paths when needed:

```bash
PIXDESK_PROJECT_DIR=/opt/pixdesk scripts/import-slack-history.py internal-testfeishu
PIXDESK_SLACK_DB=/path/to/slack.db scripts/import-slack-history.py internal-testfeishu
```

## Cloud Deployment Checklist

1. Choose `MATRIX_SERVER_NAME` once. Matrix IDs include this name and changing it later is painful.
2. Set strong `.env` secrets before `make init`.
3. Run `make init`, `make start-core`, `make create-admin`, and `make init-agent-db`.
4. Put Synapse and Element behind HTTPS.
5. Set `MATRIX_PUBLIC_BASEURL` to the public HTTPS homeserver URL.
6. Update `element/config.json` so `base_url` and `server_name` match your deployment.
7. Generate bridge configs, edit bridge credentials/settings, install registrations, restart Synapse, start bridges.
8. Log in to bridges from Element.
9. Import historical messages into Postgres for agent analysis.
10. Back up `data/` securely. It contains all runtime state and secrets.

## Security

Do not commit:

- `.env`
- `data/`
- appservice registration tokens
- Synapse signing keys
- bridge SQLite databases
- Slack/Discord/Telegram tokens
- Postgres runtime files

This repository ignores those paths by default.

## Common Commands

```bash
make init
make start-core
make create-admin MX_USER=admin MX_PASS='strong-password'
make init-agent-db
make bridge-init
make install-registrations
make restart-synapse
make start-bridges
make logs
make down
```

`make clean` intentionally does not delete runtime data. To reset a lab manually:

```bash
rm -rf data
```

Only do that when you are sure you want to lose local Matrix, bridge, and database state.
