# Hermes 只读接入说明

PixDesk 把 Discord / Slack(后续会加 Telegram、Gmail)的所有消息归集到一份
统一 schema 的 Postgres 里。这份文档给到 Hermes agent —— 它从公网只读访问
这份镜像数据,不影响主链路。

## 1. 连接信息

| 项 | 值 |
|---|---|
| Host | `124.221.98.230` |
| Port | `5432` |
| Database | `synapse` |
| User | `agent_ro` |
| Password | 单独索取(不入仓库) |
| SSL | 推荐 `sslmode=require`(服务端不强制,但建议开) |

DSN 一行(把 `<PASSWORD>` 替换成单独发给你的密码):
```
postgresql://agent_ro:<PASSWORD>@124.221.98.230:5432/synapse?sslmode=require
```

psql 验证:
```bash
PGPASSWORD='<PASSWORD>' \
  psql -h 124.221.98.230 -U agent_ro -d synapse \
  -c "select platform, count(*) from agent.messages group by 1;"
```

## 2. 权限范围

`agent_ro` 是只读账号,严格限制如下:

- ✅ `SELECT` 整个 `agent.*` schema(包括以后新增的表会自动放权)。
- ❌ `INSERT` / `UPDATE` / `DELETE` 任何表 —— 一律 `permission denied`。
- ❌ 看不到 `agent` 之外的 schema(`public`、`synapse` 内部表等)。
- ❌ 不能创建对象、不能 `COPY`、不能改 session 配置。

源端 IP 已在 `pg_hba.conf` 锁死为 `49.51.244.46/32`,腾讯安全组同步限制。
换 IP 请先告知运维。

## 3. 数据是怎么来的

```
[内网 LAN] ─ Discord/Slack/... 桥接 ─► Matrix(Synapse) ─► listener ─► postgres(主)
                                                                          │
                                                                          ▼ 逻辑复制(WAL)
                                                                      [腾讯公网]
                                                                      pixdesk-pg(只读)  ◄── 你连的就是这个
```

- 主库在内网,镜像在腾讯。逻辑复制延迟通常 < 1 秒。
- 镜像是「读为主」的副本 —— 写入会被拒绝,语义上等同于一份实时只读视图。
- 历史消息(冷启动 backfill)和实时新消息都会出现在同一张表里。

## 4. Schema 概览

| 表 | 作用 | 行数级别 |
|---|---|---|
| `agent.messages` | 所有渠道的消息记录(主表) | 万级,持续增长 |
| `agent.channels` | 渠道/会话元数据(频道名、Matrix 房间映射等) | 百级 |
| `agent.conversations` | 业务会话单元(可跨多条消息,带状态/优先级/标签) | 千级 |
| `agent.replies` | 我们这边发出去的回复审计(只对运维有意义) | 视使用情况 |
| `agent.team_actions` | 人工操作流水(认领、解决等) | 视使用情况 |
| `agent.webhook_config` | 推送配置 | 个位数 |

Hermes 大概率只关心 `messages` + `channels` + `conversations` 三张。

工单系统(`ticket.*` schema)也已经接进同一份镜像,`agent_ro` 也有 SELECT
权限。要做工单分析时关心:

| 表 | 作用 |
|---|---|
| `ticket.tickets` | 工单主体(状态、优先级、受理人、客户绑定) |
| `ticket.ticket_comments` | 评论(`is_internal` 区分内外) |
| `ticket.ticket_history` | 字段级审计流水 |
| `ticket.ticket_attachments` | 附件元数据(实际 blob 不在镜像里) |
| `ticket.ticket_messages` | 工单 ↔ `agent.messages` 多对多(钉的关键证据) |

「客户」字段在 `ticket.tickets` 上没有冗余存,通过 `conversation_id`
关联到 `agent.conversations` 派生:

```sql
SELECT t.code, t.subject, t.status, t.priority,
       c.platform, c.workspace_id, ch.channel_name
FROM ticket.tickets t
JOIN agent.conversations c ON c.id = t.conversation_id
LEFT JOIN agent.channels ch
  ON  ch.platform     = c.platform
  AND ch.workspace_id = c.workspace_id
  AND ch.channel_id   = c.channel_id
WHERE t.status NOT IN ('resolved','closed')
ORDER BY t.opened_at DESC;
```

## 5. 关键字段语义

### 5.1 `agent.messages`(主表)

| 列 | 类型 | 说明 |
|---|---|---|
| `platform` | text | `'discord'` / `'slack'` / 后续可能 `'telegram'` / `'gmail'` |
| `workspace_id` | text | 见下方约定 —— 不同平台含义不同 |
| `channel_id` | text | 平台原生频道/会话 ID |
| `message_id` | text | 平台原生消息 ID |
| `thread_id` | text | 同上,nullable;Discord 不一定有,Slack `thread_ts` |
| `sender_id` | text | 平台原生用户 ID(机器人是 B 开头) |
| `sender_name` | text | 显示名;Slack 约 96.6% 覆盖,Discord 100% |
| `text` | text | 纯文本正文(图片/文件类消息这里可能是文件名) |
| `ts` | timestamptz | 平台侧消息时间(权威时间戳,排序用这个) |
| `raw` | jsonb | Matrix 事件原文,什么都有(附件 mxc URL、reactions、回复关系等) |
| `imported_at` | timestamptz | listener 入库时间(用来判断「最近写入」) |
| `status` | text | 内部工作流状态,通常 `'new'`,可忽略 |
| `conversation_id` | uuid | 关联 `agent.conversations.id`,nullable |
| `matrix_event_id` | text | Matrix 侧事件 ID,串内部链路用 |
| `matrix_room_id` | text | Matrix 房间 ID |

主键 `(platform, workspace_id, channel_id, message_id)` —— 同一条消息不会重复。

### 5.2 `workspace_id` 约定(重要,各平台不一样)

| 平台 | `workspace_id` 取值规则 |
|---|---|
| Slack | Slack `team_id`(如 `T0700DDQN3E`) |
| Discord | 优先 `dc_guild_id`(服务器 ID);DM 时是 `direct:{login.dcid}` |

所以**「按租户分组」要用 `(platform, workspace_id)` 联合**,不要单看 `workspace_id`。

### 5.3 `agent.channels`

`(platform, workspace_id, channel_id)` 主键,可以 join 回 `messages` 拿
`channel_name` 和 `matrix_room_id`。`raw` 里有桥接侧的全量元数据(Discord
群 DM 的成员名单、Slack 频道是否 archived 等),按需挖。

### 5.4 `agent.conversations`

业务上把「同一个频道/线程的若干消息」聚成一个会话单元,带 `status`
(`'open'` / `'resolved'`)、`priority`、`tags`、`opened_at` 等。一条
`messages` 通过 `conversation_id` 关联到这里。当前数据状态:`open` 约 895
个,无 `resolved`(还没接入人工流转)。

## 6. 常用查询

### 6.1 各平台总量 + 最近一条时间

```sql
SELECT platform,
       count(*) AS total,
       max(ts) AS latest_msg_at,
       max(imported_at) AS latest_import_at
FROM agent.messages
GROUP BY platform
ORDER BY platform;
```

### 6.2 最近 N 条消息(按平台时间)

```sql
SELECT platform, channel_id, sender_name, text, ts
FROM agent.messages
WHERE platform = 'slack'
ORDER BY ts DESC
LIMIT 50;
```

### 6.3 某个频道的对话流(用上 ts 索引)

```sql
SELECT ts, sender_name, text
FROM agent.messages
WHERE platform = 'discord'
  AND workspace_id = '<guild_id>'
  AND channel_id = '<channel_id>'
ORDER BY ts ASC
LIMIT 200;
```

索引 `agent_messages_channel_ts_idx` 覆盖这种查询。

### 6.4 带频道名的消息(join channels)

```sql
SELECT m.ts, c.channel_name, m.sender_name, m.text
FROM agent.messages m
LEFT JOIN agent.channels c USING (platform, workspace_id, channel_id)
WHERE m.platform = 'slack'
ORDER BY m.ts DESC
LIMIT 100;
```

### 6.5 按 thread 拉整段对话

```sql
SELECT ts, sender_name, text
FROM agent.messages
WHERE platform = 'slack'
  AND workspace_id = '<team_id>'
  AND channel_id = '<channel_id>'
  AND thread_id = '<thread_ts>'
ORDER BY ts ASC;
```

### 6.6 从 raw jsonb 里挖字段

`raw` 是 Matrix 事件的完整 JSON,常用提取:

```sql
-- 图片/附件 URL(Matrix mxc:// 协议,需要服务端代理才能下载)
SELECT raw->'content'->>'url' AS mxc_url,
       raw->'content'->>'body' AS filename,
       raw#>>'{content,info,mimetype}' AS mime
FROM agent.messages
WHERE raw#>>'{content,msgtype}' = 'm.image'
LIMIT 20;

-- 回复关系(Matrix 侧)
SELECT message_id,
       raw#>>'{content,m.relates_to,m.in_reply_to,event_id}' AS reply_to
FROM agent.messages
WHERE raw#>>'{content,m.relates_to,m.in_reply_to,event_id}' IS NOT NULL
LIMIT 20;
```

### 6.7 全文搜索(简单 ILIKE,数据量万级够用)

```sql
SELECT platform, ts, sender_name, text
FROM agent.messages
WHERE text ILIKE '%关键词%'
ORDER BY ts DESC
LIMIT 100;
```

需要更猛的搜索可以申请加一列 `tsvector` 索引,联系运维。

## 7. 注意事项

- **时区**:所有 `timestamptz` 列都带时区,客户端按需转。`ts` 是平台原生时间,
  `imported_at` 是 listener 入库时间;监控延迟用两者差值。
- **bot 消息**:`sender_name` 可能为空,`sender_id` 以 `B` 开头的是 Slack 机器人,
  Discord bot 在 `raw->sender` 里能看出来。需要排除 bot 时按这个判断。
- **`status` 列**:目前所有消息都是 `'new'`,这是内部回复工作流的占位字段,
  分析场景可以忽略。
- **不要长事务**:这是一份逻辑复制副本,长事务会拖累 WAL apply,影响实时性。
  分析查询尽量短跑短结束。
- **不要 `SELECT *` 拉大段历史**:`messages.raw` 是完整 JSON,单行可能几十 KB。
  按需选列,大批量导出请加 `LIMIT` + 分页(用 `(ts, message_id)` 做游标)。
- **行数会增长**:目前消息总量约 3.4 万,日增几百到几千条。Hermes 端如果做
  增量同步,推荐用 `imported_at > $last_seen` 作为 watermark(单调递增、有
  默认值、不会因平台时间倒序而漏)。
- **不要依赖 `agent.replies`**:这张表是我们自己回复链路的审计,Hermes 没必要读。

## 8. 联系

数据问题或需要新视图/索引,找:

- 运维:kouji
- 仓库:`/opt/beeper-matrix`(192.168.72.185 内网,Hermes 不直接访问)



