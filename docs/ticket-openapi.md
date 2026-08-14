# 工单开放 API（官网工单系统对接）

给 Novita 官网工程团队的只读工单数据接口。数据来自支持团队的闭环引擎
（Slack/Discord 客户群实时抽取），每条工单附带 CRM 客户档案
（`uuid`/`company`/`level`），可直接用 `uuid` 关联官网自己的账号体系。

## 基础信息

- **Base URL**：`http://124.221.98.230:8767/openapi/v1`
- **认证**：每个请求带 `Authorization: Bearer <API_KEY>`（key 找辉二申请）。
  未带或错误 → `401`；服务端未配置 key → `503`（fail closed）。
- 全部为 **GET / 只读**，返回 JSON（UTF-8）。时间均为 ISO-8601 UTC。
- 内部标记为「供应商/内部」的频道已被过滤，不会出现在任何响应里。

## 端点

### 1. `GET /tickets` — 工单列表

| 参数 | 说明 |
|---|---|
| `status` | `all`（默认）/ `open` / `closed` |
| `customer_uuid` | 只要该 CRM 客户（uuid）的工单 |
| `platform` | `slack` / `discord` |
| `updated_after` | ISO 时间戳，只返回此后有活动的工单（**增量同步用**，严格大于） |
| `limit` / `offset` | 分页，limit 默认 50、最大 200 |

响应：`{ items: [Ticket], total, limit, offset }`，按最近活动倒序。

**增量同步建议**：记录上次拉取时最大的 `last_activity_at`，下次用
`updated_after=<该值>` 轮询（分钟级即可）。

### 2. `GET /tickets/{id}` — 单条工单

`id` 为工单 uuid（`items[].id`；路径参数也兼容 `ISS-91294` 这样的展示编号）。
响应为单个 Ticket 对象；不存在 → 404。

### 3. `GET /tickets/{id}/transcript` — 工单聊天记录

响应：`{ ticket_id, count, messages: [{ ts, role, sender_name, text }] }`，
按时间正序。`role` = `customer` | `agent`（我方）| `bot`。

### 4. `GET /customers` — 客户目录

响应：
- `customers[]`：每个有工单的聊天频道一行 —— `platform / workspace_id /
  channel_id / channel_name / total_tickets / open_tickets / first_ticket_at /
  last_activity_at / account`（同 Ticket.customer.account，未挂 CRM 时为 null）。
- `accounts[]`：**完整 CRM 重点客户名单**（含没有聊天频道的公司）——
  `uuid / company / level(L5-L7) / sales / mapped_channels`。

## Ticket 字段

| 字段 | 说明 |
|---|---|
| `id` | 工单 uuid（稳定主键，满足 UUID 校验） |
| `code` | **与 `id` 同值**（同一个 uuid，任取其一作键） |
| `display_code` | 人类可读的展示编号，如 `ISS-91294`（界面展示用） |
| `uuid` | 同 `id`（冗余字段，兼容保留） |
| `title` / `summary` / `summary_zh` | 标题 / 英文摘要 / 中文摘要 |
| `next_action_zh` | 系统建议的下一步（中文，可能为空） |
| `status` | 简化状态：`open` / `closed` |
| `lifecycle_state` | 细粒度：`awaiting_agent`(待我方) `active` `awaiting_customer`(等客户) `resolution_proposed` `closed_inferred`(疑似闭环) `closed_confirmed`(人工确认闭环) `reopened` |
| `nonclosure_reason` | 未闭环原因：`unanswered_customer`(客户在等我方) `idle_open` `awaiting_customer_stale`，无 → null |
| `products` | 涉及产品标签，如 `["LLM","API"]` |
| `opened_at` / `last_activity_at` / `closed_at` | 开单 / 最近活动 / 闭环时间 |
| `last_speaker` / `last_customer_at` / `last_agent_at` | 最后发言方及双方最后发言时间 |
| `message_count` / `reopened_count` | 消息数 / 重开次数 |
| `closed_by` | 确认闭环的支持同事花名（人工闭环时有值） |
| `escalated_ticket_id` | 升级 SRE 的外部工单号（未升级 → null） |
| `customer.platform/workspace_id/channel_id/channel_name` | 来源聊天频道 |
| `customer.contact_name` | 对话中的客户联系人名 |
| `customer.account` | CRM 档案 `{ uuid, company, level, sales }`；频道未挂 CRM 客户时为 null。**`uuid` 是字符串**：可能是 CRM 式 UUID（`f09167dd-…`），也可能是官网账号体系的数字 ID（如 `4361855174763120`），对接时请按不透明字符串处理 |

## 示例

```bash
# OpenRouter（L7）的未闭环工单
curl -s -H "Authorization: Bearer $KEY" \
  "http://124.221.98.230:8767/openapi/v1/tickets?customer_uuid=f09167dd-28c3-492c-90a8-7b3adbae678e&status=open"

# 增量同步
curl -s -H "Authorization: Bearer $KEY" \
  "http://124.221.98.230:8767/openapi/v1/tickets?updated_after=2026-07-21T06:00:00Z&limit=200"
```

```json
{
  "id": "e4d0dd8c-…", "code": "e4d0dd8c-…", "display_code": "ISS-91294",
  "title": "Token/request count discrepancy vs Novita billing",
  "summary_zh": "客户提供了…询问这些请求被收取了多少费用…",
  "status": "open", "lifecycle_state": "awaiting_agent",
  "nonclosure_reason": "unanswered_customer",
  "products": ["LLM", "Billing", "API"],
  "opened_at": "2026-07-13T19:55:00Z", "last_activity_at": "2026-07-15T17:14:00Z",
  "closed_at": null, "closed_by": null,
  "customer": {
    "platform": "slack", "channel_name": "ext-openrouter-novita-billing",
    "contact_name": "quinn",
    "account": { "uuid": "f09167dd-28c3-492c-90a8-7b3adbae678e",
                 "company": "OpenRouter", "level": "L7", "sales": "junyu" }
  }
}
```

## 运维备注（我方）

- 网关：ticket-widget `/openapi/v1/*`（`require_openapi_key`）→ 引擎
  `/v1/open/*`（内网 + shared secret）。key 配在腾讯 `/opt/pixdesk-issue/.env`
  的 `TICKET_OPENAPI_KEYS`（逗号分隔可多把，轮换=加新删旧+重建 widget 容器）。
- 引擎实现：`services/issue-engine/main.py` `open_tickets` 等 4 个端点。
