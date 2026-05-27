# PixDesk

[English](README.md)

**面向组织的自托管聊天聚合平台。** PixDesk 把 Discord、Slack、Telegram
里的对话拉到一起，统一规范化进 Postgres，再以实时与历史两种方式提供给
内部 Agent 和分析任务。

![架构图](docs/images/architecture.svg)

## PixDesk 是什么

组织很少只用一个聊天平台。客户成功跑在 Slack，社区在 Discord，合作伙伴
在 Telegram。真正重要的对话——线索、升级、成单背景——分散在彼此不通
的孤岛里，没有共享的历史、搜索或可用 API。

PixDesk 是一套可部署的栈，做这几件事：

- **接入** —— 通过 Matrix bridge 从 Discord、Slack、Telegram 拉取消息。
- **规范化** —— 把消息归一进 Postgres 的 `agent.*` schema，便于 join、
  全文搜索和下游管线消费。
- **暴露** —— 同时给出实时 Matrix 事件流（给需要即时反应的 Agent）
  和可查询的 SQL 历史（给批处理、RAG、分析任务）。
- **回写** —— Agent 的回复经同样的 bridge 发回原平台，在 Slack /
  Discord / Telegram 里看起来就是原生消息。

整套自托管。数据和 bridge 凭据不离开你的基础设施。

## 为什么是这个组合

几个先讲清楚的设计取舍，因为它们约束了你能在上面叠什么：

- **Matrix 当总线。** 每个平台的 bridge 都写到同一个 Matrix homeserver
  （Synapse）。一条 sync 流、一套权限模型、一种事件形态——而不是同时
  对接三套厂商 SDK。
- **走 mautrix bridge，不直连厂商 API。** 重连、附件抓取、编辑/删除、
  各平台的消息编辑语义，bridge 已经处理过。我们直接吃这些年的兼容性
  工作，而不是自己重写一遍。
- **Postgres 做分析。** Synapse 存 Matrix 事件；`agent.*` 存一份去规范化、
  带平台信息的视图（频道 id、发送者显示名、平台原始 JSON）。Agent 查
  SQL 就够了，不用碰 Matrix。
- **两条读路径，一条写路径。** 实时 Agent 监听 Matrix `/sync`
  （services/listener），秒级响应。批处理 Agent 按需查 Postgres。
  两边都从同一份 bridge 接入派生。
- **回复都从 bridge 走。** sender 服务往 Matrix 房间写消息；bridge
  把消息送到 Slack / Discord / Telegram。Agent 代码里没有任何对厂商
  API 的直接调用。

## 架构

系统分五层：

1. **源平台** —— Discord、Slack、Telegram。
2. **mautrix bridge** —— 每个平台一个容器，各自持有登录账号的
   user-token / cookie / session。
3. **Matrix 核心** —— Synapse（homeserver）+ Element（运维用 Web 客户端）。
4. **PixDesk 服务** —— `auth-relay`（外部工具驱动 bridge 登录）、
   `listener`（Matrix → Postgres）、`sender`（Postgres → Matrix）。
5. **Agent 存储** —— Postgres `agent.channels`、`agent.messages`、
   `agent.conversations`、`agent.replies`，以及 webhook / 审计相关表。

运维登录 bridge 有两条路：在 Element 里手动跟 bridge bot 发 `help`，
或者用 **PixDesk Login Wizard**——`clients/login-wizard/` 下的小 Electron
应用，通过内嵌 webview 抓 Discord / Slack token，再通过 `auth-relay` 推下去。

## 数据流

```
Discord ──┐
Slack   ──┼─► mautrix bridge ─► Synapse ─┬─► Element（人工）
Telegram──┘                              │
                                         ├─► listener ─► Postgres agent.* ─► 你的 Agent ─► sender ─► Synapse ─► bridge ─► 平台
                                         │
                                         └─► /sync 流 ────────────────► 实时 Agent
```

两层暴露是有意为之。实时 Agent 订阅 Matrix 事件，秒级响应；分析任务和
RAG 索引器查 Postgres，完全不动消息总线。

## 数据库 Schema

![数据库 Schema](docs/images/database-schema.svg)

`sql/` 下两份 SQL：

- `agent_schema.sql`（v1）：`agent.channels`、`agent.messages` —— 每个
  频道/DM 一行，每条消息一行，平台原始 JSON 完整保留。
- `agent_schema_v2.sql`：增加 `agent.conversations`（工作流状态）、
  `agent.replies`（Agent 生成消息的审计轨迹）、`agent.webhook_config`、
  `agent.team_actions`。

两份一起 apply：

```bash
make init-agent-db
```

查询示例：

```sql
select ts, sender_name, text
from agent.messages
where platform = 'slack'
  and channel_id = 'C0700DDQN3E'
  and ts > now() - interval '24 hours'
order by ts desc;
```

## 仓库结构

| 路径 | 用途 |
|---|---|
| `services/auth-relay/` | FastAPI 服务，外部工具（Login Wizard、脚本）通过它驱动 bridge 登录。Bearer 鉴权，捕获到的 token 以 `mode 0600` 写盘。 |
| `services/listener/` | Matrix `/sync` → `agent.messages` 的 ingester。 |
| `services/sender/` | 读 `agent.replies`（status `pending`）→ 写 Matrix 房间消息 → bridge 转发到平台。 |
| `clients/login-wizard/` | Electron 应用。Discord（user-token 抓取）和 Slack（xoxc/xoxd 抓取）走内嵌 webview 登录；Telegram 走 QR 流。 |
| `sql/` | Agent schema 文件。 |
| `scripts/` | 历史导入、registration 安装、smoke 测试脚本。 |
| `docs/` | 各组件文档：`auth-relay.md`、`agent-integration.md`、`bridge-config-checklist.md`。 |
| `synapse/`、`element/` | 容器配置。 |
| `data/` | 运行时状态（signing key、bridge 数据库、Postgres 文件）。**不入库。** |

## 环境要求

- Docker Engine 或 Docker Desktop with Compose v2
- `make`、`bash`、`python3`（3.10+）
- Node 18+（如果要本地跑/构建 Login Wizard）
- 生产部署需要域名 + HTTPS 反代
- 每个要启用的 bridge 对应平台的登录凭据（user token / session）

## 快速开始

```bash
git clone https://github.com/KoujiMinamoto/pixdesk.git
cd pixdesk
cp .env.example .env
```

编辑 `.env`：

```env
MATRIX_SERVER_NAME=matrix.example.com
MATRIX_PUBLIC_BASEURL=https://matrix.example.com/
POSTGRES_PASSWORD=<强密码>
SYNAPSE_REGISTRATION_SHARED_SECRET=<强密码>
```

启动核心栈：

```bash
make init
make start-core
make create-admin MX_USER=admin MX_PASS='<强密码>'
make init-agent-db
```

Element 现在可以在 `http://localhost:8080` 访问，用 `admin` 登录。

## Bridge 配置

生成各 bridge 的配置和 Synapse appservice registration：

```bash
make bridge-init
```

在以下文件里填登录凭据和 bridge 选项：

```
data/mautrix-discord/config.yaml
data/mautrix-slack/config.yaml
data/mautrix-telegram/config.yaml
```

安装 registration 并启动 bridge：

```bash
make install-registrations
make restart-synapse
make start-bridges
```

## Bridge 登录

两种方式。

### 方式 A —— PixDesk Login Wizard（推荐）

```bash
cd clients/login-wizard
npm install
npm start
```

在 **Settings** 里配置 relay URL 和 shared secret，然后点击对应 bridge
那一行的 **Login**。Wizard 会：

- 打开伪装成普通 Chrome 的 webview，让你登 Discord / Slack。
- 直接从 session 头（Discord 的 `Authorization`）、localStorage
  （Slack 的 `localConfig_v2`）、cookie（Slack 的 `d` / xoxd）抓 token。
- 把 token POST 给 `auth-relay`，由它去给 bridge bot 发消息完成登录。
- 把元数据 JSON 写到 `~/.config/pixdesk/captured/`，文件
  `mode 0600`、上级目录 `mode 0700`。
- 登录过程中 bridge 邀请的 portal 房间自动 join。

### 方式 B —— 在 Element 里手动登录

打开 Element，跟 bridge bot 私聊：

```
@discordbot:<server_name>
@slackbot:<server_name>
@telegrambot:<server_name>
```

发 `help`，按 bot 的提示走。

## 历史导入

bridge 登录之后，把历史消息回填进 Postgres：

```bash
scripts/import-discord-history.py <频道名或 id> --limit 5000 --max-pages 50
scripts/import-slack-history.py   <频道名>      --limit 1000 --max-pages 5
```

如果安装路径不在默认位置，可以覆盖：

```bash
PIXDESK_PROJECT_DIR=/opt/pixdesk \
PIXDESK_DISCORD_DB=/path/to/discord.db \
  scripts/import-discord-history.py HyGo
```

Telegram 的历史由 bridge 自己回填（在
`data/mautrix-telegram/config.yaml` 的 `bridge.backfill` 里配）。

## Agent 接入

支持两种接入形态，按延迟需求选。

### 实时：Matrix `/sync`

用一个独立 Matrix 用户作为 Agent 身份，把它邀请到要观察的房间，然后消费：

- `GET /_matrix/client/v3/sync` —— 长轮询新事件
- `PUT /_matrix/client/v3/rooms/{roomId}/send/m.room.message/{txnId}` ——
  发送回复（如果房间是 portal，bridge 会把消息转发到源平台）

推荐的事件形态和安全默认值（仅分析模式、白名单、审计日志）见
`docs/agent-integration.md`。

### 批处理 / RAG：Postgres

直接查 `agent.messages`。每行带：

- `platform`、`workspace_id`、`channel_id`、`thread_id`
- `ts`、`sender_id`、`sender_name`、`text`
- `raw_json` —— 平台原始 payload（附件、reaction、编辑）
- v2 列：`status`、`conversation_id`、`matrix_event_id`、`matrix_room_id`

要从批处理 Agent 发回复，向 `agent.replies` 插一行，`status` 写
`pending`；`sender` 服务会取走、写到 Matrix，再把行更新成 `sent` 并
回填 `matrix_event_id`。

## 公网 Postgres 镜像（可选）

很常见的痛点：PixDesk 核心跑在内网，但要消费 `agent.*` 数据的 agent
和分析任务在公网云上，钻不进 LAN。与其在公司防火墙上开洞，不如在
公网机器上跑一个 **logical replication subscriber**。内网 Postgres
依然是 single source of truth；公网那份是只读为主、几秒级追平。

```
[内网]                              [公网]
                                    pixdesk-pg container（subscriber）
postgres（publisher）─┐                 ▲
  publication agent_pub │ 复制流 ── localhost:5433
                       └─► autossh -R 5433 ──► socat 172.18.0.1:5433
                          （185 主动外拨）       （sidecar）
```

内网那一侧（`wal_level = logical`，`replicator` 角色，覆盖 `agent`
schema 的 publication）通过 LAN 上一个 `autossh` systemd unit 主动外拨
出 SSH 反向 tunnel，把 WAL 推出来——LAN 上**不开任何入站端口**。公网
机器上跑一个小 `socat` sidecar，让 subscriber 容器能从 docker bridge
gateway 进到 tunnel 端口。subscription 第一次跑会把历史数据拉一遍，
之后实时同步 INSERT/UPDATE/DELETE。

公网这边 `pg_hba.conf` 收紧：

- `synapse`（容器初始化出来的超管）：只允许你的运维 IP，**不要**对
  公网开。
- `agent_rw`（最小权限角色）：对 `agent.*` 全部 `SELECT`，仅对
  `agent.replies` `INSERT`/`UPDATE`。开给外部需要查的地方
  （最简单是 `0.0.0.0/0` + scram-sha-256 + 强密码）。这是真正给到
  外部 agent 的账号。

回复路径不变：外部 agent 把 `agent.replies` 插一行（status `pending`）
进公网镜像；这行通过 tunnel 反向同步回内网 Postgres；内网 `sender`
服务捡走，写 Matrix → bridge → 原平台。虽然 WAL 层面是单向 publisher
→ subscriber，整条链路看起来是双向的。

云上的 agent 拿一行连接串就够，不用 LAN 访问、不用 SSH key：

```bash
PIXDESK_PG_URL=postgresql://agent_rw:<password>@127.0.0.1:5432/synapse
```

（agent 跑在同一台主机的容器里时，把 `127.0.0.1` 换成 docker bridge
gateway IP。）

## 运维注记

### Discord

- 验证过的登录路径是 user token。QR 登录经常被 Discord 的 CAPTCHA 拦
  住，mautrix-discord 没法解 CAPTCHA。
- 想把已有的 DM 都拉出来，在 bridge 配置里把
  `bridge.startup_private_channel_create_limit` 调到 150 或更高。
- 想让新桥接的房间带历史，按频道类型（DM / channel / thread）配
  `bridge.backfill.forward_limits`。
- Discord 名字为空的 group DM 会得到空房间名 —— 可以接受，房间本身
  正常工作。
- 容器里解析不了 Discord 媒体域名时，看一下 `docker-compose.yml` 里
  `extra_hosts` 的固定 IP。Discord 偶尔会换 IP。
- `mxc://` 图片报 "Failed to bridge media"，在 `homeserver.yaml` 里保持
  `enable_authenticated_media: false`。已有部署如果已经把本地媒体存成
  authenticated，可以一次性更新：

  ```sql
  update local_media_repository set authenticated = false where authenticated = true;
  ```

### Slack

- 没有 OAuth app 安装权限的工作区，走 token 登录（xoxc + xoxd cookie）
  + Login Wizard 是最现实的路径。
- 给新桥接房间打开回填：

  ```yaml
  bridge:
    backfill:
      enabled: true
      max_initial_messages: 200
  ```

- 历史可读范围取决于登录 token 在 workspace 的权限。

### Telegram

- QR 登录通过 Login Wizard（`auth-relay` 的 `/login/telegram/qr`
  + `/login/telegram/status`）。
- 二步验证密码会被检测到，但目前会以错误抛出，详见 Roadmap。

## 云端部署检查表

1. `MATRIX_SERVER_NAME` 一次性定好，之后改起来很疼。
2. 第一次 `make init` 之前就把 `.env` secret 设强。
3. Synapse 和 Element 放到 HTTPS 反代后面（Caddy / nginx / Traefik）。
4. 同步更新 `MATRIX_PUBLIC_BASEURL` 和 `element/config.json`。
5. `auth-relay` 只绑 localhost，运维机器通过 SSH tunnel 访问
   （`ssh -L 8765:127.0.0.1:8765 …`）。
6. 定期备份 `data/`。里面是 signing key、bridge session、Postgres
   文件 —— 丢了就要每个 bridge 重新登录。
7. 怀疑泄露就轮换 `SYNAPSE_REGISTRATION_SHARED_SECRET` 和 bridge 的
   `as_token` / `hs_token`。

## 安全

不要提交：

- `.env`
- `data/`（Synapse signing key、bridge SQLite、Postgres 文件、上传的媒体）
- appservice registration token
- 抓到的平台 token（Slack xoxc/xoxd、Discord user token、Telegram session 文件）

仓库 `.gitignore` 默认已经覆盖了这些。

Discord user-token 登录在技术上违反 Discord 的 ToS，请在自己控制的账号
上使用，并理解相应风险。

## 常用命令

```bash
make init                  # 一次性初始化 data 目录
make start-core            # Synapse、Postgres、Element
make create-admin MX_USER=admin MX_PASS='<强密码>'
make init-agent-db         # apply agent_schema.sql + v2
make bridge-init           # 生成 bridge 配置 + registration
make install-registrations
make restart-synapse
make start-bridges
make logs                  # 实时 tail 所有容器
make down                  # 停掉一切（数据保留）
```

`make clean` **不会**删 `data/`。要重置实验环境，手动删：

```bash
rm -rf data
```

只有确认要丢掉所有 Matrix、bridge、Agent 状态时才执行。

## Roadmap

- Login Wizard 里捕获 Telegram 二步验证密码
- 用 electron-builder 打包 Login Wizard 的可分发二进制
- 各 bridge 的接入指标通过 Prometheus 暴露
- `agent.messages` 可选同步到向量库，作为 embedding pipeline 的来源

## License

见 `LICENSE`（如还未附上请联系维护者）。
