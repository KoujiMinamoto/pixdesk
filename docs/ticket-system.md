# 工单系统(Ticket System)

PixDesk 在 `agent.*` 之上叠的一层人工工单。聊天会话由 listener 自动产生
(`agent.conversations`),工单是显式的业务工作项 —— 主题、受理人、
客户、生命周期、审计流水,从 UI 手动开。

## 总体形态

```
[UI / BFF] ──HTTP+Bearer──► pixdesk-ticket-api (FastAPI, 127.0.0.1:8766)
                                     │
                                     ▼
                              postgres (agent.* + ticket.*)
                                     │
                                     ▼ logical replication (existing tunnel)
                              Tencent pixdesk-pg (read-only mirror)
                                     │
                                     ▼
                           Hermes / 其他分析 agent (agent_ro)
```

服务只绑 `127.0.0.1:8766`,不直接公开。前端走自己的 BFF,把 Matrix 用户
身份转成 `X-Actor-Mxid` header,鉴权由 BFF 层负责。

## Schema(`ticket` 命名空间)

7 张表 + 1 个序列。FK `ticket.tickets.conversation_id → agent.conversations.id`
声明 `DEFERRABLE INITIALLY DEFERRED`,保证逻辑复制到腾讯订阅端时 apply 顺序
不会卡死。`code` 序列在订阅端不递增(逻辑复制不带序列),但订阅端只读,
无副作用。

| 表 | 主要字段 | 用途 |
|---|---|---|
| `ticket.tickets` | id, code (`PIX-N`), subject, description, conversation_id, assignee_mxid, status, priority, tags[], template_id, opened_at/closed_at/due_at, updated_at, metadata | 工单主体 |
| `ticket.ticket_messages` | (ticket_id, platform, workspace_id, channel_id, message_id), pinned_by_mxid, note | 钉关键聊天消息当证据 |
| `ticket.ticket_comments` | id, ticket_id, author_mxid, body, **is_internal**, created_at | 评论(内部备注 / 对外回复) |
| `ticket.ticket_attachments` | id, ticket_id, filename, mime, size, sha256, storage_path, uploaded_by_mxid, uploaded_at | 附件元数据 |
| `ticket.ticket_watchers` | (ticket_id, watcher_mxid), added_by_mxid | 关注人 |
| `ticket.ticket_history` | id, ticket_id, field, old_value (jsonb), new_value (jsonb), actor_mxid, ts | 审计流水 |
| `ticket.ticket_templates` | id, name, default_subject/description/priority/tags, metadata | 预定义模板 |

枚举:
- `status`: `open` / `in_progress` / `pending_customer` / `resolved` / `closed`
- `priority`: `low` / `standard` / `high` / `urgent`
- 终态(`resolved`/`closed`)进入 / 退出会自动维护 `closed_at`。

「客户」在数据上等于 `(platform, workspace_id)`,从 `agent.conversations`
派生:`tickets t JOIN agent.conversations c ON c.id = t.conversation_id` 即可
拿到 `c.platform / c.workspace_id`,再 join `agent.channels` 拿展示名。

## 鉴权

每个非健康检查端点都要求两个 header:

| Header | 含义 |
|---|---|
| `Authorization: Bearer <TICKET_API_SHARED_SECRET>` | 服务间信任边界(BFF ↔ ticket-api) |
| `X-Actor-Mxid: @user:server` | 真正发起操作的人 —— 进 `ticket_history.actor_mxid` |

ticket-api 不二次校验 Matrix token —— 信任 BFF。BFF 必须确保 actor 头
对应的真是当前已登录的 Matrix 用户。

## API 参考(全部挂 `/v1`)

```
POST   /v1/tickets                          建单
GET    /v1/tickets?status=&assignee=&q=     列表 + 过滤(?q ILIKE 主题/描述)
GET    /v1/tickets/:id                      详情(含 comments/attachments/watchers/history_count)
PATCH  /v1/tickets/:id                      改字段;body 可带 "comment" + "comment_is_internal"
                                             (状态 + 评论合并到一个事务)

GET    /v1/tickets/:id/comments
POST   /v1/tickets/:id/comments             {"body": "...", "is_internal": false}
DELETE /v1/tickets/:id/comments/:cid        actor 必须是作者

POST   /v1/tickets/:id/attachments          multipart;<=50 MB,sniff mime
GET    /v1/tickets/:id/attachments
GET    /v1/tickets/:id/attachments/:aid     Content-Disposition: attachment
DELETE /v1/tickets/:id/attachments/:aid

POST   /v1/tickets/:id/watchers             {"mxid": "@u:server"}
DELETE /v1/tickets/:id/watchers/:mxid

POST   /v1/tickets/:id/messages             pin agent.messages
DELETE /v1/tickets/:id/messages?platform=&workspace_id=&channel_id=&message_id=

GET    /v1/tickets/:id/history              审计流水(倒序)
GET    /v1/customers?q=&platform=           按 channel_name 模糊搜「客户」
GET    /v1/templates                        模板列表
GET    /healthz                             无鉴权
```

PATCH 可以一次性把状态变更和评论一起写,后端在同一个事务里做 —— 要么都成、
要么都 roll back,不会出现状态变了评论丢了的情况。

## 附件加固

上传时:
- 文件名 NFC 归一化、剥控制字符 + NUL,拒 `..` / 绝对路径,截断到 200 字符。
- 流式落盘,单文件 > `MAX_ATTACHMENT_BYTES`(默认 50 MB)立即 413。
- 单工单总量 > `MAX_TOTAL_ATTACHMENT_BYTES_PER_TICKET` 也 413。
- 用 `python-magic` 嗅 mime,对照 declared `Content-Type`:
  - 任何 `text/html*` / `image/svg*` / `application/javascript` 直接 415。
  - declared 与 sniff 不一致(且都不是 octet-stream)→ 415。
- 落盘 `/data/tickets/<ticket_id>/<attachment_uuid>__<filename>`,目录 0750,
  文件 0640。
- 计算 sha256 并写入 `sha256` 列,后续可做去重(本期不实现)。

下载响应头 `Content-Disposition: attachment; filename*=UTF-8''<RFC5987>`,
浏览器不会就地渲染。

## 部署 runbook

```bash
# 1. 在 .env 里加一条强密码
echo "TICKET_API_SHARED_SECRET=$(openssl rand -base64 24 | tr -d /+= | head -c 32)" >> /opt/beeper-matrix/.env

# 2. 推 schema、加 ACL、扩 publication、刷 subscription
./scripts/deploy-ticket-schema.sh

# 3. 启动 API
ssh root@192.168.72.185 'cd /opt/beeper-matrix && docker compose --profile tickets up -d pixdesk-ticket-api'

# 4. 冒烟
./scripts/smoke-ticket-api.sh
```

`scripts/deploy-ticket-schema.sh` 是幂等的,重跑只会 no-op:

1. SCP `sql/ticket_schema.sql` 到两台机的 `/tmp/`。
2. 在 publisher(185)上 `psql -f`(全部 `IF NOT EXISTS`)。
3. 在 subscriber(腾讯)上 `psql -f` 一份相同 DDL。
4. subscriber 上 `GRANT USAGE / SELECT / DEFAULT PRIVILEGES` 给 `agent_ro`。
5. publisher 上 `ALTER PUBLICATION agent_pub ADD TABLES IN SCHEMA ticket`(检测到已发布则跳过)。
6. subscriber 上 `ALTER SUBSCRIPTION agent_sub REFRESH PUBLICATION`,做 initial copy。
7. 打印订阅状态 + `agent_ro` 权限,人工目检。

## v1.1 backlog

下面这些故意留空,排在后面做:

- SLA 计时 + 超期告警 + due_at 升级
- Matrix / 邮件 通知(认领 / 评论触发)
- 模板自定义字段
- 工单关联(父子 / 关联)、工单合并
- 已存视图、CSV 导出
- 附件 sha256 去重(列已留好,逻辑后做)
- Webhook(在 `agent.webhook_config` 上扩)
- tsvector 全文(目前 ILIKE 够用)
- 批量操作、「认领给我」快捷键
- 限流

## Widget UI(运营开单的入口)

截图里那个右侧工单面板就是 `pixdesk-ticket-widget` 服务,作为 Element
widget 嵌进每个 bridged 房间的右侧面板。Web / Desktop / Element X 同一份
代码,只在内网。鉴权走 Matrix OpenID → 短期 cookie。

详细架构、部署、手动 `/addwidget` 兜底、卸载、troubleshooting 都在
[`docs/ticket-widget.md`](./ticket-widget.md)。
