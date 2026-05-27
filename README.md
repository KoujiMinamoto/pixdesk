# PixDesk

[中文版](README.zh-CN.md)

**A self-hosted chat aggregation platform for organizations.** PixDesk pulls
conversations out of Discord, Slack, and Telegram, normalizes them into a
single Postgres schema, and exposes them — both live and historical — to
internal agents and analytics workloads.

![Architecture](docs/images/architecture.svg)

## What PixDesk Is

Organizations rarely live on one chat platform. Customer success runs in
Slack, communities in Discord, partners in Telegram. The conversations that
matter — leads, escalations, deal context — are spread across silos that
don't share history, search, or APIs in a useful way.

PixDesk is a deployable stack that:

- **Ingests** messages from Discord, Slack, and Telegram via Matrix bridges.
- **Normalizes** them into a Postgres schema (`agent.*`) suited for joins,
  full-text search, and downstream pipelines.
- **Exposes** the result both as a realtime Matrix event stream (for agents
  that want to react live) and as queryable SQL history (for batch jobs,
  RAG, and analytics).
- **Sends replies** back to the source platform through the same bridges,
  so an agent's response shows up natively in Slack/Discord/Telegram.

You self-host it. The data and the bridge credentials never leave your
infrastructure.

## Why This Stack

A few design choices worth flagging up front, because they constrain what
you can build on top:

- **Matrix as the bus.** Every platform-specific bridge writes into the same
  Matrix homeserver (Synapse). One sync stream, one access-control model,
  one event shape — instead of three vendor SDKs.
- **mautrix bridges, not vendor APIs directly.** The bridges already handle
  reconnection, attachment fetching, edits/deletes, and message-edit
  semantics per platform. We piggy-back on years of compatibility work
  rather than rewriting it.
- **Postgres for analysis.** Synapse stores Matrix events; `agent.*` stores
  a denormalized, platform-aware view (channel id, sender display name, raw
  platform JSON). Agents query SQL — not Matrix.
- **Two read paths, one write path.** Realtime agents can listen to Matrix
  `/sync` (services/listener) and act in seconds. Batch agents can read
  Postgres at their leisure. Both views are derived from the same bridge
  ingestion.
- **Replies stay in the bridge layer.** The sender service writes to Matrix
  rooms; the bridge ships the message to Slack/Discord/Telegram. No direct
  vendor API calls in agent code.

## Architecture

The system has five layers:

1. **Source platforms** — Discord, Slack, Telegram.
2. **mautrix bridges** — one container per platform, each holding the
   user-token / cookie / session for a logged-in account.
3. **Matrix core** — Synapse (homeserver) + Element (web client for
   operators).
4. **PixDesk services** — `auth-relay` (drives bridge logins from external
   tools), `listener` (Matrix → Postgres), `sender` (Postgres → Matrix).
5. **Agent storage** — Postgres `agent.channels`, `agent.messages`,
   `agent.conversations`, `agent.replies`, plus webhook/audit tables.

Operators sign in to bridges through either Element (manual `help`
conversation with the bridge bot) or the **PixDesk Login Wizard** — a small
Electron app under `clients/login-wizard/` that captures Discord/Slack
tokens via embedded webview and pushes them through `auth-relay`.

## Data Flow

```
Discord ──┐
Slack   ──┼─► mautrix bridge ─► Synapse ─┬─► Element (humans)
Telegram──┘                              │
                                         ├─► listener ─► Postgres agent.* ─► your agent ─► sender ─► Synapse ─► bridge ─► platform
                                         │
                                         └─► /sync stream ────────────────► realtime agents
```

Two-tier exposure is intentional. Live agents subscribe to Matrix events
and respond in seconds; analytics jobs and RAG indexers query Postgres
without touching the message bus.

## Database Schema

![Database Schema](docs/images/database-schema.svg)

Two SQL files under `sql/`:

- `agent_schema.sql` (v1): `agent.channels`, `agent.messages` — one row per
  channel/DM, one row per message with raw platform JSON preserved.
- `agent_schema_v2.sql`: adds `agent.conversations` (workflow state),
  `agent.replies` (audit trail of agent-generated messages),
  `agent.webhook_config`, and `agent.team_actions`.

Apply both:

```bash
make init-agent-db
```

Sample query:

```sql
select ts, sender_name, text
from agent.messages
where platform = 'slack'
  and channel_id = 'C0700DDQN3E'
  and ts > now() - interval '24 hours'
order by ts desc;
```

## Repository Layout

| Path | Purpose |
|---|---|
| `services/auth-relay/` | FastAPI service. Drives bridge login from external tools (Login Wizard, scripts). Bearer auth, captured tokens written `mode 0600`. |
| `services/listener/` | Matrix `/sync` → `agent.messages` ingester. |
| `services/sender/` | Reads `agent.replies` (status `pending`) → writes Matrix room messages → bridge relays to platform. |
| `clients/login-wizard/` | Electron app. Embedded webview signin for Discord (user-token capture) and Slack (xoxc/xoxd capture); QR flow for Telegram. |
| `sql/` | Agent schema files. |
| `scripts/` | History importers, registration installers, smoke tests. |
| `docs/` | Per-component docs: `auth-relay.md`, `agent-integration.md`, `bridge-config-checklist.md`. |
| `synapse/`, `element/` | Container configs. |
| `data/` | Runtime state (signing keys, bridge DBs, Postgres files). **Never committed.** |

## Requirements

- Docker Engine or Docker Desktop with Compose v2
- `make`, `bash`, `python3` (3.10+)
- Node 18+ if you want to run/build the Login Wizard locally
- A domain + HTTPS reverse proxy for production deployments
- Platform credentials (user tokens / sessions) for each bridge you enable

## Quickstart Deployment

```bash
git clone https://github.com/KoujiMinamoto/pixdesk.git
cd pixdesk
cp .env.example .env
```

Edit `.env`:

```env
MATRIX_SERVER_NAME=matrix.example.com
MATRIX_PUBLIC_BASEURL=https://matrix.example.com/
POSTGRES_PASSWORD=<strong>
SYNAPSE_REGISTRATION_SHARED_SECRET=<strong>
```

Bring up the core stack:

```bash
make init
make start-core
make create-admin MX_USER=admin MX_PASS='<strong>'
make init-agent-db
```

Element is now reachable at `http://localhost:8080`. Sign in as `admin`.

## Bridge Setup

Generate per-bridge configs and Synapse appservice registrations:

```bash
make bridge-init
```

Edit credentials/bridge options in:

```
data/mautrix-discord/config.yaml
data/mautrix-slack/config.yaml
data/mautrix-telegram/config.yaml
```

Install registrations and start the bridges:

```bash
make install-registrations
make restart-synapse
make start-bridges
```

## Bridge Login

Two options.

### Option A — PixDesk Login Wizard (recommended)

```bash
cd clients/login-wizard
npm install
npm start
```

Configure relay URL + shared secret in **Settings**, then click **Login**
on each bridge row. The wizard:

- Opens an embedded Chrome-spoofed webview for Discord/Slack signin.
- Captures tokens straight from session headers (Discord
  `Authorization`), localStorage (Slack `localConfig_v2`), and cookies
  (Slack `d` / xoxd).
- POSTs the token to `auth-relay`, which messages the bridge bot to
  complete login.
- Writes a metadata JSON to `~/.config/pixdesk/captured/` with `mode
  0600` (parent dir `mode 0700`).
- Auto-joins portal rooms the bridge invites the user to during login.

### Option B — Manual via Element

Open Element, start a DM with the bridge bot:

```
@discordbot:<server_name>
@slackbot:<server_name>
@telegrambot:<server_name>
```

Send `help` and follow the bot's instructions.

## History Import

Once a bridge is logged in, backfill historical messages into Postgres:

```bash
scripts/import-discord-history.py <channel-name-or-id> --limit 5000 --max-pages 50
scripts/import-slack-history.py   <channel-name>      --limit 1000 --max-pages 5
```

Override paths if your install isn't at the default location:

```bash
PIXDESK_PROJECT_DIR=/opt/pixdesk \
PIXDESK_DISCORD_DB=/path/to/discord.db \
  scripts/import-discord-history.py HyGo
```

Telegram history is delivered by the bridge's own backfill (configured in
`data/mautrix-telegram/config.yaml` under `bridge.backfill`).

## Agent Integration

Two integration shapes are supported. Pick by latency budget.

### Realtime: Matrix `/sync`

Use a dedicated Matrix user as the agent identity, invite it to the rooms
it should observe, and consume:

- `GET /_matrix/client/v3/sync` — long-poll for new events
- `PUT /_matrix/client/v3/rooms/{roomId}/send/m.room.message/{txnId}` —
  send replies (the bridge will relay them to the source platform if the
  room is a portal)

See `docs/agent-integration.md` for the recommended event shape and safety
defaults (analysis-only mode, allowlists, audit logging).

### Batch / RAG: Postgres

Query `agent.messages` directly. Each row carries:

- `platform`, `workspace_id`, `channel_id`, `thread_id`
- `ts`, `sender_id`, `sender_name`, `text`
- `raw_json` — the original platform payload (attachments, reactions,
  edits)
- v2 columns: `status`, `conversation_id`, `matrix_event_id`,
  `matrix_room_id`

To send a reply from a batch agent, insert into `agent.replies` with
`status = 'pending'`; the `sender` service picks it up, writes to Matrix,
and updates the row to `sent` with the resulting `matrix_event_id`.

## Public Postgres Mirror (optional)

A common pain point: the PixDesk core lives on a private network, but
the agents and analytics workloads that need `agent.*` data live in a
cloud VM that can't reach into the LAN. Rather than poking holes through
the corporate firewall, run a **logical-replication subscriber** on the
public host. The internal Postgres stays the source of truth; the
public mirror is read-mostly and trails by seconds.

```
[internal LAN]                      [public host]
                                    pixdesk-pg container (subscriber)
postgres (publisher) ─┐                 ▲
  publication agent_pub │ replication ── localhost:5433
                       └─► autossh -R 5433 ──► socat 172.18.0.1:5433
                          (185 dials out)         (sidecar)
```

Internal side (`wal_level = logical`, role `replicator`, publication
covering schema `agent`) writes WAL out through a reverse SSH tunnel
opened by an `autossh` systemd unit on the LAN host — no inbound LAN
ports are exposed. The public host runs a small `socat` sidecar so the
subscriber container can reach the tunneled port over the docker bridge
gateway. The subscription's initial copy backfills history, then
streams INSERT/UPDATE/DELETE in real time.

On the public host, lock down access in `pg_hba.conf`:

- `synapse` (superuser, bootstrapped from `POSTGRES_USER`): allow only
  from your operator IP. Never expose to the world.
- `agent_rw` (least-privilege role): `SELECT` on all of `agent.*`,
  `INSERT`/`UPDATE` on `agent.replies` only. Open to whoever needs to
  query (`0.0.0.0/0` is the simplest, paired with scram-sha-256 + a
  strong password). This is the role you hand to external agents.

Reply path is unchanged: an external agent inserts into
`agent.replies` (status `pending`) on the mirror; the row replicates
back through the tunnel to the internal Postgres; the internal `sender`
service picks it up and forwards to Matrix → bridge → platform.
Replication is bidirectional in effect, even though there's only one
publisher direction at the WAL level.

A short connection string is enough for a cloud-hosted agent — no LAN
access, no SSH key:

```bash
PIXDESK_PG_URL=postgresql://agent_rw:<password>@127.0.0.1:5432/synapse
```

(If the agent runs in a container on the same host, use the docker
bridge gateway IP instead of `127.0.0.1`.)

## Operational Notes

### Discord

- User-token login is the validated path. QR login is often blocked by
  Discord's CAPTCHA; mautrix-discord cannot solve it.
- Surface all existing DMs with `bridge.startup_private_channel_create_limit:
  150` (or higher) in the bridge config.
- For backfill into newly created rooms, set `bridge.backfill.forward_limits`
  per channel type (DM / channel / thread).
- Group DMs with empty Discord names get blank Matrix room names —
  acceptable; the rooms work normally.
- If Discord media domains fail to resolve from the container, check the
  `extra_hosts` pins in `docker-compose.yml`. Discord rotates IPs
  occasionally.
- For "Failed to bridge media" errors with `mxc://` images, keep
  `enable_authenticated_media: false` in `homeserver.yaml`. For an
  existing deployment that already stored authenticated local media:

  ```sql
  update local_media_repository set authenticated = false where authenticated = true;
  ```

### Slack

- For workspaces without OAuth-app installation rights, token login
  (xoxc + xoxd cookie) via the Login Wizard is the practical route.
- Enable backfill for new bridged rooms:

  ```yaml
  bridge:
    backfill:
      enabled: true
      max_initial_messages: 200
  ```

- History access depends on the logged-in token's workspace permissions.

### Telegram

- QR login flow is exposed through the Login Wizard (`auth-relay`'s
  `/login/telegram/qr` + `/login/telegram/status` endpoints).
- 2FA password prompts are detected but currently surface as an error;
  see roadmap.

## Cloud Deployment Checklist

1. Choose `MATRIX_SERVER_NAME` once. Changing it later is painful.
2. Set strong `.env` secrets *before* the first `make init`.
3. Put Synapse and Element behind HTTPS (Caddy / nginx / Traefik).
4. Update `MATRIX_PUBLIC_BASEURL` and `element/config.json` to match.
5. Restrict `auth-relay` to localhost; tunnel from operator machines via
   SSH (`ssh -L 8765:127.0.0.1:8765 …`).
6. Back up `data/` regularly. It contains signing keys, bridge sessions,
   and Postgres files — losing it means re-pairing every bridge.
7. Rotate `SYNAPSE_REGISTRATION_SHARED_SECRET` and bridge `as_token`/
   `hs_token` if exposed.

## Security

Never commit:

- `.env`
- `data/` (Synapse signing keys, bridge SQLite DBs, Postgres files,
  uploaded media)
- Appservice registration tokens
- Captured platform tokens (Slack xoxc/xoxd, Discord user tokens,
  Telegram session files)

The repo `.gitignore` covers these by default.

Discord user-token login is technically against Discord ToS — use it on
accounts you control and understand the risk.

## Common Commands

```bash
make init                  # one-time data layout
make start-core            # Synapse, Postgres, Element
make create-admin MX_USER=admin MX_PASS='<strong>'
make init-agent-db         # apply agent_schema.sql + v2
make bridge-init           # generate bridge configs + registrations
make install-registrations
make restart-synapse
make start-bridges
make logs                  # tail all containers
make down                  # stop everything (data preserved)
```

`make clean` does **not** delete `data/`. To reset a lab, remove it
explicitly:

```bash
rm -rf data
```

Only do this when you are sure you want to lose all Matrix, bridge, and
agent state.

## Roadmap

- Telegram 2FA password capture in the Login Wizard
- electron-builder packaging for distributable Login Wizard binaries
- Per-bridge ingestion metrics surfaced through Prometheus
- Optional vector store sync for `agent.messages` → embedding pipeline

## License

See `LICENSE` (or contact the maintainer if not yet attached).
