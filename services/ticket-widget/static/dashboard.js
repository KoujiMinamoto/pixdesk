// PixDesk Closed-Loop Engine dashboard.
// Cross-customer view of auto-detected issues: 未闭环 list, per-customer rollup,
// and a human review queue (confirm / reject / merge / promote-to-ticket).
// Auth reuses the widget's OpenID->cookie flow; the BFF gates by reviewer
// allowlist (not room membership), so api() does NOT append room_id.

(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const widgetIdRaw = params.get("widgetId") || "";
  const userIdRaw = params.get("userId") || "";
  const widgetId = widgetIdRaw && !widgetIdRaw.startsWith("$") ? widgetIdRaw : null;
  const userIdFromUrl = userIdRaw && !userIdRaw.startsWith("$") ? userIdRaw : null;

  const REASON_LABELS = {
    unanswered_customer: "客户未获回复",
    idle_open: "长期无进展",
    awaiting_customer_stale: "等客户太久",
    reopened: "已重开",
  };
  const STATE_LABELS = {
    detected: "已检测", active: "进行中", awaiting_agent: "待我方回复",
    awaiting_customer: "待客户", resolution_proposed: "疑似已答",
    closed_inferred: "疑似已闭环", closed_confirmed: "已闭环",
    reopened: "已重开", dismissed: "已忽略",
  };

  const $status = document.getElementById("status");
  const $view = document.getElementById("view");

  function setStatus(msg, kind) {
    $status.textContent = msg || "";
    $status.className = "status" + (kind ? " " + kind : "");
  }

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === "class") node.className = v;
        else if (k === "onclick") node.addEventListener("click", v);
        else if (k === "html") node.innerHTML = v;
        else node.setAttribute(k, v);
      }
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return node;
  }

  function fmtAge(iso) {
    if (!iso) return "—";
    const then = new Date(iso).getTime();
    const secs = Math.max(0, (Date.now() - then) / 1000);
    if (secs < 3600) return Math.round(secs / 60) + " 分钟";
    if (secs < 86400) return (secs / 3600).toFixed(1) + " 小时";
    return (secs / 86400).toFixed(1) + " 天";
  }

  function customerLabel(row) {
    return row.channel_name || row.external_party_name ||
      (row.customer_workspace_id || "?") ;
  }


  // -------------------------------------------------------------------------
  // Auth: OpenID -> cookie (reuses the widget's BFF /api/auth). The dashboard
  // is cross-customer, so the URL flow needs no room_id; we use OpenID when
  // embedded in Element, falling back to a clear message otherwise.
  // -------------------------------------------------------------------------

  let widgetApi = widgetId ? new mxwidgets.WidgetApi(widgetId) : null;
  let sessionMxid = null;

  function startWidget() {
    return new Promise((resolve, reject) => {
      let settled = false;
      widgetApi.on("ready", () => { if (!settled) { settled = true; resolve(); } });
      widgetApi.on("error", (e) => console.warn("widget api error", e));
      widgetApi.requestCapabilities([]);
      widgetApi.start();
      Promise.resolve().then(() => widgetApi.sendContentLoaded())
        .catch((e) => console.warn("sendContentLoaded failed", e));
      setTimeout(() => {
        if (!settled) { settled = true; reject(new Error("Element 未响应 widget 握手")); }
      }, 20000);
    });
  }

  async function obtainSession() {
    if (!widgetApi) {
      throw new Error("看板需在 Element 中打开(用于身份认证),或配置独立登录");
    }
    setStatus("等待 Element 响应…");
    await startWidget();
    setStatus("正在请求 OpenID…");
    const tok = await widgetApi.requestOpenIDConnectToken();
    setStatus("正在兑换 session…");
    const resp = await fetch("/api/auth", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openid_token: tok.access_token,
                             matrix_server_name: tok.matrix_server_name }),
    });
    if (!resp.ok) throw new Error("auth 失败: " + (await resp.text()));
    sessionMxid = (await resp.json()).mxid;
    setStatus("已登录:" + sessionMxid, "ok");
    setTimeout(() => setStatus(""), 2000);
  }

  // HTTP helper with one auto re-auth on 401. No room_id (cross-customer).
  async function api(path, opts) {
    opts = opts || {};
    const init = {
      method: opts.method || "GET",
      credentials: "same-origin",
      headers: opts.headers || {},
    };
    if (opts.json !== undefined) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(opts.json);
    }
    let resp = await fetch(path, init);
    if (resp.status === 401) {
      await obtainSession();
      resp = await fetch(path, init);
    }
    if (resp.status === 403) {
      throw new Error("无权限:你的账号不在审核员名单里(请联系管理员配置 REVIEWER_ALLOWLIST)");
    }
    if (!resp.ok) throw new Error(await resp.text());
    const ct = resp.headers.get("content-type") || "";
    return ct.includes("application/json") ? resp.json() : resp.text();
  }


  // -------------------------------------------------------------------------
  // Views
  // -------------------------------------------------------------------------

  function reasonChip(reason) {
    if (!reason) return el("span", { class: "muted" }, "—");
    return el("span", { class: "reason " + reason }, REASON_LABELS[reason] || reason);
  }

  function issueRow(it, cols) {
    const tr = el("tr", { class: "clickable", onclick: () => openDrawer(it.id) });
    for (const c of cols) tr.appendChild(c(it));
    return tr;
  }

  async function renderUnclosed() {
    $view.innerHTML = "";
    $view.appendChild(el("div", { class: "muted" }, "加载中…"));
    const data = await api("/api/v1/dashboard/unclosed");
    const items = data.items || [];
    $view.innerHTML = "";
    if (!items.length) {
      $view.appendChild(el("div", { class: "empty" }, "🎉 当前没有未闭环的问题"));
      return;
    }
    const head = el("tr", null,
      el("th", null, "客户"), el("th", null, "问题"),
      el("th", null, "原因"), el("th", null, "状态"), el("th", null, "停滞"));
    const rows = items.map((it) => issueRow(it, [
      (x) => el("td", null, customerLabel(x)),
      (x) => el("td", null, (x.title || "(无文本)").slice(0, 60)),
      (x) => el("td", null, reasonChip(x.nonclosure_reason)),
      (x) => el("td", null, el("span", { class: "state" }, STATE_LABELS[x.lifecycle_state] || x.lifecycle_state)),
      (x) => el("td", null, el("span", { class: "stale" }, fmtAge(x.last_activity_at))),
    ]));
    $view.appendChild(el("table", { class: "dash" }, el("thead", null, head), el("tbody", null, rows)));
    setStatus(items.length + " 个未闭环", "");
  }

  async function renderRollup() {
    $view.innerHTML = "";
    $view.appendChild(el("div", { class: "muted" }, "加载中…"));
    const data = await api("/api/v1/dashboard/rollup");
    const items = data.items || [];
    $view.innerHTML = "";
    if (!items.length) {
      $view.appendChild(el("div", { class: "empty" }, "🎉 没有任何客户有未闭环问题"));
      return;
    }
    const head = el("tr", null,
      el("th", null, "客户"), el("th", null, "平台"),
      el("th", null, "未闭环数"), el("th", null, "最久停滞"));
    const rows = items.map((c) => el("tr", { class: "clickable",
      onclick: () => { switchTab("unclosed"); } },
      el("td", null, c.channel_name || c.customer_workspace_id || "?"),
      el("td", null, c.customer_platform),
      el("td", null, el("span", { class: "stale" }, String(c.unclosed))),
      el("td", null, fmtAge(c.oldest_unclosed_at))));
    $view.appendChild(el("table", { class: "dash" }, el("thead", null, head), el("tbody", null, rows)));
    setStatus(items.length + " 个客户有未闭环", "");
  }

  async function renderQueue() {
    $view.innerHTML = "";
    $view.appendChild(el("div", { class: "muted" }, "加载中…"));
    // The review queue = unreviewed issues (any lifecycle), newest activity first.
    const data = await api("/api/v1/dashboard/issues?limit=200");
    const items = (data.items || []).filter((x) => x.review_state === "unreviewed");
    $view.innerHTML = "";
    $view.appendChild(el("div", { class: "warn-banner" },
      "审核队列:确认=真问题继续跟踪;忽略=非问题/噪声;合并=与另一问题重复;升级=转为人工工单。"));
    if (!items.length) {
      $view.appendChild(el("div", { class: "empty" }, "队列已清空"));
      return;
    }
    const head = el("tr", null,
      el("th", null, "客户"), el("th", null, "问题"),
      el("th", null, "状态"), el("th", null, "活动"), el("th", null, "操作"));
    const rows = items.map((it) => el("tr", null,
      el("td", { onclick: () => openDrawer(it.id), class: "clickable" }, customerLabel(it)),
      el("td", { onclick: () => openDrawer(it.id), class: "clickable" }, (it.title || "(无文本)").slice(0, 50)),
      el("td", null, el("span", { class: "state" }, STATE_LABELS[it.lifecycle_state] || it.lifecycle_state)),
      el("td", null, fmtAge(it.last_activity_at)),
      el("td", null,
        el("button", { class: "secondary", onclick: () => act(it.id, "confirm") }, "确认"),
        " ",
        el("button", { class: "secondary", onclick: () => act(it.id, "reject") }, "忽略"),
        " ",
        el("button", { onclick: () => openDrawer(it.id) }, "详情"))));
    $view.appendChild(el("table", { class: "dash" }, el("thead", null, head), el("tbody", null, rows)));
    setStatus(items.length + " 个待审核", "");
  }


  // -------------------------------------------------------------------------
  // Actions + detail drawer
  // -------------------------------------------------------------------------

  async function act(issueId, action) {
    try {
      setStatus("提交中…");
      await api(`/api/v1/dashboard/issues/${issueId}/review`,
        { method: "POST", json: { action } });
      setStatus("已" + (action === "confirm" ? "确认" : "忽略"), "ok");
      closeDrawer();
      refresh();
    } catch (e) { setStatus(String(e.message || e), "error"); }
  }

  async function promote(issueId) {
    const subject = prompt("工单标题(留空用问题摘要):") || undefined;
    if (subject === null) return;
    try {
      setStatus("升级为工单中…");
      const r = await api(`/api/v1/dashboard/issues/${issueId}/promote`,
        { method: "POST", json: { subject } });
      setStatus("已升级为工单 " + ((r.ticket && r.ticket.code) || ""), "ok");
      closeDrawer(); refresh();
    } catch (e) { setStatus(String(e.message || e), "error"); }
  }

  async function mergeIssue(issueId) {
    const into = prompt("合并进目标问题 ID(survivor):");
    if (!into) return;
    try {
      setStatus("合并中…");
      await api(`/api/v1/dashboard/issues/${issueId}/merge`,
        { method: "POST", json: { into_issue_id: into.trim() } });
      setStatus("已合并", "ok"); closeDrawer(); refresh();
    } catch (e) { setStatus(String(e.message || e), "error"); }
  }

  function closeDrawer() {
    document.querySelectorAll(".drawer, .drawer-backdrop").forEach((n) => n.remove());
  }

  async function openDrawer(issueId) {
    closeDrawer();
    const backdrop = el("div", { class: "drawer-backdrop", onclick: closeDrawer });
    const drawer = el("div", { class: "drawer" }, el("div", { class: "muted" }, "加载中…"));
    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);
    let it;
    try { it = await api(`/api/v1/dashboard/issues/${issueId}`); }
    catch (e) {
      drawer.innerHTML = "";
      drawer.appendChild(el("div", { class: "status error" }, String(e.message || e)));
      return;
    }

    drawer.innerHTML = "";
    drawer.appendChild(el("button", { class: "secondary", onclick: closeDrawer }, "✕ 关闭"));
    drawer.appendChild(el("h2", null, (it.code ? it.code + " · " : "") + (it.title || "(无文本)")));
    drawer.appendChild(el("div", { class: "state" },
      "客户:" + customerLabel(it) +
      " · 状态:" + (STATE_LABELS[it.lifecycle_state] || it.lifecycle_state) +
      (it.nonclosure_reason ? " · " + (REASON_LABELS[it.nonclosure_reason] || it.nonclosure_reason) : "")));

    drawer.appendChild(el("div", { class: "actions" },
      el("button", { onclick: () => act(it.id, "confirm") }, "确认为真问题"),
      el("button", { class: "secondary", onclick: () => promote(it.id) }, "升级为工单"),
      el("button", { class: "secondary", onclick: () => mergeIssue(it.id) }, "合并"),
      el("button", { class: "danger", onclick: () => act(it.id, "reject") }, "忽略")));

    const msgs = it.messages || [];
    const tx = el("div", { class: "transcript" });
    if (!msgs.length) tx.appendChild(el("div", { class: "muted" }, "无消息证据(可能来自客服回复表)"));
    for (const m of msgs) {
      tx.appendChild(el("div", { class: "turn " + (m.role || "") },
        el("span", { class: "who" },
          (m.role || "?") + (m.signal_kind ? " · " + m.signal_kind : "")),
        el("span", { class: "muted" }, " " + fmtAge(m.ts) + "前")));
    }
    drawer.appendChild(el("h2", null, "证据消息"));
    drawer.appendChild(tx);

    const hist = it.history || [];
    if (hist.length) {
      const ul = el("ul", { class: "timeline" });
      for (const h of hist) {
        ul.appendChild(el("li", null,
          fmtAge(h.ts) + "前 · " + h.field + " · " + h.actor_mxid));
      }
      drawer.appendChild(el("h2", null, "时间线"));
      drawer.appendChild(ul);
    }
  }

  // -------------------------------------------------------------------------
  // Tabs + boot
  // -------------------------------------------------------------------------

  let currentTab = "unclosed";
  const RENDER = { unclosed: renderUnclosed, rollup: renderRollup, queue: renderQueue };

  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll(".tab").forEach((b) =>
      b.classList.toggle("active", b.dataset.tab === tab));
    refresh();
  }

  async function refresh() {
    try { await RENDER[currentTab](); }
    catch (e) {
      $view.innerHTML = "";
      $view.appendChild(el("div", { class: "status error" }, String(e.message || e)));
    }
  }

  document.querySelectorAll(".tab").forEach((b) =>
    b.addEventListener("click", () => switchTab(b.dataset.tab)));

  (async function boot() {
    try { await obtainSession(); }
    catch (e) { setStatus(String(e.message || e), "error"); }
    switchTab("unclosed");
  })();

})();
