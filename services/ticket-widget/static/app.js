// PixDesk Ticket Widget — Element side panel.
// Boots up via Matrix Widget API, exchanges an OpenID token with the BFF for
// a session cookie, then renders list/detail/create views scoped to the room.

(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("roomId") || "";
  const widgetIdRaw = params.get("widgetId") || "";
  const userIdRaw = params.get("userId") || "";
  // Element substitutes $matrix_widget_id / $matrix_user_id with real values.
  // If substitution didn't run (URL opened outside Element), the param will
  // start with "$" and we treat it as absent.
  const widgetId = widgetIdRaw && !widgetIdRaw.startsWith("$") ? widgetIdRaw : null;
  const userIdFromUrl = userIdRaw && !userIdRaw.startsWith("$") ? userIdRaw : null;
  const theme = params.get("theme") || "light";

  console.log("[ticket-widget] boot",
    { url: location.href, roomId, widgetId, userIdFromUrl, theme });

  // Raw postMessage tap — fires before/independently of the SDK,
  // tells us whether Element is sending anything at all and with what shape.
  window.addEventListener("message", (ev) => {
    const d = ev.data;
    if (d && (d.api || d.action || d.widgetId)) {
      console.log("[ticket-widget] postMessage from", ev.origin,
        { api: d.api, action: d.action, widgetId: d.widgetId,
          requestId: d.requestId, hasResponse: !!d.response });
    }
  });

  if (theme === "dark") {
    document.body.classList.add("theme-dark");
  }

  const STATUS_LABELS = {
    open: "新建",
    in_progress: "处理中",
    pending_customer: "等客户",
    resolved: "已解决",
    closed: "已关闭",
  };
  const PRIORITY_LABELS = {
    low: "低",
    standard: "标准",
    high: "高",
    urgent: "紧急",
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
        else if (k === "onsubmit") node.addEventListener("submit", v);
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

  function chip(label, kind) {
    return el("span", { class: "chip " + (kind || "") }, label);
  }

  // -------------------------------------------------------------------------
  // Matrix Widget API + OpenID exchange
  // -------------------------------------------------------------------------

  const widgetApi = new mxwidgets.WidgetApi(widgetId);
  let widgetReady = false;
  let widgetReadyPromise = null;
  let sessionMxid = null;

  function startWidget() {
    if (widgetReadyPromise) return widgetReadyPromise;
    widgetReadyPromise = new Promise((resolve, reject) => {
      let settled = false;
      widgetApi.on("ready", () => {
        widgetReady = true;
        if (!settled) { settled = true; resolve(); }
      });
      widgetApi.on("error", (err) => {
        console.warn("widget api error", err);
      });
      // Empty capability list — OpenID does not require any capability.
      widgetApi.requestCapabilities([]);
      widgetApi.start();
      // Element waits for content_loaded BEFORE driving the capabilities
      // exchange that ultimately fires "ready". Send it immediately, ignore
      // any error (some hosts no-op).
      Promise.resolve()
        .then(() => widgetApi.sendContentLoaded())
        .catch((e) => console.warn("sendContentLoaded failed", e));
      // Element should respond to the version handshake within a few seconds.
      // If not, the user is probably opening this widget URL directly outside
      // Element (dev/debugging) — surface that.
      setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error("Element 未响应 widget 握手(可能没在 Element 里打开)"));
        }
      }, 20000);
    });
    return widgetReadyPromise;
  }

  async function obtainSession() {
    // Preferred path: Element substituted $matrix_user_id into the URL.
    // BFF will validate that mxid is in the room before issuing the cookie.
    if (userIdFromUrl) {
      setStatus("正在登录:" + userIdFromUrl);
      const resp = await fetch("/api/auth", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userIdFromUrl, room_id: roomId }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error("auth(URL) 失败: " + text);
      }
      const data = await resp.json();
      sessionMxid = data.mxid;
      setStatus("已登录:" + sessionMxid, "ok");
      setTimeout(() => setStatus(""), 2000);
      return;
    }

    // Fallback: OpenID via the widget API (older Element / non-Element host).
    setStatus("等待 Element 响应 widget 握手…");
    await startWidget();
    setStatus("正在请求 OpenID(可能需要在 Element 里点击 Continue)…");
    let tok;
    try {
      tok = await widgetApi.requestOpenIDConnectToken();
    } catch (e) {
      throw new Error("requestOpenID 失败: " + (e && e.message || e));
    }
    setStatus("正在向 BFF 兑换 session…");
    const resp = await fetch("/api/auth", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        openid_token: tok.access_token,
        matrix_server_name: tok.matrix_server_name,
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error("auth 失败: " + text);
    }
    const data = await resp.json();
    sessionMxid = data.mxid;
    setStatus("已登录:" + sessionMxid, "ok");
    setTimeout(() => setStatus(""), 2000);
  }


  // -------------------------------------------------------------------------
  // HTTP helper (auto re-auth on 401)
  // -------------------------------------------------------------------------

  async function api(path, opts) {
    opts = opts || {};
    const sep = path.includes("?") ? "&" : "?";
    const url = path + sep + "room_id=" + encodeURIComponent(roomId);
    const init = {
      method: opts.method || "GET",
      credentials: "same-origin",
      headers: opts.headers || {},
    };
    if (opts.json !== undefined) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(opts.json);
    }
    let resp = await fetch(url, init);
    if (resp.status === 401) {
      await obtainSession();
      resp = await fetch(url, init);
    }
    if (!resp.ok) {
      const text = await resp.text();
      throw Object.assign(new Error("api " + path + " " + resp.status + ": " + text),
                          { status: resp.status });
    }
    if (resp.status === 204) return null;
    const ct = resp.headers.get("content-type") || "";
    return ct.includes("application/json") ? resp.json() : resp.text();
  }

  // -------------------------------------------------------------------------
  // List view
  // -------------------------------------------------------------------------

  let templatesCache = null;
  let customerCache = null;

  async function renderList() {
    setStatus("加载工单…");
    let data;
    try {
      data = await api("/api/v1/tickets");
    } catch (e) {
      setStatus(String(e), "error");
      return;
    }
    setStatus("");
    const tickets = data.tickets || [];
    $view.replaceChildren();
    $view.appendChild(el("div", { class: "toolbar" },
      el("h2", null, "工单 (" + tickets.length + ")"),
      el("button", { onclick: () => renderCreate() }, "+ 新建"),
    ));
    if (tickets.length === 0) {
      $view.appendChild(el("div", { class: "muted" }, "这个房间还没有工单。"));
      return;
    }
    const list = el("div", { class: "ticket-list" });
    for (const t of tickets) {
      const card = el("div", { class: "ticket-card", onclick: () => renderDetail(t.id) },
        el("div", { class: "ticket-row1" },
          el("span", { class: "ticket-code" }, t.code),
          el("span", { class: "ticket-subject" }, t.subject),
          chip(STATUS_LABELS[t.status] || t.status, "status-" + t.status),
        ),
        el("div", { class: "muted" },
          (t.assignee_mxid ? "👤 " + t.assignee_mxid + " · " : "") +
          PRIORITY_LABELS[t.priority] + " · " +
          (t.updated_at || t.opened_at || "").slice(0, 16).replace("T", " ")
        ),
      );
      list.appendChild(card);
    }
    $view.appendChild(list);
  }

  // -------------------------------------------------------------------------
  // Detail view
  // -------------------------------------------------------------------------

  async function renderDetail(ticketId) {
    setStatus("加载工单详情…");
    let t, comments;
    try {
      t = await api("/api/v1/tickets/" + ticketId);
      comments = (await api("/api/v1/tickets/" + ticketId + "/comments")).comments || [];
    } catch (e) {
      setStatus(String(e), "error");
      return;
    }
    setStatus("");
    $view.replaceChildren();
    $view.appendChild(el("div", { class: "toolbar" },
      el("button", { class: "secondary", onclick: () => renderList() }, "← 返回"),
      el("h2", null, t.code),
    ));

    const customerLabel = t.customer && t.customer.channel_name
      ? t.customer.channel_name + " (" + t.customer.platform + ")"
      : (t.customer && t.customer.workspace_id) || "—";

    const detail = el("div", { class: "detail" });
    detail.appendChild(el("h3", null, t.subject));
    detail.appendChild(el("div", { class: "field-row" },
      chip(STATUS_LABELS[t.status] || t.status, "status-" + t.status),
      " ",
      chip(PRIORITY_LABELS[t.priority] || t.priority, "priority-" + t.priority),
      ...(t.tags || []).map(tag => [" ", chip("#" + tag)]).flat(),
    ));
    detail.appendChild(el("div", { class: "field-row muted" }, "客户:" + customerLabel));
    detail.appendChild(el("div", { class: "field-row muted" },
      "受理人:" + (t.assignee_mxid || "—") + " · 创建人:" + (t.created_by_mxid || "—")));
    detail.appendChild(el("div", { class: "field-row muted" },
      "创建于 " + (t.opened_at || "").slice(0, 16).replace("T", " ") +
      (t.due_at ? " · 截止 " + t.due_at.slice(0, 16).replace("T", " ") : "")));
    if (t.description) {
      detail.appendChild(el("div", { class: "divider" }));
      detail.appendChild(el("div", { class: "field-row" }, t.description));
    }
    $view.appendChild(detail);

    // Inline status/priority/assignee editor + comment combo
    $view.appendChild(el("div", { class: "divider" }));
    $view.appendChild(el("h3", null, "更新"));
    const form = el("form", { onsubmit: (e) => { e.preventDefault(); submitPatch(ticketId, form); } });
    form.appendChild(field("状态", select("status", t.status, STATUS_LABELS)));
    form.appendChild(field("优先级", select("priority", t.priority, PRIORITY_LABELS)));
    form.appendChild(field("受理人 (mxid,留空跳过)",
      el("input", { type: "text", name: "assignee_mxid", value: t.assignee_mxid || "" })));
    form.appendChild(field("评论 / 内部备注",
      el("textarea", { name: "comment", placeholder: "可选" })));
    form.appendChild(el("label", { class: "field" },
      el("input", { type: "checkbox", name: "comment_is_internal" }),
      " 内部备注(不发给客户)"));
    form.appendChild(el("button", { type: "submit" }, "保存"));
    $view.appendChild(form);

    $view.appendChild(el("div", { class: "divider" }));
    $view.appendChild(el("h3", null, "评论 (" + comments.length + ")"));
    if (comments.length === 0) {
      $view.appendChild(el("div", { class: "muted" }, "暂无。"));
    }
    for (const c of comments) {
      $view.appendChild(commentNode(ticketId, c));
    }
  }

  function field(label, control) {
    return el("label", { class: "field" }, el("span", null, label), control);
  }

  function select(name, value, labels) {
    const sel = el("select", { name });
    for (const [k, v] of Object.entries(labels)) {
      const opt = el("option", { value: k }, v);
      if (k === value) opt.setAttribute("selected", "selected");
      sel.appendChild(opt);
    }
    return sel;
  }

  function formData(form) {
    const data = {};
    for (const input of form.querySelectorAll("input, textarea, select")) {
      const name = input.getAttribute("name");
      if (!name) continue;
      if (input.type === "checkbox") {
        data[name] = input.checked;
      } else {
        data[name] = input.value;
      }
    }
    return data;
  }

  async function submitPatch(ticketId, form) {
    const data = formData(form);
    const payload = {};
    if (data.status) payload.status = data.status;
    if (data.priority) payload.priority = data.priority;
    if (data.assignee_mxid !== undefined) {
      payload.assignee_mxid = data.assignee_mxid || null;
    }
    if (data.comment) {
      payload.comment = data.comment;
      payload.comment_is_internal = !!data.comment_is_internal;
    }
    setStatus("保存中…");
    try {
      await api("/api/v1/tickets/" + ticketId, { method: "PATCH", json: payload });
      setStatus("已保存", "ok");
      renderDetail(ticketId);
    } catch (e) {
      setStatus(String(e), "error");
    }
  }

  function commentNode(ticketId, c) {
    const node = el("div", { class: "comment" + (c.is_internal ? " internal" : "") },
      el("div", { class: "author" },
        c.author_mxid + " · " + (c.created_at || "").slice(0, 16).replace("T", " ") +
        (c.is_internal ? " · 内部" : "")),
      el("div", null, c.body),
    );
    if (sessionMxid && c.author_mxid === sessionMxid) {
      node.appendChild(el("button", {
        class: "secondary",
        onclick: async () => {
          if (!confirm("删除这条评论?")) return;
          try {
            await api("/api/v1/tickets/" + ticketId + "/comments/" + c.id,
                      { method: "DELETE" });
            renderDetail(ticketId);
          } catch (e) { setStatus(String(e), "error"); }
        }
      }, "删除"));
    }
    return node;
  }

  // -------------------------------------------------------------------------
  // Create form
  // -------------------------------------------------------------------------

  async function renderCreate() {
    if (!templatesCache) {
      try {
        templatesCache = (await api("/api/v1/templates")).templates || [];
      } catch (e) {
        templatesCache = [];
      }
    }
    if (!customerCache) {
      try {
        customerCache = await api("/api/v1/customer");
      } catch (e) {
        customerCache = {};
      }
    }
    const customerLabel = customerCache && customerCache.channel_name
      ? customerCache.channel_name + " (" + customerCache.platform + ")"
      : "(从房间推断)";

    $view.replaceChildren();
    $view.appendChild(el("div", { class: "toolbar" },
      el("button", { class: "secondary", onclick: () => renderList() }, "← 返回"),
      el("h2", null, "新建工单"),
    ));

    const tplSel = select("template_id",
      templatesCache[0] ? templatesCache[0].id : "",
      Object.fromEntries(templatesCache.map(t => [t.id, t.name])));
    if (templatesCache.length === 0) tplSel.disabled = true;

    const form = el("form", {
      onsubmit: (e) => { e.preventDefault(); submitCreate(form); }
    });
    form.appendChild(field("主题", el("input", { type: "text", name: "subject", required: "required" })));
    form.appendChild(field("描述", el("textarea", { name: "description" })));
    form.appendChild(field("客户", el("input", {
      type: "text", value: customerLabel, disabled: "disabled"
    })));
    form.appendChild(field("受理人 (mxid)",
      el("input", { type: "text", name: "assignee_mxid",
                    placeholder: "@user:" + (sessionMxid ? sessionMxid.split(":")[1] : "") })));
    form.appendChild(field("优先级",
      select("priority", "standard", PRIORITY_LABELS)));
    form.appendChild(field("初始状态",
      select("status", "open", STATUS_LABELS)));
    form.appendChild(field("标签 (逗号分隔)",
      el("input", { type: "text", name: "tags" })));
    if (templatesCache.length > 0) {
      form.appendChild(field("模板", tplSel));
    }
    form.appendChild(field("截止时间 (可选)",
      el("input", { type: "datetime-local", name: "due_at" })));
    form.appendChild(el("button", { type: "submit" }, "创建"));
    $view.appendChild(form);
  }

  async function submitCreate(form) {
    const data = formData(form);
    const payload = {
      subject: (data.subject || "").trim(),
      description: data.description || null,
      assignee_mxid: data.assignee_mxid || null,
      priority: data.priority || "standard",
      status: data.status || "open",
      tags: (data.tags || "").split(",").map(s => s.trim()).filter(Boolean),
      template_id: data.template_id || null,
      due_at: data.due_at ? new Date(data.due_at).toISOString() : null,
    };
    if (!payload.subject) {
      setStatus("主题必填", "error");
      return;
    }
    setStatus("创建中…");
    try {
      const t = await api("/api/v1/tickets", { method: "POST", json: payload });
      setStatus("已创建 " + t.code, "ok");
      renderDetail(t.id);
    } catch (e) {
      setStatus(String(e), "error");
    }
  }
  // -------------------------------------------------------------------------
  // Boot
  // -------------------------------------------------------------------------

  function showAuthRetry(err) {
    $view.replaceChildren();
    $view.appendChild(el("div", { class: "muted" },
      "需要先在 Element 里授权读取 OpenID。如果上面提示「Request timed out」,"
      + "可能是 Element 弹的「Continue」按钮被忽略了。点下面按钮重试,然后留意"
      + "Element 主界面里的提示。"));
    $view.appendChild(el("div", { style: "margin-top:8px" },
      el("button", {
        onclick: async () => {
          setStatus("");
          try {
            await obtainSession();
            await renderList();
          } catch (e2) {
            setStatus(String(e2), "error");
            showAuthRetry(e2);
          }
        }
      }, "重新登录")));
    if (err) {
      $view.appendChild(el("div", { class: "muted", style: "margin-top:8px" },
        "调试信息: " + String(err)));
    }
  }

  async function boot() {
    if (!roomId || !roomId.startsWith("!")) {
      setStatus("缺少 roomId 参数,无法加载工单", "error");
      return;
    }
    // First try without forcing a new session — maybe a cookie already exists.
    try {
      await renderList();
      return;
    } catch (e) {
      // 401 → fall through to auth flow.
    }
    try {
      await obtainSession();
      await renderList();
    } catch (e) {
      console.error("boot auth failed", e);
      setStatus(String(e), "error");
      showAuthRetry(e);
    }
  }

  boot();







})();
