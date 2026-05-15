# PixDesk

PixDesk is a deployable Matrix + mautrix bridge stack for aggregating Discord, Slack, and Telegram conversations into one Element inbox, with a Postgres schema for agent-side history analysis.

PixDesk 是一套可部署的 Matrix + mautrix 聚合聊天方案，用 Element 统一查看 Discord、Slack、Telegram，并用 Postgres 保存历史消息，方便后续 Agent 分析和自动回复。

![Architecture](docs/images/architecture.svg)

## What It Solves / 解决什么问题

**English**

- Aggregate Discord, Slack, and Telegram into one Matrix/Element inbox.
- Use Matrix as the common realtime message bus.
- Store imported history in Postgres for search, analytics, and AI agents.
- Send replies through Matrix and let bridges relay them back to the source platform.

**中文**

- 把 Discord、Slack、Telegram 聚合到一个 Matrix/Element 收件箱。
- 用 Matrix 做统一的实时消息总线。
- 把历史消息导入 Postgres，供搜索、统计和 AI Agent 分析。
- Agent 通过 Matrix 发消息，再由 bridge 转发回原平台。

## Architecture / 架构

**English**

The system has four layers:

1. Chat platforms: Discord, Slack, Telegram.
2. mautrix bridges: one bridge per platform.
3. Matrix core: Synapse + Element.
4. Agent storage: Postgres `agent.channels` and `agent.messages`.

**中文**

系统分四层：

1. 聊天平台：Discord、Slack、Telegram。
2. mautrix bridge：每个平台一个 bridge。
3. Matrix 核心：Synapse + Element。
4. Agent 存储：Postgres 中的 `agent.channels` 和 `agent.messages`。

## Deployment Flow / 部署流程

![Deployment Flow](docs/images/deploy-flow.svg)

**English**

Recommended order:

1. Choose `MATRIX_SERVER_NAME` once.
2. Initialize Synapse and start core services.
3. Create the Matrix admin user.
4. Initialize the agent database schema.
5. Generate and install bridge registrations.
6. Log in to platform bridges from Element.
7. Import historical messages into Postgres.

**中文**

建议顺序：

1. 先确定 `MATRIX_SERVER_NAME`，不要反复修改。
2. 初始化 Synapse 并启动核心服务。
3. 创建 Matrix 管理员账号。
4. 初始化 Agent 数据库 schema。
5. 生成并安装 bridge registration。
6. 在 Element 里登录各个平台 bridge。
7. 把历史消息导入 Postgres。

## Requirements / 环境要求

**English**

- Docker Engine or Docker Desktop with Compose v2
- `make`, `bash`, `python3`
- A domain and HTTPS reverse proxy for cloud deployment
- Platform credentials or login tokens for Discord, Slack, and Telegram
- Optional: `qrencode` for Discord QR helper

**中文**

- Docker Engine 或 Docker Desktop，支持 Compose v2
- `make`、`bash`、`python3`
- 云端部署建议准备域名和 HTTPS 反向代理
- Discord、Slack、Telegram 的平台登录凭据或 token
- 可选：`qrencode`，用于 Discord QR helper

## Quick Start / 快速开始

**English**

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

Start the core stack:

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

**中文**

```bash
git clone https://github.com/KoujiMinamoto/pixdesk.git
cd pixdesk
cp .env.example .env
```

第一次初始化前先编辑 `.env`：

```env
MATRIX_SERVER_NAME=matrix.example.com
MATRIX_PUBLIC_BASEURL=https://matrix.example.com/
POSTGRES_PASSWORD=replace-with-strong-password
SYNAPSE_REGISTRATION_SHARED_SECRET=replace-with-strong-secret
```

启动核心服务：

```bash
make init
make start-core
make create-admin MX_USER=admin MX_PASS='replace-with-admin-password'
make init-agent-db
```

打开 Element：

```text
http://localhost:8080
```

## Bridge Setup / Bridge 初始化

**English**

Generate bridge configs and registrations:

```bash
make bridge-init
```

Edit generated configs:

```text
data/mautrix-discord/config.yaml
data/mautrix-slack/config.yaml
data/mautrix-telegram/config.yaml
```

Install registrations and start bridges:

```bash
make install-registrations
make restart-synapse
make start-bridges
```

In Element, message the bridge bots:

```text
@discordbot:<server_name>
@slackbot:<server_name>
@telegrambot:<server_name>
```

Send `help` to each bot and follow login instructions.

**中文**

生成 bridge 配置和 registration：

```bash
make bridge-init
```

编辑生成的配置：

```text
data/mautrix-discord/config.yaml
data/mautrix-slack/config.yaml
data/mautrix-telegram/config.yaml
```

安装 registration 并启动 bridges：

```bash
make install-registrations
make restart-synapse
make start-bridges
```

在 Element 中私聊 bridge bot：

```text
@discordbot:<server_name>
@slackbot:<server_name>
@telegrambot:<server_name>
```

给每个 bot 发送 `help`，按提示登录。

## Discord Setup / Discord 配置

**English**

Discord user-token login was validated in this project. QR login can be blocked by Discord CAPTCHA, which mautrix-discord cannot solve.

To show all existing Discord DMs in Element, raise the startup private channel limit:

```yaml
bridge:
  startup_private_channel_create_limit: 150
```

Restart the bridge:

```bash
docker compose --profile bridges restart mautrix-discord
```

To backfill newly created Discord rooms:

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

If some group DMs have blank names, set the Matrix room name from Discord recipients. The rooms are valid even when Discord returns an empty channel name.

If images, GIFs, or Tenor videos fail with `connect: connection refused`, check DNS from inside the `mautrix-discord` container. The Compose file includes validated `extra_hosts` pins for Discord media domains, but those IPs may need updating over time.

If Element shows `Failed to bridge media` or cannot open `mxc://` images, keep Synapse media compatible with legacy Element media endpoints:

```yaml
enable_authenticated_media: false
```

For an existing deployment that already stored authenticated local media, update old rows once:

```sql
update local_media_repository
set authenticated = false
where authenticated = true;
```

**中文**

这个项目里已经验证过 Discord user-token 登录。QR 登录可能被 Discord CAPTCHA 阻断，而 mautrix-discord 不能处理 CAPTCHA。

如果要在 Element 中显示所有已有 Discord DM，提高启动时私聊房间创建上限：

```yaml
bridge:
  startup_private_channel_create_limit: 150
```

重启 bridge：

```bash
docker compose --profile bridges restart mautrix-discord
```

如果希望新创建的 Discord 房间自动回填一部分历史：

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

如果有些 group DM 显示为空名，可以用 Discord recipients 拼接后写入 Matrix room name。即使名字为空，房间本身也是有效的。

如果图片、GIF 或 Tenor 视频出现 `connect: connection refused`，先进入 `mautrix-discord` 容器检查 DNS。当前 Compose 已经包含验证过的 Discord 媒体域名 `extra_hosts` 固定 IP，但这些 IP 未来可能需要更新。

如果 Element 显示 `Failed to bridge media` 或无法打开 `mxc://` 图片，建议保持 Synapse media 与旧版 Element media endpoint 兼容：

```yaml
enable_authenticated_media: false
```

已有部署如果已经把本地媒体存成 authenticated，可以一次性更新旧数据：

```sql
update local_media_repository
set authenticated = false
where authenticated = true;
```

## Slack Setup / Slack 配置

**English**

mautrix-slack supports token login. For workspaces where OAuth app setup is not available, token login may be the practical route.

Enable future room backfill:

```yaml
bridge:
  backfill:
    enabled: true
    max_initial_messages: 200
```

Slack history access depends on the logged-in token/cookie and workspace permissions.

**中文**

mautrix-slack 支持 token 登录。如果当前工作区不方便配置 OAuth app，token 登录通常更实际。

打开后续新房间的历史回填：

```yaml
bridge:
  backfill:
    enabled: true
    max_initial_messages: 200
```

Slack 历史读取能力取决于登录 token/cookie 以及 workspace 权限。

## Agent Database / Agent 数据库

![Database Schema](docs/images/database-schema.svg)

**English**

Initialize the schema:

```bash
make init-agent-db
```

Tables:

- `agent.channels`: one row per bridged/imported channel or DM
- `agent.messages`: imported message history with raw platform JSON

Connect to Postgres:

```bash
docker compose exec -T postgres psql -U synapse -d synapse
```

Example query:

```sql
select ts, sender_name, text
from agent.messages
where platform = 'discord'
  and channel_id = '1297732407725920266'
order by ts desc
limit 50;
```

**中文**

初始化 schema：

```bash
make init-agent-db
```

数据表：

- `agent.channels`：每个导入或桥接的频道/DM 一行
- `agent.messages`：历史消息，包含平台原始 JSON

连接 Postgres：

```bash
docker compose exec -T postgres psql -U synapse -d synapse
```

查询示例：

```sql
select ts, sender_name, text
from agent.messages
where platform = 'discord'
  and channel_id = '1297732407725920266'
order by ts desc
limit 50;
```

## Import History / 导入历史消息

**Discord**

```bash
scripts/import-discord-history.py HyGo --limit 5000 --max-pages 50
scripts/import-discord-history.py 1297732407725920266 --limit 5000 --max-pages 50
```

Override paths when needed:

```bash
PIXDESK_PROJECT_DIR=/opt/pixdesk scripts/import-discord-history.py HyGo
PIXDESK_DISCORD_DB=/path/to/discord.db scripts/import-discord-history.py HyGo
```

**Slack**

```bash
scripts/import-slack-history.py internal-testfeishu --limit 1000 --max-pages 5
```

Override paths when needed:

```bash
PIXDESK_PROJECT_DIR=/opt/pixdesk scripts/import-slack-history.py internal-testfeishu
PIXDESK_SLACK_DB=/path/to/slack.db scripts/import-slack-history.py internal-testfeishu
```

**中文说明**

导入脚本会从 mautrix 的 SQLite 数据库读取登录状态，再调用平台 API 把历史消息写入 `agent.channels` 和 `agent.messages`。Element 时间线是否完整不影响 Agent 读取 Postgres 中的历史。

## Cloud Deployment Checklist / 云端部署检查表

**English**

1. Choose `MATRIX_SERVER_NAME` once. Changing it later is difficult.
2. Set strong `.env` secrets before `make init`.
3. Run core initialization and create admin user.
4. Put Synapse and Element behind HTTPS.
5. Update `MATRIX_PUBLIC_BASEURL` and `element/config.json`.
6. Generate bridge configs, edit credentials, install registrations.
7. Log in to bridge bots from Element.
8. Import history into Postgres for agent analysis.
9. Back up `data/` securely.

**中文**

1. 一开始就确定 `MATRIX_SERVER_NAME`，后续修改很麻烦。
2. `make init` 前先设置强密码和强 secret。
3. 初始化核心服务并创建管理员账号。
4. 给 Synapse 和 Element 配置 HTTPS。
5. 更新 `MATRIX_PUBLIC_BASEURL` 和 `element/config.json`。
6. 生成 bridge 配置，填写凭据，安装 registration。
7. 在 Element 里登录 bridge bot。
8. 把历史消息导入 Postgres 供 Agent 分析。
9. 安全备份 `data/`。

## Security / 安全

**English**

Do not commit:

- `.env`
- `data/`
- appservice registration tokens
- Synapse signing keys
- bridge SQLite databases
- Slack/Discord/Telegram tokens
- Postgres runtime files

**中文**

不要提交：

- `.env`
- `data/`
- appservice registration token
- Synapse signing key
- bridge SQLite 数据库
- Slack/Discord/Telegram token
- Postgres 运行时文件

This repository ignores those paths by default.

本仓库默认已经忽略这些路径。

## Common Commands / 常用命令

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

`make clean` 不会自动删除运行数据。如果要重置测试环境，手动执行：

```bash
rm -rf data
```

Only do this when you are sure you want to lose local Matrix, bridge, and database state.

只有确认要删除本地 Matrix、bridge、数据库状态时才执行。
