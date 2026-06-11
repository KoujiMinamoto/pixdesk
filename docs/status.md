# PixDesk Deployment Status

Snapshot of the running deployment. Updated alongside major changes.

## Hosts

| Host | Role | Access |
|---|---|---|
| `192.168.72.185` | Internal LAN — Synapse, Postgres publisher, bridges, listener, auth-relay | `root@192.168.72.185` (LAN only) |
| `124.221.98.230` (Tencent) | Public Postgres mirror (logical-replication subscriber) | `root@124.221.98.230` |

185 has no inbound public ports. Mirror is fed via reverse SSH tunnel
(`autossh` systemd unit on 185 → Tencent `:5433` → docker bridge gateway
via `socat` sidecar → `pixdesk-pg` subscriber).

## Service inventory

| Service | Profile | Host | State |
|---|---|---|---|
| `synapse` | (default) | 185 | running |
| `postgres` | (default) | 185 | running, publisher `agent_pub` |
| `element` | (default) | 185 | running |
| `mautrix-discord` | bridges | 185 | running, logged in as dcid `1232359089674256457` |
| `mautrix-slack` | bridges | 185 | running, logged in to T0700DDQN3E |
| `mautrix-telegram` | bridges | 185 | configured, login untested (task #6) |
| `pixdesk-listener` | agent | 185 | running, drained 267 invites, joined 416 rooms |
| `pixdesk-sender` | agent | 185 | running |
| `pixdesk-auth-relay` | auth | 185 | running, Gmail endpoints live but inert (no GCP creds) |
| `pixdesk-gmail-ingester` | **gmail** | 185 | code deployed, **not started** (waiting on creds) |
| `pixdesk-gmail-sender` | **gmail** | 185 | code deployed, **not started** (waiting on creds) |
| `pixdesk-pg` | (default) | Tencent | running, subscribing |

Two host-level systemd units (not in docker-compose) run alongside the stack
on 185:

| Unit | Purpose |
|---|---|
| `beeper-discord-qr-helper.service` | Converts a `login-qr` link from `@discordbot` into a scannable QR image posted to the bridge management room. |
| `beeper-discord-logout-watcher.service` | Tails the Discord bridge logs and posts an alert to the bridge room the moment the Discord session is logged out. See "Discord bridge logout recovery" below. |

## Data state

`agent.messages` row counts (185 publisher, identical on Tencent mirror):

| platform | count |
|---|---|
| discord | 18409 |
| slack | 17322 |

Replication slot `agent_sub`: active, lag 0 bytes.

Sender_name coverage: Discord 100%, Slack ~96.6%. Gaps are 496 bot-prefix
sender_ids (B-prefix; bots aren't in mautrix `ghost`) plus ~35 user
ghosts whose profile the bridge hasn't fetched yet. Decided not to fix
in DB — agents should `select sender_name` and join through application
layer if they want a separate users dictionary.

## Listener current behaviour

- Reads `/sync` with admin token, joins from `data/listener/sync_token.txt`.
- Resolves message IDs against bridge SQLite (Slack `message`+`ghost`,
  Discord `message`+`portal`+`puppet`).
- Discord workspace_id rule mirrors `import-discord-history.py`: prefer
  `dc_guild_id`, then `portal.receiver`, fall back to
  `direct:{login.dcid}` for group DMs.
- Bridge-row lookup retries with backoff (0/0.5/1.5/4s) so events arriving
  before the bridge commits its SQLite row still land.
- Auto-joins invites from `slackbot`, `discordbot`, `telegrambot`, plus
  `slack_*` / `discord_*` / `telegram_*` puppet ghosts. Drains pending
  invites once at startup with a fresh /sync.

## Discord bridge logout recovery

mautrix-discord logs in with a Discord **user token**. Discord periodically
invalidates it (password change, a device/session logout, or anti-abuse),
which logs the bridge out and **silently stops all Discord messages** into
`agent.messages` and Element. Slack is unaffected, and every container keeps
reporting healthy — so the only symptom is `agent.messages` discord `max(ts)`
going stale.

Confirmed signature in the bridge log:

```
websocket: close 4003: Not authenticated.
websocket: close 4004: Authentication failed.
Got logged out from Discord due to invalid token
```

and `discord.db` `user.discord_token` becomes empty.

### Recover (three steps)

1. **Re-login.** Grab the user token from a browser tab logged into Discord
   (DevTools → Network → any `/api` request → `authorization` request header;
   it is a bare token, *not* `Bearer ...`). Hand it to the bridge via
   auth-relay (localhost-only on 185):

   ```bash
   SECRET=$(grep ^RELAY_SHARED_SECRET= /opt/beeper-matrix/.env | cut -d= -f2-)
   curl -sS http://127.0.0.1:8765/login/discord \
     -H "Authorization: Bearer $SECRET" -H 'Content-Type: application/json' \
     -d '{"token":"<discord-user-token>"}'
   ```

   Success = `Successfully logged in as ...`; the gateway reconnects within
   seconds. This restores **live** messages only — it does **not** backfill
   the period the bridge was logged out.

2. **Backfill the gap** with `scripts/backfill-gap-discord.py` (run from
   `/opt/beeper-matrix`). For every *monitored* channel (those already present
   in `agent.messages`) it forward-paginates the Discord API starting from the
   last message id stored **before the logout boundary** — not the channel's
   overall max id, because live messages that arrived after reconnect would
   otherwise cause the gap to be skipped. Overlap is deduped by the upsert.

   ```bash
   # --before = the logout instant; --only-since skips long-dead channels
   python3 scripts/backfill-gap-discord.py \
     --before '2026-06-04 05:50:00+00' --only-since 2026-05-20 --max-pages 40
   # --dry-run lists the channels it would touch and fetches nothing
   ```

   `403`/`404` on a channel means the bridge account no longer has access
   (left the guild, DM closed) — unrecoverable, reported and skipped.

3. **(token hygiene)** The recovered token is sensitive. If it has been
   exposed, change the Discord password (invalidates all old tokens) and
   re-capture, repeating step 1.

### Proactive alerting

`beeper-discord-logout-watcher.service` (`scripts/discord-logout-watcher.py`)
tails `docker logs -f` of the bridge and posts an `m.notice` to the bridge
management room `!tamUeVfRRugKCTyYto:192.168.72.185` on the logout signatures
above, debounced to one alert per 30 min. It authenticates with the long-lived
`ADMIN_ACCESS_TOKEN` from `.env` (injected via the unit's `EnvironmentFile`),
**not** password `/login`: repeated `/login` calls — e.g. from a crash-loop —
trip Synapse's `M_LIMIT_EXCEEDED` limiter, and each rejected attempt refreshes
the limiter window, so it cannot recover for many minutes. Any future
Matrix-posting helper on this host should reuse the `.env` admin token for the
same reason.

## Gmail integration

Deployed but dormant. Architecturally bypasses Matrix (no mautrix bridge
exists for Gmail).

- `auth-relay` endpoints `/login/gmail/start`, `/login/gmail/callback`,
  `/status/gmail`, `/logout/gmail` all return correct shapes; the start
  endpoint returns `503 GMAIL_CLIENT_ID not configured` until creds land.
- `services/gmail-ingester` polls `users.history.list` every 30s, cold
  start backfills `newer_than:30d` up to 200 messages. Writes
  `agent.messages` with `platform='gmail'`, `workspace_id=<email>`,
  `channel_id='INBOX'`, `thread_id=<gmail thread>`.
- `services/gmail-sender` claims `agent.replies` rows where
  `status='pending'` and `platform='gmail'`. Builds RFC 5322 with
  In-Reply-To / References and preserves `threadId`. Writes resulting
  Gmail message_id back into `matrix_event_id` (column repurposed).
- Auth-relay restart already done. `gmail` profile services not started.
- Token storage: `/data/gmail/tokens.json` mode 0600 (parent 0700).

### Pending action items for Gmail

1. **User**: create OAuth 2.0 **Desktop App** client in Google Cloud
   Console; enable Gmail API; consent screen scope
   `https://www.googleapis.com/auth/gmail.modify`; add the target Gmail
   as a test user.
2. **Operator**: paste `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` into
   `/opt/beeper-matrix/.env` on 185, restart `pixdesk-auth-relay`.
3. **Operator**: walk through OAuth (curl, or Login Wizard once UI ships)
   to get `tokens.json` written.
4. **Operator**: `docker compose --profile gmail up -d` to start ingester
   + sender.
5. **Frontend** (parallel): add Gmail row to Login Wizard with the same
   capture pattern used for Discord/Slack.

## Other open items

- **Tencent firewall** for 5432 — security group must be opened via
  console; not automatable. Currently the public mirror only accepts
  connections from the Tencent VM itself (loopback / docker bridge).
- **Telegram bridge end-to-end test** — login flow (`auth-relay`
  `/login/telegram/qr` + `/login/telegram/status`) is wired but never
  exercised in this deployment.
- **Slack bot/Discord puppet name backfill** — out of scope; agents
  should select `sender_name` and treat blanks as bots.

## Recent commits

```
a4b9832 Add ticket widget — Element side-panel UI on top of ticket-api
37d0f6d Add ticket schema + ticket-api FastAPI service
9a9aed4 Listener auto-populates agent.channels for external readers
6472ab7 Add Gmail ingester + sender (separate services, gmail profile)
255afde Listener handles Discord group DMs and bridge-write race
```

## Quick verification commands

```bash
# 185: row counts
docker exec beeper-matrix-postgres-1 psql -U synapse -d synapse \
  -c "select platform, count(*) from agent.messages group by 1;"

# 185: replication lag
docker exec beeper-matrix-postgres-1 psql -U synapse -d synapse \
  -c "select slot_name, active, pg_size_pretty(pg_wal_lsn_diff(
       pg_current_wal_lsn(), confirmed_flush_lsn)) from pg_replication_slots;"

# 185: listener health
docker logs beeper-matrix-pixdesk-listener-1 --tail 20

# 185: auth-relay
curl -s http://127.0.0.1:8765/healthz
SECRET=$(grep ^RELAY_SHARED_SECRET= /opt/beeper-matrix/.env | cut -d= -f2-)
curl -s -H "Authorization: Bearer $SECRET" http://127.0.0.1:8765/status/gmail

# 185: Discord bridge login state (empty token => logged out)
sqlite3 /opt/beeper-matrix/data/mautrix-discord/discord.db \
  "select mxid, dcid, case when discord_token is null or discord_token='' \
   then 'LOGGED OUT' else 'ok' end from \"user\";"

# 185: logout watcher health
systemctl is-active beeper-discord-logout-watcher.service
journalctl -u beeper-discord-logout-watcher.service --no-pager -n 5
```