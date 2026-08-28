# 客户问题闭环引擎(Closed-Loop Engine)

> 状态:**P0 + P1 代码已完成并本地校验,待部署**。P2–P5 仍为设计。
> 关键架构决策已于 2026-06-15 锁定(见 [§2 决策](#2-已锁定的决策))。
>
> 已落地产物:`sql/issue_schema.sql`、`scripts/deploy-issue-schema.sh`、
> `services/issue-engine/`(config/markers/llm/detector/main)、`docker-compose.yml`
> 新增 `pixdesk-issue-engine`(profile `issues`)、`.env`/`.env.example` 配置。
> 部署 runbook 见 [§14](#14-部署-runbookp0--p1)。

PixDesk 在 `agent.*`(聊天)和 `ticket.*`(人工工单)**之上**再叠一层
**自动检测层 `issue.*`**:从客户聊天历史里自动切分出「一个问题」,跟踪它的
**开始 → 进行 → 闭环**,用确定性规则先把「未闭环(未解决)」兜住,LLM 只在
模糊处补刀,最后由人在面板上确认。目标是:**任何客户问题都不会再悄无声息地
漏掉**。

---

## 1. 背景:上周为什么会漏(根因)

| 现象 | 代码层根因 |
|---|---|
| 客户问题没人跟到底 | 工单 100% 靠人工开(`ticket.tickets` 全部手动 `POST`)。没人开 = 系统里压根不存在这个问题。 |
| 没有「问题生命周期」 | `agent.conversations` 只是 `listener` 按 **30 分钟时间窗**切的会话(`find_or_create_conversation`),`status` 永远停在 `open`,`resolved_at`/`resolved_by` 是**死字段**。一个窗里能混多个问题,一个问题也能跨多个窗。 |
| 判不出「客户问了没人回」 | `listener` 只采集 puppet ghost(`slack_*`/`discord_*`)发的消息;**客服自己发的不进 `agent.messages`**(在 `agent.replies` 里)。判「谁最后说话」必须 join 两张表 —— 现在没人做。 |
| 漏了也没人知道 | 全系统**没有任何主动推送**。容器全报 healthy,积压只能靠人主动去看。 |

**结论**:缺的不是「工单存储」,是一个**自动检测 + 生命周期跟踪 + 主动提醒 +
人工确认**的闭环层。

---

## 2. 已锁定的决策

| # | 决策点 | 选择 | 含义 |
|---|---|---|---|
| 1 | 存储方案 | **新建 `issue.*` schema + 独立服务/独立 DB 连接** | 不碰 `agent.*`/`ticket.*` 写路径;避开 ticket-api 的位置序列化器(`row[0..15]` 锁死)和单连接两大坑;有真正的状态机。 |
| 2 | LLM / 数据出域 | **外部 API(便宜的国产模型,OpenAI 兼容);本地模型已排除(185 无算力)** | `ISSUE_LLM_BACKEND=none\|api`,默认 `none`(纯启发式)。**核心检测全程在内网零外发**,仅启发式判不准的**少量疑难片段**才发外部模型,可随时关。具体模型待定(DeepSeek/Qwen/GLM/Doubao/Kimi 等任选,OpenAI 兼容)。 |
| 3 | 闭环自动确认尺度 | **仅「客户明确致谢」可自动确认,其余一律进人工** | 沉默/超时**永不**判闭环(这正是上周的坑);自动确认仅限显式致谢 + 宽限期 + 无重开。 |
| 4 | 告警方式 | **每日 digest + Webhook 外发**(不做实时 Matrix 群推/@人) | 每日定时编译「未闭环清单」;事件级/汇总级 payload 经 webhook 推给外部系统。 |

---

## 3. 核心思路

- **`issue` = 自动检测出的「一个客户问题」**(检测层);**`ticket` = 人工确认后的工作项**(人工层)。二者用 `issue.issues.ticket_id` 关联,各自独立生命周期。
- **启发式优先**:确定性规则(零 token、零外发)先把「未闭环」**兜底** —— 即使 LLM 完全关掉也成立,直接解决痛点。
- **LLM 只在模糊处补刀**(切分边界、闭环疑难),可插拔、可关、可降级。
- **闭环判定刻意做成「非对称」**:标红「未闭环」很容易,宣布「已闭环」很难。**沉默永远不算闭环**,这是防再次误判的核心护栏。
- **最终一定落到人**:面板上 确认 / 驳回 / 合并 / 升级为工单。

> **硬性红线(客户侧只读)**:闭环引擎对客户侧**完全只读**,**绝不**自动向客户群 /
> 客户发送任何内容。所有面向客户的回复永远只走现有人工 / `sender` 路径。系统的
> 所有"动作"都只发生在**内部**(面板、内部 digest、内部 webhook)。

```
Discord/Slack/Gmail ─► bridges ─► Synapse ─► listener ─► agent.messages / agent.replies
                                                              │ (只读)
                                                              ▼
                                       ★ pixdesk-issue-engine (新服务, profile=issues)
                                          · 角色判定 / 切分 / 生命周期状态机
                                          · 未闭环确定性地板(零AI)
                                          · 闭环对抗式判定(LLM 可选)
                                          · FastAPI @127.0.0.1:8767 + 后台检测线程(各自连接)
                                                              │ 写
                                                              ▼
                                                     issue.* (新 schema)
                                          逻辑复制(agent_pub/agent_sub)─► 腾讯只读镜像 ─► 分析 agent
                                                              │
                                                              ▼
                                       ★ Dashboard (挂现有 ticket-widget, OpenID→cookie)
                                          未闭环总览 / 按客户聚合 / 审核队列 → 升级为 ticket
                                                              │
                                                              ▼
                                       ★ 每日 digest + Webhook(复用 agent.webhook_config)
```

---

## 4. 数据模型(`issue.*`,照搬 `ticket_schema.sql` 的幂等/复制约定)

设计约定(与 ticket schema 一致):全部 `CREATE ... IF NOT EXISTS`;`uuid` 主键
`DEFAULT gen_random_uuid()`;跨 schema FK 一律 `DEFERRABLE INITIALLY DEFERRED`
(逻辑复制按 WAL 乱序 apply 不卡死);`metadata jsonb NOT NULL DEFAULT '{}'`;
`code` 序列(`ISS-N`)由 `BEFORE INSERT` 触发器填,镜像端序列不递增、只读无害。
**本服务一律用 dict-row 游标,绝不用位置索引**(规避 ticket-api 的位置序列化器坑)。

### 4.1 `issue.issues` —— 问题主体

```sql
CREATE SCHEMA IF NOT EXISTS issue;
CREATE SEQUENCE IF NOT EXISTS issue.issue_code_seq AS bigint START WITH 1;

CREATE TABLE IF NOT EXISTS issue.issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,                       -- ISS-N, 触发器填
  conversation_id uuid NOT NULL,                   -- FK→agent.conversations, DEFERRABLE
  -- 去规范化的「客户」键(检测时定格,避免会话 fork 后客户标签丢失):
  customer_platform text NOT NULL,
  customer_workspace_id text NOT NULL,
  customer_channel_id text NOT NULL,
  thread_id text,
  -- 真实客户(Gmail 必需: workspace_id 是客服收件箱, 不是客户):
  external_party_id text,
  external_party_name text,
  -- 内容:
  title text,                                      -- 启发式/LLM 一句话问题摘要
  summary text,                                    -- 滚动更新的问题描述
  -- 生命周期(与 review_state 正交, 引擎里有向图强约束):
  lifecycle_state text NOT NULL DEFAULT 'detected'
    CHECK (lifecycle_state IN ('detected','active','awaiting_agent','awaiting_customer',
                               'resolution_proposed','closed_inferred','closed_confirmed',
                               'reopened','dismissed')),
  review_state text NOT NULL DEFAULT 'unreviewed'
    CHECK (review_state IN ('unreviewed','confirmed','rejected','merged','promoted')),
  -- 未闭环 / 闭环 归因:
  nonclosure_reason text,                          -- unanswered_customer / idle_open / awaiting_customer_stale / reopened
  closure_reason text,                             -- customer_thanked / agent_confirmed / human / sla(禁用) ...
  closure_confidence real NOT NULL DEFAULT 0,      -- 0..1, 最近一次对抗式闭环分
  -- 角色/时序(未闭环判定主信号):
  last_speaker text CHECK (last_speaker IN ('customer','agent') OR last_speaker IS NULL),
  last_customer_at timestamptz,
  last_agent_at timestamptz,
  message_count int NOT NULL DEFAULT 0,
  -- 检测元信息:
  detector text NOT NULL,                          -- heuristic-v1 / llm-local-qwen / llm-claude
  confidence real NOT NULL DEFAULT 0,
  -- 时间线:
  opened_at timestamptz NOT NULL DEFAULT now(),    -- 问题首条客户消息 ts
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  sla_due_at timestamptz,                          -- 由状态 + SLA 计算
  closure_detected_at timestamptz,                 -- 引擎首次推断闭环
  closed_at timestamptz,                           -- 人工确认 / 宽限期到
  reopened_count int NOT NULL DEFAULT 0,
  -- 关联与审计:
  ticket_id uuid,                                  -- FK→ticket.tickets, 升级时填, DEFERRABLE
  merged_into_issue_id uuid,                        -- 自引用, 人工合并
  reviewed_by_mxid text,
  reviewed_at timestamptz,
  signals jsonb NOT NULL DEFAULT '{}',             -- 命中的启发式标记快照
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT issues_conversation_fk FOREIGN KEY (conversation_id)
    REFERENCES agent.conversations(id) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT issues_ticket_fk FOREIGN KEY (ticket_id)
    REFERENCES ticket.tickets(id) DEFERRABLE INITIALLY DEFERRED
);

-- 幂等再扫护栏: 同一会话同一问题段, 在「活跃」期间唯一; 检测器用
-- INSERT ... ON CONFLICT DO UPDATE 延长在途问题, 而非每条消息开一个新 issue。
CREATE UNIQUE INDEX IF NOT EXISTS issues_open_segment_uniq
  ON issue.issues (conversation_id, (metadata->>'segment_key'))
  WHERE lifecycle_state NOT IN ('closed_confirmed','dismissed');

-- 未闭环看板(主读路径):
CREATE INDEX IF NOT EXISTS issues_noncloop_idx
  ON issue.issues (customer_platform, customer_workspace_id)
  WHERE nonclosure_reason IS NOT NULL
    AND lifecycle_state NOT IN ('closed_confirmed','dismissed');
CREATE INDEX IF NOT EXISTS issues_active_state_idx
  ON issue.issues (lifecycle_state)
  WHERE lifecycle_state NOT IN ('closed_confirmed','dismissed');
CREATE INDEX IF NOT EXISTS issues_review_idx
  ON issue.issues (review_state) WHERE review_state = 'unreviewed';
CREATE INDEX IF NOT EXISTS issues_customer_idx
  ON issue.issues (customer_platform, customer_workspace_id);
CREATE INDEX IF NOT EXISTS issues_conversation_idx ON issue.issues (conversation_id);
CREATE INDEX IF NOT EXISTS issues_sla_idx
  ON issue.issues (sla_due_at)
  WHERE sla_due_at IS NOT NULL AND lifecycle_state NOT IN ('closed_confirmed','dismissed');
```

触发器 `issue.fill_issue_code()`(BEFORE INSERT)和 `issue.touch_updated_at()`
(BEFORE UPDATE)与 ticket schema 同构,此处略。

### 4.2 其余表

| 表 | 关键字段 | 用途 |
|---|---|---|
| `issue.issue_messages` | `(issue_id, platform, workspace_id, channel_id, message_id)` 复合 FK→`agent.messages`(DEFERRABLE),`role`(customer/agent/bot/system),`is_segment_start`,`signal_kind` | 问题 ↔ 证据消息映射(不动 `agent.messages`) |
| `issue.issue_signals` | 每次**闭环重判**一行:`evaluator`(heuristic/llm-affirm/llm-challenge/sla),`closure_score`,`signals jsonb`(客户是否致谢/客服是否给方案/有无未答问题/沉默秒数/负面情绪/LLM 双判/model/tokens),`verdict`(likely_closed/likely_open/uncertain),`cost_micros` | **可解释性**(面板答「凭啥说它闭/没闭」)+ 算准确率的标注语料 |
| `issue.issue_history` | `field`(无类型),`old/new jsonb`,`actor_mxid`(系统动作用 `@issue-engine:<server>`),`ts` | 审计流水,复用「相等则跳过」模式 |
| `issue.detector_cursor` | `detector PK`,`last_imported_at`,`last_message_pk jsonb`(同 ts 时 tie-break),`last_run_at` | 增量水位、断点续跑 |
| `issue.merge_links` | `kept_issue_id`,`merged_issue_id`,`actor_mxid`,`ts` | 合并审计/可撤销 |

`issue_messages` / `issue_signals` / `issue_history` 对 `issue.issues(id)` 的 FK 用
**普通 `ON DELETE CASCADE`**(同 schema 内,不需 deferrable),与 `ticket.*` 子表一致。

### 4.3 唯一对 `agent.*` 的改动

```sql
-- imported_at 现在无索引, 水位轮询会全表扫。publisher + subscriber 两边都建。
CREATE INDEX IF NOT EXISTS agent_messages_imported_at_idx
  ON agent.messages (imported_at);
```

**严禁**写 `agent.conversations.status='resolved'`(会改变 listener 的会话复用,
下条消息就 fork 出新会话行),也**严禁**改 `agent.messages.status`(listener 拥有
`new`,多消费者会互相覆盖)。检测层只读 `agent.*`,所有状态写进 `issue.*`。

---

## 5. 检测、生命周期与闭环判定

### 5.1 角色判定(客户 / 客服 / 机器人)

- **客服消息不在 `agent.messages`**:需 `UNION` `agent.replies`(客服回复审计)还原完整一来一回。
- **bot 过滤**:Slack `B-` 前缀 sender、Discord bot flag、空 sender。
- **Gmail 特判**:`(platform, workspace_id)` 是客服收件箱,客户取 `external_party_id`。
- **多客服**:运营身份用配置 `ISSUE_AGENT_SENDERS` 显式列;其余 puppet ghost 视为客户。
- ⚠️ 角色判错会直接造成漏检(把客户当客服 → 把「没回」当「回了」),**逐平台测试是硬要求**。

### 5.2 切分(一个问题段的边界)

确定性规则:`thread_id` 边界;**比 listener 的 30 分钟更短的** `ISSUE_GAP_SECONDS`
(让一个问题段细分会话);显式重开标记;闭环后又来新内容。仅在**边界模糊**时调 LLM。

### 5.3 生命周期(引擎 `_validate_transition` 强约束的有向图)

```
detected → active → {awaiting_agent | awaiting_customer} → resolution_proposed
        → {closed_inferred → closed_confirmed | reopened}
        (+ dismissed / merged / promoted 为侧向/终态)
```

| 状态 | 怎么从聊天判出来 |
|---|---|
| `detected`→`active` | 出现首条客户问题消息(问号 / 请求动词 `能不能/可以/请/帮我/how/can you/need` / 抱怨标记) |
| `awaiting_agent` | **最后说话是客户且无人回** ← **未闭环主信号**,球在我方 |
| `awaiting_customer` | 最后是客服在追问/等资料(`麻烦发一下/could you/请提供`)← 球在客户,SLA 更宽松 |
| `resolution_proposed` | 客服给了实质方案(`已处理/已修复/fixed/should work now`)—— 仅**武装**闭环判定,**不等于闭环** |
| `closed_inferred` | 见下「闭环判定」,仅推断,**尚未真闭** |
| `closed_confirmed` | 人工确认 **或** 仅「明确致谢」子类满足宽限期自动确认 |
| `reopened` | 闭环后客户又来(`还是不行/又出现了/it came back`)→ 拉回 `awaiting_agent`,`reopened_count++`,重新标红 |

### 5.4 「未闭环」确定性地板(零 token、零外发,LLM 关掉也成立)

> SLA 已定:**客户消息 2 小时未获回复即超时;7×24 服务,不避夜间、不分时区**(逻辑因此更简单,无需"工作时间"判断)。

- `unanswered_customer`:`last_speaker='customer'` 且距 `last_customer_at` 超过 **2 小时** → **红**
- `idle_open`:长期无活动且未达闭环
- `awaiting_customer_stale`:客服追问后客户长期不回(**较软**的提醒,不算我方失职)

### 5.5 闭环判定(非对称 + 对抗式 —— 防再次误判的核心)

- **沉默永远不算闭环**(就是上周的坑)。
- 进 `closed_inferred` 需 affirm 信号 **且** 零 challenge 信号;每次重判落一行 `issue_signals`。
- **自动确认仅限「客户明确致谢」**(`谢谢/搞定了/可以了/解决了/thanks, that fixed it`)+ `ISSUE_CLOSURE_GRACE_SECONDS` 宽限期 + 期间无重开触发 → `closed_confirmed`,`closure_reason='customer_thanked'`。
- **靠沉默/模糊推断的,永不自动确认,一律进人工队列。**
- **每来一条新消息都重判窗口**,绝不「一锤定音」,以便捕捉重开。

---

## 6. 面板(挂现有 `ticket-widget`,复用 OpenID→cookie)

1. **未闭环总览**:跨客户红榜,按停滞时长/SLA 排序 ← 直接回答「哪些客户没闭环」。
2. **按客户聚合**:`GROUP BY (customer_platform, customer_workspace_id)`,join `agent.channels` 取展示名;每客户 N 个未闭环 + 最久停滞。
3. **审核队列**:确认 / 驳回 / 合并 / **升级为工单**(调 ticket-api 现成 create 路径,`subject←title`,`conversation_id`,`created_by_mxid=审核员`)。
4. **检测健康**:水位延迟、LLM 调用数/成本、启发式 vs LLM 占比、**各平台覆盖率**(Telegram/掉事件标「采集不全」,避免假信任)。
5. **问题详情抽屉**:重建完整对话 + `issue_history` 时间线 + `issue_signals` 解释。

**鉴权**(面板是跨客户的,**不能**复用 widget 的「必须在某房间内」逻辑):新增
非房间作用域的 `/api/v1/dashboard/*` + `/api/v1/queue/*` BFF 路由,用
**审核员 allowlist 或指定客服 Matrix 房间/space 成员**鉴权(复用 admin token 查
`/joined_members` + 30s 缓存 + 写前强刷)。不变量保持:`X-Actor-Mxid` 永远由
服务端从签名 cookie 注入,**绝不**信前端;共享密钥**绝不**进浏览器。需要一个
非 Element 的登录入口(现有唯一没有对应物的部分)。

---

## 7. 通知(决策 4:每日 digest + Webhook)

- **每日 digest**:引擎内定时任务,每天编译「当前未闭环清单 + 当日新增/已闭」,通过 webhook 投递,并在面板留存。
- **Webhook**:复用闲置的 `agent.webhook_config`(事件级如 `issue.sla_breach`,或汇总级 digest payload),推给外部系统(飞书/钉钉/Slack incoming webhook 等)。
- **不做**实时 Matrix 群推 / @人(按决策)。
- **推送目标只能是内部/团队系统**(团队 IM 群、运维系统),**绝不**指向任何客户群/客户。这是上面「客户侧只读」红线的一部分。
- ⚠️ 待你提供:**webhook 目标 URL + 外部系统类型(飞书/钉钉/Slack…)+ digest 推送时刻**。

---

## 8. LLM 与数据出域(决策 2:外部 API,本地已排除)

部署机(185)无 GPU / 算力余量,本地自托管不可行 → AI 档**直接调外部 API**;
具体选一个**便宜的国产模型**(待定:DeepSeek / 通义千问 Qwen / 智谱 GLM /
豆包 Doubao / Kimi 等,均提供 **OpenAI 兼容**端点)。

- `ISSUE_LLM_BACKEND=none | api`,**默认 `none`**(纯启发式,P1–P3 全程零外发)。
- **外发面极小**:LLM **只**处理启发式判不准的**少量疑难片段**(切分边界、闭环疑难),
  **不是**把全部聊天都发出去。整个「未闭环兜底」与生命周期判定都在内网完成,**与 LLM 无关**。
- 客户端写成**通用 OpenAI 兼容**(`base_url` + `api_key` + `model`),换模型只改配置。
- **可选最小化/脱敏**:外发片段可裁到判定所需的最小上下文,敏感字段可脱敏(实施期评估)。
- **每日 token/¥ 预算**,耗尽自动降级到 `none`(失败永远倒向「进人工」,绝不倒向「误判闭环」)。
- model 元信息(模型名/版本/tokens/成本)落 `issue_signals`(`docs/agent-integration.md` 一直想要、目前没有的东西)。
- ⚠️ **诚实说明**:开启 `api` 后,**疑难片段的聊天文本会发往外部模型**,这部分不再"数据不出域"。
  核心闭环能力(P1–P3)不依赖它;若合规要求严格,可长期保持 `ISSUE_LLM_BACKEND=none`。
- ⚠️ 待你提供:**选定的模型 + 其 API base_url / key**。

---

## 9. 复制与部署

- `sql/issue_schema.sql` + `scripts/deploy-issue-schema.sh` **照抄** `deploy-ticket-schema.sh`:`set -euo pipefail`、`sshpass` 双机、`psql -v ON_ERROR_STOP=1`、**publisher 先 / subscriber 后** DDL、给 `agent_ro` + replicator `USAGE/SELECT/DEFAULT PRIVILEGES`、`ALTER PUBLICATION agent_pub ADD TABLES IN SCHEMA issue`(已发布则跳过)、`ALTER SUBSCRIPTION agent_sub REFRESH PUBLICATION`、查 `pg_subscription_rel` 目检。
- `agent_messages_imported_at_idx` 在 publisher + subscriber **两边**建(索引不复制)。
- 引擎用**自己的 psycopg2 连接**(绝不挤 ticket-api 单连接);检测循环单独线程,回灌不饿死面板读。
- 升级为工单**仍走 ticket-api 现成 create 路径**,保持低频/人工驱动,不冲击交互式 widget。
- 部署机非 git repo → `scp` 到 `/opt/beeper-matrix`;`TC_PASS` 含反引号要**单引号**包。
- docker-compose 新增 `pixdesk-issue-engine`(profile `issues`)+(可选)`pixdesk-llm-local`(profile `issues`)。
- ⚠️ **绝不**在只读腾讯镜像上跑长查询/全表 `SELECT *`(会拖垮 WAL apply)。面板/检测读 LAN 主库或受控镜像。

---

## 10. 分期路线(每期独立可上线)

| 期 | 内容 | 价值 |
|---|---|---|
| **P0** | `issue` schema + 复制 + `imported_at` 索引 | 零行为变更,先跑通复制/授权 |
| **P1** | **纯启发式检测引擎**(`ISSUE_LLM_BACKEND=none`)+ 35k 历史回灌 + 未闭环入库 | **无 AI、无 UI 就已解决核心痛点**:每个无人回的客户消息都进了 DB |
| **P2** | 面板 + 人工队列 + 审核员鉴权 + 升级为工单 | 「哪些客户没闭环」变一屏;闭环落到人 |
| **P3** | **每日 digest + Webhook 外发** | 真正「主动闭环」,不再靠人记得看 |
| **P4** | 外部 API 补刀(**仅疑难片段**)+ 对抗式闭环 + `issue_signals` + 仅致谢自动确认 | 降队列量、提精度 |
| **P5** | 准确率(精度/召回)度量报告 + 成本看板 | 可量化「漏没漏」、控成本 |

---

## 11. 必须正视的盲点(诚实列出 + 缓解)

| 盲点 | 说明 | 缓解 |
|---|---|---|
| **reaction/emoji/编辑/撤回不入库** | `listener` 只收 `m.room.message`。客户用 👍 表态「解决了」现在**看不见**。 | P4 起补采 `m.reaction`;或明确只认文字致谢。 |
| **纯图片问题** | `看这个`+截图、无关键词,启发式会漏 —— 正是要修的失败模式。 | 面板对「无文本消息」做兜底提示;OCR/vision 单独评估(成本+出域)。 |
| **假阴性(漏检)最危险且最难测** | 漏掉的问题不在表里,无法靠精度发现,会让面板看着健康、痛点悄悄复发。 | 建**人工标注评测集**专测召回率;P5 出周报。 |
| **回灌洪水** | 35k 消息可能切出**上千条**历史问题。 | 决策=**按真实时间跑,不按年龄丢弃**;启发式兜底天然过滤(已答/已致谢的不标红);面板按停滞时长排序 + 「历史/backfill」过滤分流。真未解决的历史问题会真实浮出(可能含上周那条)。 |
| **角色误判** | Gmail 收件箱、多客服团队判错谁说话 → 直接漏检。 | `ISSUE_AGENT_SENDERS` + 逐平台测试。 |
| **采集不全** | `listener` 不处理 Telegram、且会丢「bridge SQLite 行没出现」的事件。 | 面板做**各平台覆盖率指示器**,明确标注 gap。 |

---

## 12. 参数确认状态

| # | 参数 | 状态 | 结论 / 待办 |
|---|---|---|---|
| 1 | SLA 阈值 / 工作时间 | ✅ **已定** | 客户消息 **2 小时**未回即超时;**7×24**,不避夜间、不分时区 |
| 2 | 审核员授权 + 面板登录 + 是否出 LAN | ⏳ **待定** | 关联「客户感受」红线 —— 系统对客户侧只读、绝不向客户群发东西(已写入红线)。授权来源(`REVIEWER_ALLOWLIST` vs 客服房间成员)、登录方式、是否出 LAN 待定 |
| 3 | 回灌分流 | ✅ **已定** | **按真实时间跑**,不按年龄丢弃;面板排序 + 历史过滤分流 |
| 4 | Webhook 目标 + digest 时刻 | ⏳ **待提供** | 目标 URL + 外部系统 + 推送时刻(只能指向内部/团队系统) |
| 5 | AI 后端 | ✅ **已定方向** | 本地不可行 → **外部 API(便宜国产模型,OpenAI 兼容)**;默认 `none` 纯启发式。**具体模型 + base_url/key 待提供** |

---

## 13. 新增配置项(`.env`)

```ini
ISSUE_API_SHARED_SECRET=        # BFF ↔ issue-engine 信任边界(同 ticket-api 模式)
ISSUE_LLM_BACKEND=none          # none(默认, 纯启发式, 零外发) | api
ISSUE_LLM_BASE_URL=             # 待定: OpenAI 兼容端点(便宜国产模型)
ISSUE_LLM_API_KEY=              # 待定: 外部模型 key
ISSUE_LLM_MODEL=                # 待定: 模型名
ISSUE_LLM_DAILY_BUDGET_CNY=     # 每日预算(¥), 耗尽自动降级到 none
ISSUE_AGENT_SENDERS=            # 运营身份(逗号分隔), 角色判定用
ISSUE_GAP_SECONDS=600           # 问题段切分间隔(< listener 的 1800)
ISSUE_SLA_UNANSWERED_SECONDS=7200   # ✅ 2 小时(7×24, 不避夜间)
ISSUE_CLOSURE_GRACE_SECONDS=259200  # 致谢后自动确认宽限(默认 72h)
REVIEWER_ALLOWLIST=             # 待定: 或改用客服房间成员判定
ISSUE_DIGEST_CRON=              # 待定: 每日 digest 时刻
ISSUE_WEBHOOK_URL=              # 待定: 仅指向内部/团队系统
```

---

## 14. 部署 runbook(P0 + P1)

> P0(建表+复制)和 P1(纯启发式检测+回灌)**不需要任何待定项**即可上线;
> 二者均不触碰 `agent.*`/`ticket.*` 写路径。LLM 默认 `none`、零外发。
> 部署机非 git repo,代码靠 `scripts/deploy-issue-schema.sh` 内的 scp 推送。

```bash
# 1. 在 185 的 .env 里加引擎密钥(本地仓库已生成一份样例,生产请另生成)
ssh root@192.168.72.185 \
  "grep -q '^ISSUE_API_SHARED_SECRET=' /opt/beeper-matrix/.env || \
   echo \"ISSUE_API_SHARED_SECRET=\$(openssl rand -base64 24 | tr -d /+= | head -c 32)\" \
   >> /opt/beeper-matrix/.env"
# 同时把 ISSUE_LLM_* 几行(BASE_URL/API_KEY/MODEL,默认 BACKEND=none)写入 185 的 .env

# 2. 推 schema + 授权 + 扩 publication + 刷 subscription(两机,幂等)
./scripts/deploy-issue-schema.sh

# 3. 把新服务代码同步到 185(scp 整个 services/issue-engine + 改后的 compose)
#    (非 git repo,用 scp;compose 已含 pixdesk-issue-engine / profile issues)

# 4. P1 首跑:一次性历史回灌(35k 消息,按真实时间),跑完自动转增量
ssh root@192.168.72.185 'cd /opt/beeper-matrix && \
  ISSUE_BACKFILL=1 docker compose --profile issues up -d pixdesk-issue-engine'
docker logs -f beeper-matrix-pixdesk-issue-engine-1   # 看 "backfill complete"

# 5. 回灌完成后去掉 ISSUE_BACKFILL 重启,进入 30s 增量循环
ssh root@192.168.72.185 'cd /opt/beeper-matrix && \
  ISSUE_BACKFILL= docker compose --profile issues up -d pixdesk-issue-engine'

# 6. 冒烟:看未闭环清单(localhost-only,带 Bearer)
ssh root@192.168.72.185 \
  'SECRET=$(grep ^ISSUE_API_SHARED_SECRET= /opt/beeper-matrix/.env | cut -d= -f2-); \
   curl -s -H "Authorization: Bearer $SECRET" http://127.0.0.1:8768/healthz; echo; \
   curl -s -H "Authorization: Bearer $SECRET" http://127.0.0.1:8768/v1/issues/unclosed | head -c 800'
```

### 本地已做的校验

- 5 个引擎模块 `py_compile` 全过。
- 检测核心 14 项逻辑/回归测试全过(含闭环安全三类:重开优先于致谢、致谢+重开同句不闭环、null ts 不崩)。
- GLM 端点连通性验证通过(`zai-org/glm-5.1`,返回 CLOSED;注意该模型有 reasoning token,`max_tokens` 已放宽)。
- 全部 `cur.execute` 的 `%s` 占位符与参数个数 AST 校验一致;`issue.issues` INSERT 24/24,UPDATE 18/18,且所有列在 DDL 中存在。
- `docker compose --profile issues config` 解析通过,默认 `ISSUE_LLM_BACKEND=none`。
- 经一轮对抗式代码评审并修复:`opened_at` 空值、水位 tie 截断漏扫、游标越过失败会话、`closure_detected_at` 不复位、读端共享连接并发不安全 —— 均已修。

### 仍未做(按设计,后续期)

- **P2**:面板 + 人工队列 + 审核员鉴权 + 写端点(confirm/reject/merge/promote)。审核员授权方式**待定**。
- **P3**:每日 digest + Webhook 外发(目标 URL **待提供**)。
- **P4**:GLM 接入对抗式闭环判定(`ISSUE_LLM_BACKEND=api`)+ `issue_signals`。
- **P5**:精度/召回度量报告 + 成本看板。
