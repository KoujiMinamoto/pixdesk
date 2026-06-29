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
  const $nav = document.getElementById("main-nav");
  const $sources = document.getElementById("source-bar");
  const $periodBar = document.getElementById("period-bar");
  const $view = document.getElementById("view");

  // Top-level section tabs. `active` is one of: overview | shift | tickets,
  // or null to hide the nav (gate screens, deep drilldowns keep it for quick
  // jumps but null hides it entirely).
  const NAV_TABS = [
    { key: "overview", label: "总览", hash: "#/" },
    { key: "shift", label: "班次复盘", hash: "#/shift" },
    { key: "tickets", label: "Ticket 记录", hash: "#/tickets" },
  ];
  function renderNav(active) {
    if (!active) { $nav.hidden = true; $nav.innerHTML = ""; return; }
    $nav.hidden = false;
    $nav.innerHTML = "";
    for (const t of NAV_TABS) {
      $nav.appendChild(el("a",
        { class: "nav-tab" + (t.key === active ? " active" : ""),
          onclick: () => { location.hash = t.hash; } },
        t.label));
    }
  }

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
      throw new Error("登录已失效，请重新用飞书登录");
    }
    if (resp.status === 403) {
      throw new Error("无权限（需管理员批准）");
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
  const PLATFORM_LABEL = { discord: "Discord", slack: "Slack", gmail: "Gmail" };

  // Home-page filter state + the last rollup payload, so chip clicks re-render
  // the grid without re-fetching.
  const filter = { platform: null, product: null, q: "" };
  let _rollupItems = [];
  // Shift-review window in hours (support runs 3 rotating 8h shifts).
  let shiftHours = 8;
  // Ticket-archive list filter state.
  const ticketFilter = { status: "all", q: "" };

  // Overview time-window selector. `period` is one of the preset keys or
  // "custom" (then customStart/customEnd carry ISO dates). Persisted in
  // localStorage so a reviewer's chosen window survives reloads.
  const PERIODS = [
    ["today", "今日"], ["yesterday", "昨日"],
    ["this_week", "本周"], ["last_week", "上周"],
    ["this_month", "本月"], ["last_month", "上月"],
    ["custom", "自定义"],
  ];
  const PERIOD_LABEL = Object.fromEntries(PERIODS);
  const overview = {
    period: localStorage.getItem("ov_period") || "this_week",
    start: localStorage.getItem("ov_start") || "",
    end: localStorage.getItem("ov_end") || "",
  };
  // Short prefix for the metric cards ("本周活跃客户" etc.).
  function periodPrefix() {
    return overview.period === "custom" ? "区间" : (PERIOD_LABEL[overview.period] || "本周");
  }
  function summaryQuery() {
    if (overview.period === "custom") {
      const p = new URLSearchParams({ period: "custom" });
      if (overview.start) p.set("start", overview.start);
      if (overview.end) p.set("end", overview.end + "T23:59:59");  // inclusive end-of-day
      return "?" + p.toString();
    }
    return "?period=" + overview.period;
  }

  function platformPill(p) {
    return el("span", { class: "tag platform platform-" + (p || "other") },
      PLATFORM_LABEL[p] || p || "?");
  }

  function productPills(products) {
    const arr = Array.isArray(products) ? products : [];
    return arr.map((p) => el("span", { class: "tag product" }, p));
  }

  function matchesFilter(c) {
    if (filter.platform && c.customer_platform !== filter.platform) return false;
    if (filter.product) {
      const prods = Array.isArray(c.products) ? c.products : [];
      if (!prods.includes(filter.product)) return false;
    }
    if (filter.q) {
      const hay = ((customerLabel(c) || "") + " " +
        (c.customer_workspace_id || "") + " " +
        (c.customer_channel_id || "")).toLowerCase();
      if (!hay.includes(filter.q.toLowerCase())) return false;
    }
    return true;
  }


  // Render the 6 metric cards from a summary payload, labelled by the active
  // period prefix (本周/今日/区间…). Split out so the period picker can refresh
  // just the strip without rebuilding the whole root view.
  function renderStrip(summary) {
    const px = periodPrefix();
    $strip.innerHTML = "";
    $strip.appendChild(card(px + "活跃客户", summary.active_customers || 0, ""));
    $strip.appendChild(card(px + "新增问题", summary.new_issues || 0, ""));
    $strip.appendChild(card(px + "活跃问题", summary.active_issues || 0, ""));
    $strip.appendChild(card(px + "新增对话", summary.new_conversations || 0, ""));
    $strip.appendChild(card(px + "新闭环", summary.new_closed || 0, "green"));
    $strip.appendChild(card("待我方回复", summary.awaiting_us || 0, "red", "实时"));
  }

  // Re-fetch the summary for the current overview window and repaint the strip.
  async function refreshStrip() {
    $strip.style.opacity = "0.5";
    try {
      const summary = await api("/api/v1/dashboard/summary" + summaryQuery());
      renderStrip(summary);
    } catch (e) {
      setStatus(String(e.message || e), "error");
    } finally {
      $strip.style.opacity = "";
    }
  }

  // Time-window picker: preset chips + (for 自定义) two date inputs.
  function renderPeriodBar() {
    $periodBar.hidden = false;
    $periodBar.innerHTML = "";
    const row = el("div", { class: "chip-row" }, el("span", { class: "chip-label" }, "时间范围"));
    for (const [key, label] of PERIODS) {
      row.appendChild(el("button",
        { class: "chip" + (overview.period === key ? " active" : ""),
          onclick: () => {
            overview.period = key;
            localStorage.setItem("ov_period", key);
            renderPeriodBar();             // repaint chips + show/hide custom inputs
            if (key !== "custom" || (overview.start && overview.end)) refreshStrip();
          } },
        label));
    }
    $periodBar.appendChild(row);

    if (overview.period === "custom") {
      const mkDate = (val, on) => {
        const i = el("input", { type: "date", class: "period-date", value: val || "" });
        i.addEventListener("change", (e) => on(e.target.value));
        return i;
      };
      const custom = el("div", { class: "chip-row" },
        mkDate(overview.start, (v) => { overview.start = v; localStorage.setItem("ov_start", v); }),
        el("span", { class: "period-sep" }, "至"),
        mkDate(overview.end, (v) => { overview.end = v; localStorage.setItem("ov_end", v); }),
        el("button", { class: "chip apply",
          onclick: () => {
            if (!overview.start || !overview.end) { setStatus("请选择起止日期", "error"); return; }
            refreshStrip();
          } }, "应用"));
      $periodBar.appendChild(custom);
    }
  }

  async function renderRoot() {
    $title.textContent = "客户问题闭环看板";
    $back.hidden = true;
    $crumbs.innerHTML = "";
    renderNav("overview");
    $strip.style.display = "grid";
    $view.innerHTML = "";
    $view.appendChild(el("div", { class: "loading" }, "加载中…"));

    const [summary, rollup, sources] = await Promise.all([
      api("/api/v1/dashboard/summary" + summaryQuery()),
      api("/api/v1/dashboard/rollup"),
      api("/api/v1/dashboard/sources").catch(() => ({ sources: [] })),
    ]);

    // Data-source connection bar (Slack / Discord), inferred from data freshness.
    renderSourceBar(sources.sources || []);

    // Time-window picker (今日/昨日/本周/上周/本月/上月/自定义) above the strip.
    renderPeriodBar();
    // top strip — window metrics scoped to the selected period; 待我方 always-current.
    renderStrip(summary);

    const items = rollup.items || [];
    _rollupItems = items;
    $view.innerHTML = "";
    if (!items.length) {
      $view.appendChild(el("div", { class: "empty" },
        "🎉 暂无客户问题"));
      return;
    }
    renderFilterBar();
    renderGrid();
  }

  // Distinct platforms / products present in the current rollup, for chips.
  function _facetValues() {
    const platforms = new Set();
    const products = new Set();
    for (const c of _rollupItems) {
      if (c.customer_platform) platforms.add(c.customer_platform);
      for (const p of (Array.isArray(c.products) ? c.products : [])) products.add(p);
    }
    return { platforms: [...platforms].sort(), products: [...products].sort() };
  }

  function renderFilterBar() {
    const { platforms, products } = _facetValues();
    const bar = el("div", { class: "filter-bar" });

    const chip = (label, active, onClick) =>
      el("button", { class: "chip" + (active ? " active" : ""), onclick: onClick }, label);

    // Search row (kept first so it's always in the same spot).
    const search = el("input", {
      class: "cust-search", type: "search", id: "cust-search",
      placeholder: "搜索客户名 / 渠道…", value: filter.q || "",
    });
    search.addEventListener("input", (e) => {
      filter.q = e.target.value;
      renderGrid();  // grid only — don't rebuild the bar, keeps input focus
    });
    bar.appendChild(el("div", { class: "chip-row" }, search));

    const platRow = el("div", { class: "chip-row" }, el("span", { class: "chip-label" }, "平台"));
    platRow.appendChild(chip("全部", !filter.platform, () => { filter.platform = null; renderGrid(); refreshChips(); }));
    for (const p of platforms) {
      platRow.appendChild(chip(PLATFORM_LABEL[p] || p, filter.platform === p,
        () => { filter.platform = p; renderGrid(); refreshChips(); }));
    }
    bar.appendChild(platRow);

    if (products.length) {
      const prodRow = el("div", { class: "chip-row" }, el("span", { class: "chip-label" }, "产品"));
      prodRow.appendChild(chip("全部", !filter.product, () => { filter.product = null; renderGrid(); refreshChips(); }));
      for (const p of products) {
        prodRow.appendChild(chip(p, filter.product === p,
          () => { filter.product = p; renderGrid(); refreshChips(); }));
      }
      bar.appendChild(prodRow);
    }
    // Replace any existing bar.
    const old = document.getElementById("filter-bar");
    if (old) old.remove();
    bar.id = "filter-bar";
    $view.parentNode.insertBefore(bar, $view);
  }

  // Re-paint chip active states. Avoid clobbering the search box mid-typing:
  // only rebuild when the search input isn't focused.
  function refreshChips() {
    const s = document.getElementById("cust-search");
    if (s && document.activeElement === s) return;
    renderFilterBar();
  }

  function renderGrid() {
    $view.innerHTML = "";
    const shown = _rollupItems.filter(matchesFilter);
    if (!shown.length) {
      $view.appendChild(el("div", { class: "empty" }, "无匹配筛选的客户"));
      return;
    }
    const grid = el("div", { class: "customer-grid" });
    for (const c of shown) grid.appendChild(customerCard(c));
    $view.appendChild(grid);
  }


  function fmtAgeSecs(s) {
    s = Math.max(0, +s || 0);
    if (s < 60) return Math.round(s) + " 秒前";
    if (s < 3600) return Math.round(s / 60) + " 分钟前";
    if (s < 86400) return (s / 3600).toFixed(1) + " 小时前";
    return (s / 86400).toFixed(0) + " 天前";
  }

  // Connection status per source platform. Prefers the REAL bridge connection
  // state (status_source==="bridge", from the 185 probe) — it tells "bridge
  // down" apart from "channel quiet". Falls back to message-freshness when the
  // probe is missing/stale (<=1h flowing / <=6h lagging / >6h likely down).
  function renderSourceBar(sources) {
    $sources.hidden = false;
    $sources.innerHTML = "";
    $sources.appendChild(el("span", { class: "src-title" }, "数据源"));
    if (!sources.length) {
      $sources.appendChild(el("span", { class: "src-chip down" }, "无数据"));
      return;
    }
    for (const s of sources) {
      let cls, label, meta;
      if (s.status_source === "bridge") {
        // Real bridge connection status from the 185 probe — authoritative.
        const at = s.bridge_event_at;
        const rc = s.bridge_reconnects_24h;
        if (s.bridge_connected) { cls = "live"; label = "已连接"; }
        else { cls = "down"; label = "桥接断开"; }
        meta = "桥接" +
          (at ? " · " + fmtAge(at) : "") +
          (rc ? " · 24h重连" + rc + "次" : "");
      } else {
        // Fallback: data-freshness heuristic.
        const age = +s.age_seconds;
        cls = "live"; label = "数据正常";
        if (!(s.last_ts) || isNaN(age)) { cls = "down"; label = "无数据"; }
        else if (age > 21600) { cls = "down"; label = "疑似断开"; }
        else if (age > 3600) { cls = "lag"; label = "可能滞后"; }
        meta = "最近 " + fmtAgeSecs(age) +
          (s.channels_24h != null ? " · " + s.channels_24h + " 活跃频道" : "");
      }
      const plat = PLATFORM_LABEL[s.platform] || s.platform || "?";
      const tip = s.status_source === "bridge"
        ? "实时桥接连接状态（来自 185 桥接日志）" + (s.bridge_detail ? "：" + s.bridge_detail : "")
        : "依据最近收到消息的时间推断，非直接探测桥接";
      $sources.appendChild(el("span", { class: "src-chip " + cls, title: tip },
        el("span", { class: "dot" }),
        el("b", null, plat),
        el("span", { class: "src-state" }, label),
        el("span", { class: "src-meta" }, meta)));
    }
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
      el("div", { class: "tags" }, platformPill(c.customer_platform), productPills(c.products)),
      el("div", { class: "name" }, customerLabel(c)),
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
    renderNav(null);
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
    // Group: open/active (ball in play) vs closed. Open first — that's what
    // needs attention; closed is collapsed-feel via a muted subheader.
    const CLOSED = new Set(["closed_inferred", "closed_confirmed", "dismissed"]);
    const openItems = items.filter((it) => !CLOSED.has(it.lifecycle_state));
    const closedItems = items.filter((it) => CLOSED.has(it.lifecycle_state));

    const section = (label, rows, cls) => {
      if (!rows.length) return;
      $view.appendChild(el("div", { class: "list-subhead " + (cls || "") },
        label + " (" + rows.length + ")"));
      const list = el("div", { class: "issue-list" });
      for (const it of rows) list.appendChild(issueRow(it));
      $view.appendChild(list);
    };
    section("待处理 / 进行中", openItems, "open");
    section("已闭环", closedItems, "closed");
  }

  function issueRow(it, opts) {
    opts = opts || {};
    const stateLabel = STATE_LABEL[it.lifecycle_state] || it.lifecycle_state;
    const summary = it.summary_zh || it.summary || "";
    const ageVal = fmtAge(it.last_activity_at);
    const isStale = it.nonclosure_reason && it.last_activity_at &&
      (Date.now() - new Date(it.last_activity_at).getTime()) > 86400000;
    // In cross-customer lists (shift review) show which customer this issue is
    // under, as a chip that jumps to that customer's page.
    const custChip = opts.showCustomer
      ? el("span", { class: "cust-chip",
                     onclick: (e) => {
                       e.stopPropagation();
                       location.hash = "#/customers/" + customerKey(it);
                     } },
          customerLabel(it))
      : null;
    return el("div", { class: "issue-row",
                       onclick: () => location.hash = "#/issues/" + it.id },
      el("span", { class: "pill " + it.lifecycle_state }, stateLabel),
      el("div", null,
        custChip ? el("div", { class: "cust-line" }, custChip) : null,
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
    renderNav(null);
    $view.innerHTML = "";
    $view.appendChild(el("div", { class: "loading" }, "加载中…"));
    $back.hidden = false;
    // Provisional: until we know the parent channel, fall back to home. Replaced
    // below once the issue's channel is known. (history.back() is unreliable —
    // direct loads / re-renders leave nothing to go back to, so the button
    // appeared dead.)
    $back.onclick = () => location.hash = "#/";

    const data = await api("/api/v1/dashboard/issues/" + encodeURIComponent(issueId) + "/transcript");
    const it = data.issue || {};
    const turns = data.transcript || [];
    const hist = data.history || [];

    const channelKey = customerKey({
      customer_platform: it.customer_platform,
      customer_workspace_id: it.customer_workspace_id,
      customer_channel_id: it.customer_channel_id,
    });
    // Back → the customer's issue list this issue belongs to.
    $back.onclick = () => location.hash = "#/customers/" + channelKey;

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
      platformPill(it.customer_platform),
      it.code ? el("span", { class: "meta-item code" }, it.code) : null,
      it.external_party_name ? el("span", { class: "meta-item" }, "👤 " + it.external_party_name) : null,
      el("span", { class: "meta-item" }, (it.message_count || turns.length) + " 条消息"),
      el("span", { class: "meta-item" }, "最后活动 " + fmtAge(it.last_activity_at)));
    detail.appendChild(meta);

    const prods = (it.metadata && it.metadata.products) || [];
    if (Array.isArray(prods) && prods.length) {
      detail.appendChild(el("div", { class: "tags" }, productPills(prods)));
    }


    const md = it.metadata || {};
    const summaryZh = md.summary_zh || it.summary_zh;
    const summaryEn = md.summary || it.summary;
    if (summaryZh) {
      detail.appendChild(el("div", { class: "summary-block" }, summaryZh));
      if (summaryEn && summaryEn !== summaryZh) {
        detail.appendChild(el("div", { class: "summary-block en" }, summaryEn));
      }
    } else if (summaryEn) {
      detail.appendChild(el("div", { class: "summary-block" }, summaryEn));
    }

    // Suggested next action (建议 TODO) — generated by distill, shown as an
    // actionable callout near the summary (and repeated at the bottom).
    const nextAction = (md.next_action_zh || "").trim();
    if (nextAction) {
      detail.appendChild(el("div", { class: "todo-block" },
        el("span", { class: "todo-label" }, "建议 TODO"),
        el("span", { class: "todo-text" }, nextAction)));
    }

    // Participants (经手同学): support logs in with a *shared* account, so the
    // real handlers are the distinct 我方 senders in the transcript. This is the
    // hook a future shift-roster will attribute work against.
    const handlers = [];
    const seen = new Set();
    for (const t of turns) {
      if (t.role === "agent") {
        const n = t.sender_name || t.sender_id;
        if (n && !seen.has(n)) { seen.add(n); handlers.push(n); }
      }
    }
    if (handlers.length) {
      detail.appendChild(el("div", { class: "handlers" },
        el("span", { class: "handlers-label" }, "经手同学"),
        ...handlers.map((h) => el("span", { class: "handler-chip" }, h))));
    }

    // State-aware review actions.
    //  - 疑似闭环 (closed_inferred): 确认闭环 / 未闭环 / 忽略
    //  - 已闭环 (closed_confirmed): 重新打开
    //  - 其它(进行中): 确认为真问题 / 标记已闭环 / 忽略
    const actions = el("div", { class: "actions" });
    const btn = (label, action, cls) =>
      el("button", cls ? { class: cls, onclick: () => act(issueId, action) }
                        : { onclick: () => act(issueId, action) }, label);
    const st = it.lifecycle_state;
    if (st === "closed_inferred") {
      actions.appendChild(btn("✓ 确认闭环", "close"));
      actions.appendChild(btn("✗ 未闭环", "reopen", "warn"));
      actions.appendChild(btn("✕ 忽略", "reject", "danger"));
    } else if (st === "closed_confirmed") {
      actions.appendChild(btn("↩ 重新打开", "reopen", "warn"));
    } else {
      actions.appendChild(btn("✓ 确认为真问题", "confirm"));
      actions.appendChild(btn("✓ 标记已闭环", "close"));
      actions.appendChild(btn("✕ 忽略", "reject", "danger"));
    }
    detail.appendChild(actions);

    // transcript
    const tx = el("div", { class: "transcript" });
    tx.appendChild(el("h3", null, "聊天记录 (" + turns.length + " 条)"));
    if (!turns.length) {
      tx.appendChild(el("div", { class: "turn" },
        el("span", { class: "text" }, "无证据消息")));
    } else {
      const ROLE_LABEL = { customer: "客户", agent: "我方", bot: "机器人", system: "系统" };
      let lastDay = null;
      for (const t of turns) {
        // Date divider when the calendar day changes (long threads span days).
        const day = t.ts ? new Date(t.ts).toISOString().slice(0, 10) : null;
        if (day && day !== lastDay) {
          tx.appendChild(el("div", { class: "day-divider" }, day));
          lastDay = day;
        }
        const role = t.role || "system";
        tx.appendChild(el("div", { class: "turn " + role },
          el("span", { class: "role-badge " + role }, ROLE_LABEL[role] || role),
          el("span", { class: "who" }, t.sender_name || t.sender_id || (t.role || "?")),
          el("span", { class: "when" }, t.ts ? fmtDate(t.ts) : "—"),
          el("span", { class: "text" }, t.text || "(无文本)")));
      }
    }
    detail.appendChild(tx);

    // Repeat the suggested TODO at the bottom, so a reviewer who scrolled the
    // whole transcript sees the recommended next step without scrolling back up.
    if (nextAction) {
      detail.appendChild(el("div", { class: "todo-block bottom" },
        el("span", { class: "todo-label" }, "建议 TODO"),
        el("span", { class: "todo-text" }, nextAction)));
    }

    if (hist.length) {
      const ul = el("ul", { class: "timeline" });
      ul.appendChild(el("li", null,
        el("strong", null, "时间线 (" + hist.length + " 条)")));
      for (const h of hist) {
        ul.appendChild(el("li", null,
          fmtAge(h.ts) + " · " + h.field + " · " + (h.actor_mxid || "")));
      }
      detail.appendChild(ul);
    }

    $view.appendChild(detail);
  }

  const ACT_DONE = {
    confirm: "已确认", reject: "已忽略", dismiss: "已忽略",
    close: "已确认闭环", reopen: "已重新打开",
  };
  async function act(issueId, action) {
    try {
      setStatus("提交中…");
      await api("/api/v1/dashboard/issues/" + issueId + "/review",
        { method: "POST", json: { action } });
      setStatus(ACT_DONE[action] || "已提交", "ok");
      setTimeout(() => setStatus(""), 1500);
      // re-render current view
      route();
    } catch (e) { setStatus(String(e.message || e), "error"); }
  }

  // -------------------------------------------------------------------------
  // Admin: pending access requests
  // -------------------------------------------------------------------------

  async function renderAdmin() {
    $strip.style.display = "none";
    renderNav(null);
    $back.hidden = false;
    $back.onclick = () => location.hash = "#/";
    $title.textContent = "待审批用户";
    $crumbs.innerHTML = "";
    $crumbs.appendChild(el("a", { onclick: () => location.hash = "#/" }, "全部客户"));
    $crumbs.appendChild(document.createTextNode(" / 待审批"));
    $view.innerHTML = "";
    $view.appendChild(el("div", { class: "loading" }, "加载中…"));
    const data = await api("/api/dashboard/pending");
    const items = data.items || [];
    $view.innerHTML = "";
    if (!items.length) {
      $view.appendChild(el("div", { class: "empty" }, "暂无待审批申请"));
      return;
    }
    const list = el("div", { class: "issue-list" });
    for (const u of items) {
      const row = el("div", { class: "issue-row" },
        el("div", null,
          el("div", { class: "title" }, (u.name || "") + " · " + u.email),
          el("div", { class: "who" }, "申请于 " + (u.requested_at ? fmtDate(u.requested_at) : "—"))),
        el("div", { class: "actions" },
          el("button", { onclick: async () => { await decide(u.email, "approve"); } }, "✓ 批准"),
          el("button", { class: "danger", onclick: async () => { await decide(u.email, "reject"); } }, "✕ 拒绝")));
      list.appendChild(row);
    }
    $view.appendChild(list);
  }

  async function decide(email, action) {
    try {
      setStatus("提交中…");
      await api("/api/dashboard/decide", { method: "POST", json: { email, action } });
      setStatus(action === "approve" ? "已批准" : "已拒绝", "ok");
      setTimeout(() => setStatus(""), 1200);
      renderAdmin();
    } catch (e) { setStatus(String(e.message || e), "error"); }
  }

  // -------------------------------------------------------------------------
  // View 4: shift review (8h rolling window) — end-of-shift handoff panel
  // -------------------------------------------------------------------------

  async function renderShift() {
    $strip.style.display = "none";
    renderNav("shift");
    $view.innerHTML = "";
    $back.hidden = false;
    $back.onclick = () => location.hash = "#/";
    $title.textContent = "班次复盘";
    $crumbs.innerHTML = "";
    $crumbs.appendChild(el("a", { onclick: () => location.hash = "#/" }, "全部客户"));
    $crumbs.appendChild(document.createTextNode(" / 班次复盘"));
    $view.appendChild(el("div", { class: "loading" }, "加载中…"));

    const hours = shiftHours;
    const data = await api("/api/v1/dashboard/shift?hours=" + hours);
    $view.innerHTML = "";

    // Window selector — default 8h, but a reviewer covering a long/handed-over
    // shift can widen it.
    const sel = el("div", { class: "chip-row shift-controls" },
      el("span", { class: "chip-label" }, "时间窗口"));
    for (const h of [8, 12, 24]) {
      sel.appendChild(el("button",
        { class: "chip" + (h === hours ? " active" : ""),
          onclick: () => { shiftHours = h; renderShift(); } },
        h + " 小时"));
    }
    $view.appendChild(sel);

    const counts = data.counts || {};
    const strip = el("div", { class: "shift-strip" },
      card("新增问题", counts.new || 0, ""),
      card("活跃问题", counts.active || 0, "amber"),
      card("已闭环", counts.closed || 0, "green"));
    $view.appendChild(strip);

    if (data.since) {
      $view.appendChild(el("div", { class: "shift-since" },
        "统计窗口：" + fmtDate(data.since) + " 至今（约 " + hours + " 小时）"));
    }

    const section = (label, rows, cls) => {
      $view.appendChild(el("div", { class: "list-subhead " + (cls || "") },
        label + " (" + rows.length + ")"));
      if (!rows.length) {
        $view.appendChild(el("div", { class: "empty sm" }, "本班次无"));
        return;
      }
      const list = el("div", { class: "issue-list" });
      for (const it of rows) list.appendChild(issueRow(it, { showCustomer: true }));
      $view.appendChild(list);
    };
    section("🆕 新增问题", data.new_issues || [], "open");
    section("🔥 活跃问题", data.active_issues || [], "open");
    section("✅ 已闭环", data.closed_issues || [], "closed");
  }

  // -------------------------------------------------------------------------
  // View 5: ticket archive — every issue as a ticket record (flat list)
  // -------------------------------------------------------------------------

  const TICKET_STATUS_TABS = [
    { key: "all", label: "全部" },
    { key: "open", label: "进行中" },
    { key: "closed", label: "已闭环" },
  ];

  function ticketRow(it) {
    const stateLabel = STATE_LABEL[it.lifecycle_state] || it.lifecycle_state;
    const summary = it.summary_zh || it.summary || "";
    const handler = it.last_handler
      ? "经手 " + it.last_handler +
        (it.handler_count > 1 ? " 等 " + it.handler_count + " 人" : "")
      : null;
    const closed = (it.lifecycle_state === "closed_confirmed" ||
                    it.lifecycle_state === "closed_inferred");
    const whenLabel = closed && it.closed_at
      ? "闭环 " + fmtAge(it.closed_at)
      : fmtAge(it.last_activity_at);
    return el("div", { class: "issue-row",
                       onclick: () => location.hash = "#/issues/" + it.id },
      el("span", { class: "pill " + it.lifecycle_state }, stateLabel),
      el("div", null,
        el("div", { class: "cust-line" },
          el("span", { class: "cust-chip",
                       onclick: (e) => { e.stopPropagation();
                         location.hash = "#/customers/" + customerKey(it); } },
            customerLabel(it)),
          it.code ? el("span", { class: "ticket-code" }, it.code) : null,
          ...productPills(Array.isArray(it.products) ? it.products : [])),
        el("div", { class: "title" }, it.title || "(无标题)"),
        summary ? el("div", { class: "summary" }, summary) : null,
        el("div", { class: "who" },
          (it.message_count || 0) + " 条消息" +
          (handler ? " · " + handler : ""))),
      el("div", { class: "when" }, whenLabel));
  }

  let _ticketSearchTimer = null;

  async function renderTickets() {
    $strip.style.display = "none";
    renderNav("tickets");
    $back.hidden = true;
    $title.textContent = "Ticket 记录";
    $crumbs.innerHTML = "";
    $view.innerHTML = "";

    // Filter bar (built once per visit; search only refreshes the list below so
    // typing never loses focus, status tabs re-render to flip the active chip).
    const bar = el("div", { class: "filter-bar", id: "ticket-bar" });
    const search = el("input", {
      class: "cust-search", type: "search", id: "ticket-search",
      placeholder: "搜索标题 / 编号 / 客户…", value: ticketFilter.q || "",
    });
    search.addEventListener("input", (e) => {
      ticketFilter.q = e.target.value;
      clearTimeout(_ticketSearchTimer);
      _ticketSearchTimer = setTimeout(refreshTicketList, 250);
    });
    bar.appendChild(el("div", { class: "chip-row" }, search));
    const tabRow = el("div", { class: "chip-row" }, el("span", { class: "chip-label" }, "状态"));
    for (const t of TICKET_STATUS_TABS) {
      tabRow.appendChild(el("button",
        { class: "chip" + (ticketFilter.status === t.key ? " active" : ""),
          onclick: () => { ticketFilter.status = t.key; renderTickets(); } },
        t.label));
    }
    bar.appendChild(tabRow);
    $view.appendChild(bar);

    // List container, filled by refreshTicketList.
    $view.appendChild(el("div", { class: "ticket-list-wrap", id: "ticket-list-wrap" }));
    await refreshTicketList();
  }

  async function refreshTicketList() {
    const wrap = document.getElementById("ticket-list-wrap");
    if (!wrap) return;
    wrap.innerHTML = "";
    wrap.appendChild(el("div", { class: "loading" }, "加载中…"));

    const params = new URLSearchParams({ status: ticketFilter.status, limit: "300" });
    if (ticketFilter.q) params.set("q", ticketFilter.q);
    let data;
    try {
      data = await api("/api/v1/dashboard/tickets?" + params);
    } catch (e) {
      wrap.innerHTML = "";
      wrap.appendChild(el("div", { class: "empty" }, String(e.message || e)));
      return;
    }
    const items = data.items || [];
    wrap.innerHTML = "";
    wrap.appendChild(el("div", { class: "list-subhead" },
      "共 " + (data.total != null ? data.total : items.length) + " 条" +
      (data.total > items.length ? "（显示前 " + items.length + " 条）" : "")));
    if (!items.length) {
      wrap.appendChild(el("div", { class: "empty" }, "无匹配的 ticket"));
      return;
    }
    const list = el("div", { class: "issue-list" });
    for (const it of items) list.appendChild(ticketRow(it));
    wrap.appendChild(list);
  }

  // -------------------------------------------------------------------------
  // Router
  // -------------------------------------------------------------------------

  async function route() {
    const hash = location.hash || "#/";
    setStatus("");
    // Filter bar + source bar belong to the root view only; drop on any nav
    // (renderRoot re-shows the source bar).
    if (hash !== "#/" && hash !== "#") {
      const fb = document.getElementById("filter-bar");
      if (fb) fb.remove();
      $sources.hidden = true;
      $periodBar.hidden = true;
    }
    try {
      if (hash === "#/" || hash === "#") {
        await renderRoot();
      } else if (hash === "#/shift") {
        await renderShift();
      } else if (hash === "#/tickets") {
        await renderTickets();
      } else if (hash === "#/admin") {
        await renderAdmin();
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

  // -------------------------------------------------------------------------
  // Feishu login / approval gate — runs before the dashboard renders.
  // -------------------------------------------------------------------------

  let _me = null;          // whoami result
  function isAdmin() { return _me && _me.role === "admin" && _me.status === "approved"; }

  function gateScreen(title, desc, btn) {
    $strip.style.display = "none";
    $sources.hidden = true;
    $periodBar.hidden = true;
    renderNav(null);
    $crumbs.innerHTML = "";
    $back.hidden = true;
    $view.innerHTML = "";
    const box = el("div", { class: "gate" },
      el("h2", null, title),
      desc ? el("p", null, desc) : null);
    if (btn) box.appendChild(btn);
    $view.appendChild(box);
  }

  function loginBtn(label) {
    return el("a", { class: "gate-btn",
      href: "/api/auth/feishu/login?state=" + encodeURIComponent("/dashboard") },
      label || "飞书登录");
  }

  async function boot() {
    try {
      _me = await api("/api/dashboard/whoami");
    } catch (e) {
      _me = { authed: false };
    }
    if (!_me.authed) {
      gateScreen("客户问题闭环看板", "请使用飞书登录后访问。", loginBtn("飞书登录"));
      return;
    }
    if (_me.status === "approved") {
      // Show an admin entry point in the header if applicable, then render.
      installHeaderUser();
      route();
      return;
    }
    if (_me.status === "pending") {
      gateScreen("申请审核中", `你的账号 ${_me.email} 已提交申请，请等待管理员批准。`,
        el("button", { class: "gate-btn", onclick: () => boot() }, "刷新状态"));
      return;
    }
    if (_me.status === "rejected") {
      gateScreen("申请被拒绝", `账号 ${_me.email} 的访问申请已被拒绝。如有疑问请联系管理员。`, null);
      return;
    }
    // status === 'none' (logged in, never applied)
    gateScreen("申请访问", `已登录为 ${_me.email}。该看板包含全部客户数据，需管理员批准后访问。`,
      el("button", { class: "gate-btn",
        onclick: async () => {
          try { await api("/api/dashboard/apply", { method: "POST", json: {} }); }
          catch (e) {}
          boot();
        } }, "申请访问"));
  }

  function installHeaderUser() {
    // a small user chip + logout + (admin) pending-review link in the header
    let bar = document.getElementById("user-chip");
    if (bar) bar.remove();
    bar = el("div", { class: "user-chip", id: "user-chip" },
      el("span", { class: "uname" }, (_me.name || _me.email) + (isAdmin() ? " · 管理员" : "")));
    if (isAdmin()) {
      bar.appendChild(el("a", { class: "link", onclick: () => location.hash = "#/admin" }, "待审批"));
    }
    bar.appendChild(el("a", { class: "link", onclick: async () => {
      await api("/api/dashboard/logout", { method: "POST", json: {} }); boot();
    } }, "退出"));
    document.querySelector(".dash-header").appendChild(bar);
  }

  boot();
})();

