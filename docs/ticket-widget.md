# Ticket Widget(Element 侧边面板)

把 ticket-api 的能力嵌进 Element,客服在任何 bridged 房间(Slack 频道、
Discord 频道、群 DM)右侧面板就能看 / 改 / 建工单。Web、Desktop、
Element X mobile 同一份代码。

## 总体形态

```
[Element web/desktop/Element X]
        │  iframe + Matrix Widget API
        ▼
http://192.168.72.185:8767/widget/?roomId=...
        │  (静态 SPA + matrix-widget-api SDK)
        ▼  /api/auth + /api/v1/*
ticket-widget BFF (FastAPI, container 8767)
        │  inject Bearer + X-Actor-Mxid
        ▼
ticket-api (127.0.0.1:8766)
```

BFF 是信任边界:浏览器永远拿不到 ticket-api 的 bearer secret,只持有一份
`pixdesk_ticket_session` cookie(50 分钟,itsdangerous 签名)。`X-Actor-Mxid`
header 由 BFF 从 cookie 写入,**前端无法伪造**。

## 鉴权

每次客服在 Element 里打开 widget:
1. widget JS 调 `widget.requestOpenIDConnectToken()`,Element 弹一次确认后
   返回一份 OpenID token。
2. widget POST `/api/auth { openid_token }`。
3. BFF 调 Synapse `GET /_matrix/federation/v1/openid/userinfo?access_token=…`
   验证 token,拿到 `sub` 字段(mxid),签 cookie 返回。
4. 后续所有 `/api/v1/*` 走 cookie。
5. cookie 过期 → 前端收到 401 → 自动重做 1-3,用户无感。

「能不能开 / 看这条对话的工单?」 = 「是不是这个 Matrix 房间的当前成员?」
BFF 用 admin token 调 `/_matrix/client/v3/rooms/{room_id}/joined_members`
校验,30 秒 LRU 缓存。任何写操作前主动失效该缓存项重新拉,避免被踢的人
30 秒内还能写。

## v1 实现的 UI

- 工单列表(主题 + 状态 + 优先级 + 受理人)
- 详情(主题 / 描述 / 状态 / 优先级 / 受理人 / 标签 / 客户 / 评论)
- 新建工单(主题 / 描述 / 受理人 / 优先级 / 状态 / 标签 / 模板 / 截止时间)
  —— 客户字段从 `roomId` 隐式得到,不让选
- 改状态/优先级/受理人 + 评论合并到一个 PATCH 事务
- 评论 列表 / 加 / 删自己的(对应截图里的「内部备注」开关)
- 模板下拉(创建表单默认值)

## v1 没做的(留给 v1.1)

- 附件 上传 / 下载 / 删
- 详情页里增减关注人(创建时还能传初始关注人,但这次没拿到 UI)
- pin / unpin agent.messages
- 完整 history view(v1 仅展示计数,审计走 `agent_ro` 拉表)
- customer 搜索(widget 永远绑定一个 room,客户固定,无意义)

## 部署

```bash
# 在 185 .env 里加 cookie 签名密钥
echo "WIDGET_COOKIE_SECRET=$(openssl rand -base64 24 | tr -d /+= | head -c 32)" \
  >> /opt/beeper-matrix/.env

# 推全量改动到 185(scp ticket-widget 服务、scripts、docker-compose、element 配置)
# 起容器
docker compose --profile tickets up -d --build pixdesk-ticket-widget

# 让 element 加载新的 permittedWidgets 配置
docker compose up -d element

# 给现有 bridged 房间装 widget
MATRIX_ADMIN_USER_ID="@admin:192.168.72.185" \
MATRIX_ADMIN_ACCESS_TOKEN="$(grep ^ADMIN_ACCESS_TOKEN= /opt/beeper-matrix/.env | cut -d= -f2-)" \
python3 /opt/beeper-matrix/scripts/install-ticket-widget.py
```

`install-ticket-widget.py` 把 `m.widget` 和 `im.vector.modular.widgets` 两份
state 事件都写一遍(Element legacy 兼容),失败的房间会列在最后,运维在
那个房间里手动跑 `/addwidget …` 兜底。

## 手动安装

如果脚本在某些房间因为 power level 不够装不上,在 Element 里打开那个房间,
聊天框输入:

```
/addwidget http://192.168.72.185:8767/widget/?roomId=$matrix_room_id&widgetId=$matrix_widget_id&theme=$matrix_theme
```

`$matrix_*` 是 Element 的特殊变量,会在 widget URL 里被替换成实际值,**不要**
自己填。

## 卸载

```bash
python3 /opt/beeper-matrix/scripts/uninstall-ticket-widget.py
```

发空 content 给 widget state 事件,Element 把面板隐藏。如果只想从单个房间
撤掉,在那个房间右侧应用列表点 widget → 移除。

## 常见 troubleshooting

- **「Load widget?」每次都弹** —— `element/config.json` 里
  `settingDefaults.permittedWidgets` 没把 widget origin 加进去,或者改完没
  重启 element 容器。
- **widget 一直转 / 报 OpenID failed** —— 检查 BFF 容器是否能访问
  `http://synapse:8008`(`docker exec pixdesk-ticket-widget curl -s synapse:8008/_matrix/federation/v1/version`)。
- **403 not a member of this room** —— admin token 已过期,或被踢出该房间;
  让 listener 重新跑一遍(它会把 admin 自动 join 回所有 bridged 房间)。
- **创建时 409 "no conversation"** —— 这个房间还没人发过消息(listener 没建
  conversation),等第一条消息进来再开单。
- **Element X(mobile)widget 加载失败** —— Element X 的 widget 支持还在
  rolling out;先用 web/desktop。
