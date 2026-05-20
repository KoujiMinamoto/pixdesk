# Auth Relay

`pixdesk-auth-relay` is a small FastAPI service that lets a desktop app (or
plain `curl`) log into the Discord, Slack, and Telegram bridges without the
user having to message the bridge bots inside Element by hand.

The relay holds the **admin** Matrix access token. For each request it:

1. Resolves (or creates) the DM room between the admin and the bridge bot.
2. Sends the bridge's `login` command into that DM.
3. Polls the room for the bot's reply and returns a structured JSON result.

All requests must carry `Authorization: Bearer $RELAY_SHARED_SECRET`.

## Setup

Add to `.env`:

```env
ADMIN_ACCESS_TOKEN=syt_...      # access token of the admin user
RELAY_SHARED_SECRET=long-random-string
```

Get an admin access token, e.g.:

```bash
curl -s http://localhost:8008/_matrix/client/v3/login \
  -H 'Content-Type: application/json' \
  -d '{"type":"m.login.password","identifier":{"type":"m.id.user","user":"admin"},"password":"YOUR_ADMIN_PASSWORD"}' \
  | jq -r .access_token
```

Start the service:

```bash
make start-auth-relay
# listens on 127.0.0.1:8765
```

The relay binds to `127.0.0.1` only. If a desktop app on a different machine
needs to reach it, expose it through your reverse proxy with TLS.

## Endpoints

### `GET /healthz`

Public liveness probe. No auth required.

### `POST /login/discord`

Body:

```json
{ "token": "<discord-user-token>" }
```

Sends `login-token user <token>` to `@discordbot`. Returns:

```json
{
  "ok": true,
  "bot": "@discordbot:example.com",
  "room_id": "!abc:example.com",
  "messages": ["Successfully logged in as ..."]
}
```

### `POST /login/slack`

Body:

```json
{ "auth_token": "xoxc-...", "cookie_token": "xoxd-..." }
```

Drives the bridgev2 cookie flow — sends `login token` then a JSON object with
both fields.

### `POST /login/telegram/qr`

Body: `{}`. Sends `login qr` to `@telegrambot`, waits for the bot to upload a
QR image, downloads the image, and returns it as a `data:` URL the app can
render directly:

```json
{
  "ok": true,
  "bot": "@telegrambot:example.com",
  "room_id": "!xyz:example.com",
  "qr_data_url": "data:image/png;base64,iVBOR...",
  "qr_mxc": "mxc://example.com/...",
  "needs_password": false,
  "messages": ["Scan the QR code on your phone to log in"]
}
```

### `POST /login/telegram/status`

Body:

```json
{ "room_id": "!xyz:example.com", "since_ts_ms": 1747600000000 }
```

Polls the same room for status messages after the QR was shown. Use this from
the app every couple of seconds until `ok` becomes true or the user cancels.
QR codes rotate, so call `/login/telegram/qr` again if too much time passes.

If 2FA is enabled the bot will ask for a password — `needs_password` will be
true. Surface a password input in the app and POST it to a follow-up endpoint
(not yet implemented; for v0 ask the user to type it in Element).

## curl examples

```bash
SECRET="$(grep RELAY_SHARED_SECRET .env | cut -d= -f2)"

# Discord
curl -sS http://127.0.0.1:8765/login/discord \
  -H "Authorization: Bearer $SECRET" \
  -H 'Content-Type: application/json' \
  -d '{"token":"PASTE_TOKEN_HERE"}'

# Slack
curl -sS http://127.0.0.1:8765/login/slack \
  -H "Authorization: Bearer $SECRET" \
  -H 'Content-Type: application/json' \
  -d '{"auth_token":"xoxc-...","cookie_token":"xoxd-..."}'

# Telegram
curl -sS http://127.0.0.1:8765/login/telegram/qr \
  -H "Authorization: Bearer $SECRET" \
  -H 'Content-Type: application/json' \
  -d '{}'
```

## Security notes

- The relay holds an **admin** Matrix token. Anything that can hit the
  endpoint with the shared secret can log accounts into the bridges.
- Bind to localhost or put it behind authenticated reverse proxy. Never
  expose 8765 directly to the public internet.
- Never log request bodies in production — they contain raw user tokens.
- Discord user tokens technically violate Discord ToS. The risk is the same
  one the bridge already takes; the relay just automates the same handoff.
