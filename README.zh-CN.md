# PixDesk

[English](README.md)

PixDesk 是一套可部署的 Matrix + mautrix 聚合聊天方案，用 Element 统一查看 Discord、Slack、Telegram，并用 Postgres 保存历史消息，方便后续 Agent 分析和自动回复。

![架构图](docs/images/architecture.svg)

## 解决什么问题

- 把 Discord、Slack、Telegram 聚合到一个 Matrix/Element 收件箱。
- 用 Matrix 做统一的实时消息总线。
- 把历史消息导入 Postgres，供搜索、统计和 AI Agent 分析。
- Agent 通过 Matrix 发消息，再由 bridge 转发回原平台。

## 架构

系统分四层：

1. 聊天平台：Discord、Slack、Telegram。
2. mautrix bridge：每个平台一个 bridge。
3. Matrix 核心：Synapse + Element。
4. Agent 存储：Postgres 中的 `agent.channels` 和 `agent.messages`。

## 部署流程

![部署流程](docs/images/deploy-flow.svg)

建议顺序：

1. 先确定 `MATRIX_SERVER_NAME`，不要反复修改。
2. 初始化 Synapse 并启动核心服务。
3. 创建 Matrix 管理员账号。
4. 初始化 Agent 数据库 schema。
5. 生成并安装 bridge registration。
6. 在 Element 里登录各个平台 bridge。
7. 把历史消息导入 Postgres。

## 环境要求

- Docker Engine 或 Docker Desktop，支持 Compose v2
- `make`、`bash`、`python3`
- 云端部署建议准备域名和 HTTPS 反向代理
- Discord、Slack、Telegram 的平台登录凭据或 token
- 可选：`qrencode`，用于 Discord QR helper

## 快速开始

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

## Bridge 初始化

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

## Discord 配置

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

## Slack 配置

mautrix-slack 支持 token 登录。如果当前工作区不方便配置 OAuth app，token 登录通常更实际。

打开后续新房间的历史回填：

```yaml
bridge:
  backfill:
    enabled: true
    max_initial_messages: 200
```

Slack 历史读取能力取决于登录 token/cookie 以及 workspace 权限。

## Agent 数据库

![数据库 Schema](docs/images/database-schema.svg)

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

## 导入历史消息

**Discord**

```bash
scripts/import-discord-history.py HyGo --limit 5000 --max-pages 50
scripts/import-discord-history.py 1297732407725920266 --limit 5000 --max-pages 50
```

自定义路径：

```bash
PIXDESK_PROJECT_DIR=/opt/pixdesk scripts/import-discord-history.py HyGo
PIXDESK_DISCORD_DB=/path/to/discord.db scripts/import-discord-history.py HyGo
```

**Slack**

```bash
scripts/import-slack-history.py internal-testfeishu --limit 1000 --max-pages 5
```

自定义路径：

```bash
PIXDESK_PROJECT_DIR=/opt/pixdesk scripts/import-slack-history.py internal-testfeishu
PIXDESK_SLACK_DB=/path/to/slack.db scripts/import-slack-history.py internal-testfeishu
```

导入脚本会从 mautrix 的 SQLite 数据库读取登录状态，再调用平台 API 把历史消息写入 `agent.channels` 和 `agent.messages`。Element 时间线是否完整不影响 Agent 读取 Postgres 中的历史。

## 云端部署检查表

1. 一开始就确定 `MATRIX_SERVER_NAME`，后续修改很麻烦。
2. `make init` 前先设置强密码和强 secret。
3. 初始化核心服务并创建管理员账号。
4. 给 Synapse 和 Element 配置 HTTPS。
5. 更新 `MATRIX_PUBLIC_BASEURL` 和 `element/config.json`。
6. 生成 bridge 配置，填写凭据，安装 registration。
7. 在 Element 里登录 bridge bot。
8. 把历史消息导入 Postgres 供 Agent 分析。
9. 安全备份 `data/`。

## 安全

不要提交：

- `.env`
- `data/`
- appservice registration token
- Synapse signing key
- bridge SQLite 数据库
- Slack/Discord/Telegram token
- Postgres 运行时文件

本仓库默认已经忽略这些路径。

## 常用命令

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

`make clean` 不会自动删除运行数据。如果要重置测试环境，手动执行：

```bash
rm -rf data
```

只有确认要删除本地 Matrix、bridge、数据库状态时才执行。
