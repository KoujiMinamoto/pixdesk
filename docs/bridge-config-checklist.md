# Bridge Config Checklist

Run `make bridge-init` once to create:

- `data/mautrix-telegram/config.yaml`
- `data/mautrix-discord/config.yaml`
- `data/mautrix-slack/config.yaml`

Then edit each config and run `make bridge-init` again to regenerate `registration.yaml`.

## Common fields

For every bridge:

```yaml
homeserver:
  address: http://synapse:8008
  domain: localhost

appservice:
  hostname: 0.0.0.0
```

Use your real `MATRIX_SERVER_NAME` instead of `localhost` when deploying to a domain.

Set the appservice address by bridge:

```yaml
# Telegram
appservice:
  address: http://mautrix-telegram:29317
  port: 29317

# Discord
appservice:
  address: http://mautrix-discord:29334
  port: 29334

# Slack
appservice:
  address: http://mautrix-slack:29335
  port: 29335
```

For a small lab, SQLite in each bridge data directory is acceptable. For production, use separate Postgres databases per bridge, not the Synapse database.

Restrict bridge permissions to your admin user:

```yaml
bridge:
  permissions:
    "*": relaybot
    "@admin:localhost": admin
```

For cloud deployment, replace `@admin:localhost` with your real Matrix ID.

## Telegram

Create Telegram API credentials at:

https://my.telegram.org/apps

Set:

```yaml
telegram:
  api_id: 123456
  api_hash: your_api_hash
```

After the bridge is running, message `@telegrambot:<server_name>` in Element and follow the login commands.

## Discord

Create a Discord application/bot in the Discord Developer Portal:

https://discord.com/developers/applications

The bridge supports Matrix-to-Discord puppeting, but Discord permissions and message content access depend on bot settings and Discord privileged intents. Enable only the scopes/intents you need.

After the bridge is running, message `@discordbot:<server_name>` in Element and follow the bridge help/login flow.

## Slack

Create or authorize a Slack app/workspace according to the generated `mautrix-slack` config comments.

After the bridge is running, message `@slackbot:<server_name>` in Element and follow the bridge help/login flow.

Slack workspace history and channel access depend on the Slack app scopes and what the app/user has been authorized to access.

