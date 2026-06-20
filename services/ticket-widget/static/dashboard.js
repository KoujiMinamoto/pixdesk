// PixDesk Closed-Loop Engine dashboard v2.
// Three-level navigation via hash routing:
//   #/                       -> summary strip + customer grid
//   #/customers/<key>        -> all issues for one customer
//   #/issues/<id>            -> issue detail with full transcript
// Reads are open (no auth). Writes (confirm/reject/promote/merge) still need
// a Matrix session — they 401 cleanly with a friendly message when the page
// is opened outside Element.

(function () {
  "use strict";

  // -------------------------------------------------------------------------
  // DOM helpers
  // -------------------------------------------------------------------------

  const $status = document.getElementById("status");
  const $title = document.getElementById("page-title");
  const $back = document.getElementById("back-btn");
  const $crumbs = document.getElementById("crumbs");
  const $strip = document.getElementById("summary-strip");
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
        else if (k === "data") {
          for (const [dk, dv] of Object.entries(v)) node.dataset[dk] = dv;
        } else node.setAttribute(k, v);
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
    const t = new Date(iso).getTime();
    const secs = Math.max(0, (Date.now() - t) / 1000);
    if (secs < 60) return Math.round(secs) + " 秒前";
    if (secs < 3600) return Math.round(secs / 60) + " 分钟前";
    if (secs < 86400) return (secs / 3600).toFixed(1) + " 小时前";
    return (secs / 86400).toFixed(0) + " 天前";
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0") + " " +
      String(d.getHours()).padStart(2, "0") + ":" +
      String(d.getMinutes()).padStart(2, "0");
  }

  function customerLabel(row) {
    return row.channel_name || row.customer_workspace_id || "?";
  }

  function customerKey(row) {
    return [row.customer_platform, row.customer_workspace_id, row.customer_channel_id]
      .map(encodeURIComponent).join(":");
  }

  function parseCustomerKey(key) {
    const parts = key.split(":").map(decodeURIComponent);
    return {
      platform: parts[0], workspace_id: parts[1], channel_id: parts[2],
    };
  }

  // -------------------------------------------------------------------------
  // HTTP. Reads are open; writes lazily authenticate via /api/auth (Element
  // OpenID). Outside Element this just throws a clear message.
  // -------------------------------------------------------------------------

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
    const resp = await fetch(path, init);
    if (resp.status === 401) {
      throw new Error("写操作需在 Element 中打开看板登录");
    }
    if (!resp.ok) throw new Error(await resp.text() || `HTTP ${resp.status}`);
    const ct = resp.headers.get("content-type") || "";
    return ct.includes("application/json") ? resp.json() : resp.text();
  }


  // -------------------------------------------------------------------------
  // View 1: summary strip + customer grid (root page)
  // -------------------------------------------------------------------------

  const STATE_LABEL = {
    awaiting_agent: "待我方", active: "进行中", awaiting_customer: "等客户",
    resolution_proposed: "已答待确认", closed_inferred: "疑似闭环",
    closed_confirmed: "已闭环", reopened: "已重开", detected: "新发现",
    dismissed: "已忽略",
  };
  const REASON_LABEL = {
    unanswered_customer: "客户未获回复", idle_open: "长期无进展",
    awaiting_customer_stale: "等客户太久", reopened: "已重开",
  };

  async function renderRoot() {
    $title.textContent = "客户问题闭环看板";
    $back.hidden = true;
    $crumbs.innerHTML = "";
    $strip.style.display = "grid";
    $view.innerHTML = "";
    $view.appendChild(el("div", { class: "loading" }, "加载中…"));

    const [summary, rollup] = await Promise.all([
      api("/api/v1/dashboard/summary"),
      api("/api/v1/dashboard/rollup"),
    ]);

    // top strip
    $strip.innerHTML = "";
    $strip.appendChild(card("活跃客户", summary.active_customers || 0, ""));
    $strip.appendChild(card("本周新增问题", summary.new_this_week || 0, ""));
    $strip.appendChild(card("待我方回复", summary.awaiting_us || 0, "red"));
    $strip.appendChild(card("已闭环 + 待确认",
      (summary.resolved || 0) + (summary.suggested_closed || 0),
      "green",
      `${summary.resolved || 0} 已确认 · ${summary.suggested_closed || 0} 待确认`));

    const items = rollup.items || [];
    $view.innerHTML = "";
    if (!items.length) {
      $view.appendChild(el("div", { class: "empty" },
        "🎉 暂无客户问题"));
      return;
    }
    const grid = el("div", { class: "customer-grid" });
    for (const c of items) grid.appendChild(customerCard(c));
    $view.appendChild(grid);
  }

  function card(label, value, kind, sub) {
    return el("div", { class: "summary-card " + (kind || "") },
      el("div", { class: "label" }, label),
      el("div", { class: "value" }, String(value)),
      sub ? el("div", { class: "sub" }, sub) : null);
  }

  function customerCard(c) {
    const key = customerKey(c);
    const unclosed = +c.unclosed || 0;
    const suggested = +c.suggested_closed || 0;
    const closed = +c.closed || 0;
    const total = +c.total || (unclosed + suggested + closed) || 1;
    const pctU = unclosed * 100 / total, pctS = suggested * 100 / total,
          pctR = closed * 100 / total;
    const stale = unclosed > 0 ? fmtAge(c.oldest_unclosed_at) : null;
    const staleClass = unclosed > 0 && c.oldest_unclosed_at &&
      (Date.now() - new Date(c.oldest_unclosed_at).getTime()) > 86400000 ? " danger" : "";

    return el("div", { class: "customer-card", onclick: () => location.hash = "#/customers/" + key },
      el("div", { class: "name" }, customerLabel(c)),
      el("div", { class: "platform" }, c.customer_platform + " · " + c.customer_workspace_id),
      el("div", { class: "stats" },
        el("span", null,
          el("span", { class: "big red" }, String(unclosed)),
          el("span", { class: "label" }, "待回复")),
        el("span", null,
          el("span", { class: "big amber" }, String(suggested)),
          el("span", { class: "label" }, "待确认")),
        el("span", null,
          el("span", { class: "big green" }, String(closed)),
          el("span", { class: "label" }, "已闭环"))),
      el("div", { class: "bar" },
        el("span", { class: "unclosed", style: `width:${pctU}%` }),
        el("span", { class: "suggested", style: `width:${pctS}%` }),
        el("span", { class: "resolved", style: `width:${pctR}%` })),
      stale ? el("div", { class: "stale" + staleClass },
        "最久 ", stale, " 起未回") : null);
  }

  // -------------------------------------------------------------------------
  // View 2: customer issue list
  // -------------------------------------------------------------------------

  async function renderCustomer(key) {
    const { platform, workspace_id, channel_id } = parseCustomerKey(key);
    $strip.style.display = "none";
    $view.innerHTML = "";
    $view.appendChild(el("div", { class: "loading" }, "加载中…"));
    $back.hidden = false;
    $back.onclick = () => location.hash = "#/";

    const params = new URLSearchParams({
      platform, workspace_id, channel_id,
      include_closed: "true",
    });
    const data = await api("/api/v1/dashboard/customers/issues?" + params);
    const items = data.items || [];
    const channelName = (data.channel && data.channel.channel_name) ||
                        workspace_id;

    $title.textContent = channelName;
    $crumbs.innerHTML = "";
    $crumbs.appendChild(el("a", { onclick: () => location.hash = "#/" }, "全部客户"));
    $crumbs.appendChild(document.createTextNode(" / " + channelName));

    $view.innerHTML = "";
    if (!items.length) {
      $view.appendChild(el("div", { class: "empty" }, "暂无问题"));
      return;
    }
    const list = el("div", { class: "issue-list" });
    for (const it of items) list.appendChild(issueRow(it));
    $view.appendChild(list);
  }

  function issueRow(it) {
    const stateLabel = STATE_LABEL[it.lifecycle_state] || it.lifecycle_state;
    const summary = it.summary || "";
    const ageVal = fmtAge(it.last_activity_at);
    const isStale = it.nonclosure_reason && it.last_activity_at &&
      (Date.now() - new Date(it.last_activity_at).getTime()) > 86400000;
    return el("div", { class: "issue-row",
                       onclick: () => location.hash = "#/issues/" + it.id },
      el("span", { class: "pill " + it.lifecycle_state }, stateLabel),
      el("div", null,
        el("div", { class: "title" }, it.title || "(无标题)"),
        summary ? el("div", { class: "summary" }, summary) : null,
        el("div", { class: "who" },
          (it.message_count || 0) + " 条消息" +
          (it.external_party_name ? " · " + it.external_party_name : "") +
          (it.last_speaker ? " · 最后 " + (it.last_speaker === "customer" ? "客户" : "我方") : "")
        )),
      el("div", { class: "when" + (isStale ? " danger" : "") }, ageVal),
      it.nonclosure_reason
        ? el("span", { class: "pill awaiting_agent" },
            REASON_LABEL[it.nonclosure_reason] || it.nonclosure_reason)
        : el("span"));
  }

  // -------------------------------------------------------------------------
  // View 3: issue detail with transcript
  // -------------------------------------------------------------------------

  async function renderIssue(issueId) {
    $strip.style.display = "none";
    $view.innerHTML = "";
    $view.appendChild(el("div", { class: "loading" }, "加载中…"));
    $back.hidden = false;
    $back.onclick = () => history.back();

    const data = await api("/api/v1/dashboard/issues/" + encodeURIComponent(issueId) + "/transcript");
    const it = data.issue || {};
    const turns = data.transcript || [];
    const history = data.history || [];

    const channelKey = customerKey({
      customer_platform: it.customer_platform,
      customer_workspace_id: it.customer_workspace_id,
      customer_channel_id: it.customer_channel_id,
    });

    $title.textContent = it.title || "(无标题)";
    $crumbs.innerHTML = "";
    $crumbs.appendChild(el("a", { onclick: () => location.hash = "#/" }, "全部客户"));
    $crumbs.appendChild(document.createTextNode(" / "));
    $crumbs.appendChild(el("a", { onclick: () => location.hash = "#/customers/" + channelKey },
      it.channel_name || it.customer_workspace_id || "客户"));
    $crumbs.appendChild(document.createTextNode(" / " + (it.code || "issue")));

    $view.innerHTML = "";
    const detail = el("div", { class: "detail" });
    detail.appendChild(el("h2", null, it.title || "(无标题)"));

    const meta = el("div", { class: "meta" },
      el("span", { class: "pill " + it.lifecycle_state },
        STATE_LABEL[it.lifecycle_state] || it.lifecycle_state),
      it.code ? document.createTextNode(" · " + it.code + " ") : null,
      it.external_party_name ? document.createTextNode(" · " + it.external_party_name) : null,
      document.createTextNode(" · " + (it.message_count || turns.length) + " 条消息"),
      document.createTextNode(" · 最后活动 " + fmtAge(it.last_activity_at)));
    detail.appendChild(meta);

    const summary = (it.metadata && it.metadata.summary) || it.summary;
    if (summary) {
      detail.appendChild(el("div", { class: "summary-block" }, summary));
    }

    const actions = el("div", { class: "actions" });
    actions.appendChild(el("button", { onclick: () => act(issueId, "confirm") }, "✓ 确认为真问题"));
    actions.appendChild(el("button", { class: "danger",
      onclick: () => act(issueId, "reject") }, "✕ 忽略"));
    detail.appendChild(actions);

    // transcript
    const tx = el("div", { class: "transcript" });
    tx.appendChild(el("h3", null, "聊天记录 (" + turns.length + " 条)"));
    if (!turns.length) {
      tx.appendChild(el("div", { class: "turn" },
        el("span", { class: "text" }, "无证据消息")));
    } else {
      for (const t of turns) {
        tx.appendChild(el("div", { class: "turn " + (t.role || "system") },
          el("span", { class: "who" }, t.sender_name || t.sender_id || (t.role || "?")),
          el("span", { class: "when" }, t.ts ? fmtDate(t.ts) : "—"),
          el("span", { class: "text" }, t.text || "(无文本)")));
      }
    }
    detail.appendChild(tx);

    if (history.length) {
      const ul = el("ul", { class: "timeline" });
      ul.appendChild(el("li", null,
        el("strong", null, "时间线 (" + history.length + " 条)")));
      for (const h of history) {
        ul.appendChild(el("li", null,
          fmtAge(h.ts) + " · " + h.field + " · " + (h.actor_mxid || "")));
      }
      detail.appendChild(ul);
    }

    $view.appendChild(detail);
  }

  async function act(issueId, action) {
    try {
      setStatus("提交中…");
      await api("/api/v1/dashboard/issues/" + issueId + "/review",
        { method: "POST", json: { action } });
      setStatus("已" + (action === "confirm" ? "确认" : "忽略"), "ok");
      setTimeout(() => setStatus(""), 1500);
      // re-render current view
      route();
    } catch (e) { setStatus(String(e.message || e), "error"); }
  }

  // -------------------------------------------------------------------------
  // Router
  // -------------------------------------------------------------------------

  async function route() {
    const hash = location.hash || "#/";
    setStatus("");
    try {
      if (hash === "#/" || hash === "#") {
        await renderRoot();
      } else if (hash.startsWith("#/customers/")) {
        await renderCustomer(hash.slice("#/customers/".length));
      } else if (hash.startsWith("#/issues/")) {
        await renderIssue(hash.slice("#/issues/".length));
      } else {
        location.hash = "#/";
      }
    } catch (e) {
      $view.innerHTML = "";
      $view.appendChild(el("div", { class: "empty" }, String(e.message || e)));
    }
  }

  window.addEventListener("hashchange", route);
  route();
})();
