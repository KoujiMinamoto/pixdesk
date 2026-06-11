# Host systemd units

These units run on host 185 alongside the docker-compose stack (they are not
themselves containers). Install with:

```bash
sudo cp deploy/systemd/<unit>.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now <unit>.service
```

## `beeper-discord-logout-watcher.service`

Tails the mautrix-discord container logs and posts an alert to the bridge
management room when the Discord session is logged out (invalid/expired user
token). Runs `scripts/discord-logout-watcher.py`.

It reads `ADMIN_ACCESS_TOKEN` from `/opt/beeper-matrix/.env` via
`EnvironmentFile` and authenticates to Matrix with that long-lived token. Do
**not** switch it to password `/login`: a crash-loop of `/login` calls trips
Synapse's `M_LIMIT_EXCEEDED` limiter, which then re-saturates on every rejected
attempt. See `docs/status.md` → "Discord bridge logout recovery".

## `beeper-discord-qr-helper.service`

Converts a `login-qr` link from `@discordbot` into a scannable QR image posted
to the bridge management room. Runs `scripts/discord-qr-helper.py`.
