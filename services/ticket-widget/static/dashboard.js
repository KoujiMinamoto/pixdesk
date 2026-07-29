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
    { key: "stale", label: "超7天待审批", hash: "#/stale" },
    { key: "shift", label: "班次复盘", hash: "#/shift" },
    { key: "tickets", label: "Ticket 记录", hash: "#/tickets" },
    { key: "report", label: "工单报表", hash: "#/report" },
  ];
  function renderNav(active) {
    // Tabs stay visible on every view (detail pages pass active=null — no tab
    // highlighted, but you can still jump anywhere); only the login gate hides
    // them via gateScreen.
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
  // issue_history.field → human label for the timeline (the human-review events;
  // detector/distill fields fall through to the raw name).
  const FIELD_LABEL = {
    closure_confirmed: "确认闭环", review_confirmed: "确认为真问题",
    reopened_by_review: "重新打开", escalated_sre: "升级 SRE", dismissed: "忽略",
    internal_confirm: "标记内部确认中",
  };
  const PLATFORM_LABEL = { discord: "Discord", slack: "Slack", gmail: "Gmail" };

  // Resolve an actor mxid to a 花名 using the server-provided map. Human reviewers
  // are matrix mxids '@<open_id>:feishu'; system writers are '@issue-engine:<host>'.
  // Falls back to the bare open_id for an unmapped reviewer, "系统" for the engine.
  function actorLabel(mxid, names) {
    if (!mxid) return "系统";
    if (names && names[mxid]) return names[mxid];
    const m = /^@(.*):feishu$/.exec(mxid);
    if (m) return m[1];
    if (/^@issue-engine:/.test(mxid)) return "系统";
    return mxid;
  }

  // Home-page filter state + the last rollup payload, so chip clicks re-render
  // the grid without re-fetching.
  const filter = { platform: null, product: null, q: "", keyOnly: false };
  let _rollupItems = [];
  // Home customer view: "grid" (cards) or "list" (one row per customer).
  let viewMode = localStorage.getItem("ov_view") || "grid";
  // Shift-review window in hours (support runs 3 rotating 8h shifts).
  let shiftHours = 8;
  // Shift-workload (per-colleague) panel: its own period selector, defaulting
  // to last_week (a full past shift cycle is the common review unit).
  let workloadPeriod = localStorage.getItem("wl_period") || "last_week";
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

  // 标记系统: channel classification labels (供应商 etc. are hidden from all
  // customer-facing views; only admins can change the class, on the customer page).
  const CHANNEL_CLASS_LABEL = {
    customer: "客户", supplier: "供应商", internal: "内部", ignore: "忽略",
  };

  // 重点客户徽章 — L7 白金 / L6 金 / L5 银, with the level text on the badge.
  const TIER_CLASS = { L7: "platinum", L6: "gold", L5: "silver" };
  const TIER_NAME = { L7: "白金", L6: "金", L5: "银" };
  function tierBadge(tier, sales) {
    if (!tier) return null;
    return el("span", {
      class: "tier-badge tier-" + (TIER_CLASS[tier] || "silver"),
      title: "重点客户 · " + (TIER_NAME[tier] || "") + "牌" +
             (sales ? " · 销售 " + sales : "") },
      el("span", { class: "tier-medal" }, "★"), tier);
  }

  function matchesFilter(c) {
    if (filter.keyOnly && !c.tier) return false;
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
    const drill = (key) => () => location.hash = "#/metric/" + key;
    $strip.innerHTML = "";
    // 活跃客户 has no drill-down — the customer grid below IS its list; 新增对话
    // counts conversations, which have no issue-list equivalent.
    $strip.appendChild(card(px + "活跃客户", summary.active_customers || 0, ""));
    $strip.appendChild(card(px + "新增问题", summary.new_issues || 0, "", null, drill("new_issues")));
    $strip.appendChild(card(px + "活跃问题", summary.active_issues || 0, "", null, drill("active_issues")));
    $strip.appendChild(card(px + "新增对话", summary.new_conversations || 0, ""));
    $strip.appendChild(card(px + "新闭环", summary.new_closed || 0, "green", null, drill("new_closed")));
    $strip.appendChild(card("待我方回复", summary.awaiting_us || 0, "red", "实时", drill("awaiting_us")));
  }

  // Re-fetch the summary AND customer rollup for the current overview window and
  // repaint both the strip and the customer cards — they share the same period,
  // so the 活跃客户 count and the card list stay consistent.
  async function refreshStrip() {
    $strip.style.opacity = "0.5";
    try {
      const [summary, rollup] = await Promise.all([
        api("/api/v1/dashboard/summary" + summaryQuery()),
        api("/api/v1/dashboard/rollup" + summaryQuery()),
      ]);
      renderStrip(summary);
      _rollupItems = rollup.items || [];
      if (!_rollupItems.length) {
        $view.innerHTML = "";
        $view.appendChild(el("div", { class: "empty" }, "🎉 该时段暂无客户问题"));
      } else {
        renderFilterBar();
        renderGrid();
      }
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
      api("/api/v1/dashboard/rollup" + summaryQuery()),
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
    const viewToggle = el("div", { class: "view-toggle" },
      chip("▦ 卡片", viewMode === "grid",
        () => { viewMode = "grid"; localStorage.setItem("ov_view", "grid"); renderGrid(); refreshChips(); }),
      chip("☰ 列表", viewMode === "list",
        () => { viewMode = "list"; localStorage.setItem("ov_view", "list"); renderGrid(); refreshChips(); }));
    bar.appendChild(el("div", { class: "chip-row" }, search, viewToggle));

    const platRow = el("div", { class: "chip-row" }, el("span", { class: "chip-label" }, "平台"));
    platRow.appendChild(chip("全部", !filter.platform, () => { filter.platform = null; renderGrid(); refreshChips(); }));
    for (const p of platforms) {
      platRow.appendChild(chip(PLATFORM_LABEL[p] || p, filter.platform === p,
        () => { filter.platform = p; renderGrid(); refreshChips(); }));
    }
    platRow.appendChild(el("span", { class: "chip-label" }, "客户级"));
    platRow.appendChild(chip("全部", !filter.keyOnly,
      () => { filter.keyOnly = false; renderGrid(); refreshChips(); }));
    platRow.appendChild(chip("★ 重点客户", filter.keyOnly,
      () => { filter.keyOnly = true; renderGrid(); refreshChips(); }));
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
    if (viewMode === "list") {
      const list = el("div", { class: "customer-list" });
      for (const c of shown) list.appendChild(customerRow(c));
      $view.appendChild(list);
    } else {
      const grid = el("div", { class: "customer-grid" });
      for (const c of shown) grid.appendChild(customerCard(c));
      $view.appendChild(grid);
    }
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

  function card(label, value, kind, sub, onClick) {
    return el("div", {
      class: "summary-card " + (kind || "") + (onClick ? " clickable" : ""),
      title: onClick ? "点击查看列表" : null,
      onclick: onClick || null },
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
      el("div", { class: "name" }, customerLabel(c), tierBadge(c.tier, c.key_sales)),
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

  // One customer as a horizontal list row (compact alternative to the card).
  // Same data as customerCard — just a denser layout for scanning many customers.
  function customerRow(c) {
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

    return el("div", { class: "customer-row", onclick: () => location.hash = "#/customers/" + key },
      el("div", { class: "cr-tags" }, platformPill(c.customer_platform), productPills(c.products)),
      el("div", { class: "cr-name" }, customerLabel(c), tierBadge(c.tier, c.key_sales)),
      el("div", { class: "cr-stats" },
        el("span", { class: "cr-n red", title: "待回复" }, String(unclosed)),
        el("span", { class: "cr-n amber", title: "待确认" }, String(suggested)),
        el("span", { class: "cr-n green", title: "已闭环" }, String(closed))),
      el("div", { class: "cr-bar bar" },
        el("span", { class: "unclosed", style: `width:${pctU}%` }),
        el("span", { class: "suggested", style: `width:${pctS}%` }),
        el("span", { class: "resolved", style: `width:${pctR}%` })),
      el("div", { class: "cr-stale" + staleClass }, stale ? "最久 " + stale + " 起未回" : ""));
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
    $back.onclick = () => goBack("#/");

    const params = new URLSearchParams({
      platform, workspace_id, channel_id,
      include_closed: "true",
    });
    const data = await api("/api/v1/dashboard/customers/issues?" + params);
    const items = data.items || [];
    const channelName = (data.channel && data.channel.channel_name) ||
                        workspace_id;

    $title.textContent = channelName;
    const custTier = tierBadge(data.tier, data.key_sales);
    if (custTier) $title.appendChild(custTier);
    $crumbs.innerHTML = "";
    $crumbs.appendChild(el("a", { onclick: () => location.hash = "#/" }, "全部客户"));
    $crumbs.appendChild(document.createTextNode(" / " + channelName));

    $view.innerHTML = "";

    // 标记系统: current class + (admin-only) reclassify chips. Non-customer
    // classes are hidden from every customer-facing list/alert/stat.
    const cls = data.channel_class || "customer";
    if (cls !== "customer") {
      $view.appendChild(el("div", { class: "summary-block" },
        "🏷 该频道已标记为「" + (CHANNEL_CLASS_LABEL[cls] || cls) + "」" +
        "——不出现在客户列表、指标、SLA 告警和统计中（直接访问本页仍可查看）。"));
    }
    if (isAdmin()) {
      const selRow = el("div", { class: "chip-row chan-class-row" },
        el("span", { class: "chip-label" }, "频道类型"));
      for (const [k, label] of Object.entries(CHANNEL_CLASS_LABEL)) {
        selRow.appendChild(el("button", { class: "chip" + (cls === k ? " active" : ""),
          onclick: async () => {
            if (k === cls) return;
            const warn = k === "customer"
              ? "将重新出现在客户记录中。"
              : "将从客户列表、指标、SLA 告警和统计中隐藏。";
            if (!confirm("将「" + channelName + "」标记为「" + label + "」？" + warn)) return;
            try {
              await api("/api/v1/dashboard/channel-class", { method: "POST",
                json: { platform, workspace_id, channel_id, channel_class: k } });
            } catch (e) { alert("标记失败：" + (e.message || e)); return; }
            setStatus("已标记为「" + label + "」", "ok");
            renderCustomer(key);
          } }, label));
      }
      $view.appendChild(selRow);
    }

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
          (opts.showOwner && it.owner ? " · 责任人 " + it.owner : "") +
          (it.last_speaker ? " · 最后 " + (it.last_speaker === "customer" ? "客户" : "我方") : "") +
          (it.closed_by_name ? " · ✅ " + it.closed_by_name : "")
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
    // below once the issue's channel is known.
    $back.onclick = () => goBack("#/");

    const data = await api("/api/v1/dashboard/issues/" + encodeURIComponent(issueId) + "/transcript");
    const it = data.issue || {};
    const turns = data.transcript || [];
    const hist = data.history || [];
    const names = data.actor_names || {};

    const channelKey = customerKey({
      customer_platform: it.customer_platform,
      customer_workspace_id: it.customer_workspace_id,
      customer_channel_id: it.customer_channel_id,
    });
    // Back → wherever you came from (stale queue, shift page, metric list…);
    // direct loads fall back to the customer's issue list.
    $back.onclick = () => goBack("#/customers/" + channelKey);

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
      tierBadge(it.tier, it.key_sales),
      it.code ? el("span", { class: "meta-item code" }, it.code) : null,
      it.owner ? el("span", { class: "meta-item",
        title: "责任人：工单创建时刻的值班同事（按排班表）" }, "🧑‍💼 责任人 " + it.owner) : null,
      it.external_party_name ? el("span", { class: "meta-item" }, "👤 " + it.external_party_name) : null,
      el("span", { class: "meta-item" }, (it.message_count || turns.length) + " 条消息"),
      el("span", { class: "meta-item" }, "最后活动 " + fmtAge(it.last_activity_at)),
      it.chat_deeplink
        ? el("a", { class: "meta-item chat-link", href: it.chat_deeplink,
                    target: "_blank", rel: "noopener",
                    title: "在 " + (it.customer_platform === "discord" ? "Discord" : "Slack") + " 中打开原始对话"
                      + (it.channel_name ? "：#" + it.channel_name : "")
                      + "（若提示无权限，需先加入该频道）" },
            "↗ 打开对话" + (it.channel_name ? " · #" + it.channel_name : ""))
        : null);
    detail.appendChild(meta);

    // 谁点了闭环: authoritative source is the latest closure_confirmed history
    // event (issues.reviewed_by_mxid can be overwritten by later system actions).
    // hist is ts-DESC, so find() returns the most recent closure.
    const closureEvt = it.lifecycle_state === "closed_confirmed"
      ? hist.find((h) => h.field === "closure_confirmed") : null;
    if (closureEvt) {
      detail.appendChild(el("div", { class: "closed-by" },
        "✅ 闭环人：" + actorLabel(closureEvt.actor_mxid, names)
          + (closureEvt.ts ? " · " + fmtDate(closureEvt.ts) : "")));
    }

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

    // State-aware review actions. Only roster members (+admins) can write; other
    // approved viewers see the issue read-only (backend also enforces this).
    const actions = el("div", { class: "actions" });
    const btn = (label, action, cls) =>
      el("button", cls ? { class: cls, onclick: () => act(issueId, action) }
                        : { onclick: () => act(issueId, action) }, label);
    const st = it.lifecycle_state;
    if (!canWrite()) {
      // no action buttons for non-roster viewers
    } else if (st === "closed_inferred") {
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
    if (actions.childNodes.length) detail.appendChild(actions);

    // transcript — pinned turns + greyed thread-context rows (messages of the
    // same Slack/Discord thread that belong to another issue / no issue), so
    // the drawer always shows the complete thread.
    const tx = el("div", { class: "transcript" });
    const ownCount = data.transcript_count != null
      ? data.transcript_count : turns.filter((t) => !t.is_context).length;
    const ctxCount = data.context_count || 0;
    tx.appendChild(el("h3", null, "聊天记录 (" + ownCount + " 条" +
      (ctxCount ? " · 含 " + ctxCount + " 条线程上下文" : "") + ")"));
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
        const ctxBadge = t.is_context
          ? (t.context_issue_code
              ? el("a", { class: "ctx-badge",
                          title: "这条消息按话题归入了另一个工单，点击查看",
                          onclick: () => location.hash = "#/issues/" + t.context_issue_id },
                  "→ 已归入 " + t.context_issue_code)
              : el("span", { class: "ctx-badge" }, "线程上下文·未归档"))
          : null;
        tx.appendChild(el("div", { class: "turn " + role + (t.is_context ? " context" : "") },
          el("span", { class: "role-badge " + role }, ROLE_LABEL[role] || role),
          el("span", { class: "who" }, t.sender_name || t.sender_id || (t.role || "?")),
          el("span", { class: "when" }, t.ts ? fmtDate(t.ts) : "—"),
          ctxBadge,
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
          fmtAge(h.ts) + " · " + (FIELD_LABEL[h.field] || h.field)
            + " · " + actorLabel(h.actor_mxid, names)));
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
    $back.onclick = () => goBack("#/");
    $title.textContent = "成员管理";
    $crumbs.innerHTML = "";
    $crumbs.appendChild(el("a", { onclick: () => location.hash = "#/" }, "全部客户"));
    $crumbs.appendChild(document.createTextNode(" / 成员管理"));
    $view.innerHTML = "";
    $view.appendChild(el("div", { class: "loading" }, "加载中…"));
    let data;
    try {
      data = await api("/api/dashboard/members");
    } catch (e) {
      $view.innerHTML = "";
      $view.appendChild(el("div", { class: "empty" }, String(e.message || e)));
      return;
    }
    $view.innerHTML = "";
    const members = data.members || [];
    const persons = data.roster_persons || [];
    const meId = data.me;

    const pending = members.filter((m) => m.status === "pending");
    if (pending.length) {
      $view.appendChild(el("div", { class: "list-subhead" },
        "—— 待审批（" + pending.length + "）——"));
      const plist = el("div", { class: "issue-list" });
      for (const u of pending) {
        plist.appendChild(el("div", { class: "issue-row" },
          el("div", null,
            el("div", { class: "title" }, (u.name || "") + " · " + u.email),
            el("div", { class: "who" }, "申请于 " + (u.requested_at ? fmtDate(u.requested_at) : "—"))),
          el("div", { class: "actions" },
            el("button", { onclick: async () => { await decide(u.email, "approve"); } }, "✓ 批准"),
            el("button", { class: "danger", onclick: async () => { await decide(u.email, "reject"); } }, "✕ 拒绝"))));
      }
      $view.appendChild(plist);
    }

    $view.appendChild(el("div", { class: "list-subhead" },
      "—— 全部成员（" + members.length + "）——"));
    $view.appendChild(el("div", { class: "member-note" },
      "角色 admin = 全权限；「可写」= 能确认闭环/非闭环/升级SRE（admin 恒可写）；"
      + "「排班花名」只决定下班结算归自己名下，与权限无关。停用 = 禁止登录看板。"));
    const table = el("div", { class: "member-list" });
    for (const m of members.filter((x) => x.status !== "pending")) {
      table.appendChild(memberRow(m, persons, meId));
    }
    $view.appendChild(table);
  }

  // One member row with inline permission controls. Each change POSTs
  // members/update and repaints the row in place from the server's response.
  function memberRow(m, persons, meId) {
    const isSelf = m.feishu_user_id === meId;
    const row = el("div", { class: "member-row" + (m.status === "rejected" ? " off" : "") });

    async function patch(p, label) {
      row.classList.add("busy");
      try {
        const fresh = await api("/api/dashboard/members/update",
          { method: "POST", json: Object.assign({ feishu_user_id: m.feishu_user_id }, p) });
        Object.assign(m, fresh);
        setStatus(label + " ✓", "ok"); setTimeout(() => setStatus(""), 1200);
        row.replaceWith(memberRow(m, persons, meId));
      } catch (e) {
        row.classList.remove("busy");
        alert("修改失败：" + (e.message || e));
      }
    }

    // identity cell
    row.appendChild(el("div", { class: "m-id" },
      el("div", { class: "m-name" }, (m.name || "(未命名)") + (isSelf ? "（你自己）" : "")),
      el("div", { class: "m-email" }, m.email || m.feishu_user_id)));

    // role select
    const roleSel = el("select", { class: "m-ctl" },
      el("option", { value: "reviewer", selected: m.role === "reviewer" }, "reviewer"),
      el("option", { value: "admin", selected: m.role === "admin" }, "admin"));
    roleSel.disabled = isSelf;
    roleSel.addEventListener("change", () => patch({ role: roleSel.value }, "角色"));
    row.appendChild(el("div", { class: "m-cell" },
      el("span", { class: "m-label" }, "角色"), roleSel));

    // can_write toggle (admin implies writable, so show as locked-on)
    const cw = el("input", { type: "checkbox" });
    cw.checked = m.role === "admin" ? true : !!m.can_write;
    cw.disabled = m.role === "admin";
    cw.addEventListener("change", () => patch({ can_write: cw.checked }, "可写"));
    row.appendChild(el("div", { class: "m-cell" },
      el("span", { class: "m-label" }, "可写"), cw));

    // roster person select ("" = 不参与结算)
    const pSel = el("select", { class: "m-ctl" },
      el("option", { value: "", selected: !m.person }, "（无）"));
    for (const p of persons) {
      pSel.appendChild(el("option", { value: p, selected: m.person === p }, p));
    }
    pSel.addEventListener("change", () =>
      patch({ person: pSel.value, person_set: true }, "排班花名"));
    row.appendChild(el("div", { class: "m-cell" },
      el("span", { class: "m-label" }, "排班花名"), pSel));

    // status: 停用 / 恢复
    const isOff = m.status === "rejected";
    const stBtn = el("button", { class: "m-ctl " + (isOff ? "" : "danger"),
      onclick: () => {
        if (!confirm((isOff ? "恢复 " : "停用 ") + (m.name || m.email) + "？")) return;
        patch({ status: isOff ? "approved" : "rejected" }, isOff ? "恢复" : "停用");
      } }, isOff ? "恢复" : "停用");
    stBtn.disabled = isSelf;
    row.appendChild(el("div", { class: "m-cell" },
      isOff ? el("span", { class: "m-badge off" }, "已停用") : el("span", { class: "m-badge on" }, "正常"),
      stBtn));

    return row;
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

  // Per-colleague workload, attributed via the duty roster. Renders into
  // #wl-wrap (created by renderShift). Its own period selector; refetches and
  // repaints just this panel so it doesn't reload the whole shift view.
  function workloadQuery() {
    return "?period=" + workloadPeriod;
  }
  async function renderWorkload() {
    const wrap = document.getElementById("wl-wrap");
    if (!wrap) return;
    wrap.innerHTML = "";
    wrap.appendChild(el("h3", { class: "wl-title" }, "👥 值班同事工作量"));

    // period selector (reuse the overview presets, minus 今日/昨日 which are too
    // short for a shift-workload read — but keep them, a reviewer may want today).
    const sel = el("div", { class: "chip-row" }, el("span", { class: "chip-label" }, "时间范围"));
    for (const [key, label] of PERIODS) {
      if (key === "custom") continue;  // keep this panel to presets for now
      sel.appendChild(el("button",
        { class: "chip" + (workloadPeriod === key ? " active" : ""),
          onclick: () => {
            workloadPeriod = key; localStorage.setItem("wl_period", key);
            renderWorkload();
          } }, label));
    }
    wrap.appendChild(sel);

    const body = el("div", { class: "wl-body" }, el("div", { class: "loading" }, "加载中…"));
    wrap.appendChild(body);
    let data;
    try {
      data = await api("/api/v1/dashboard/shift-workload" + workloadQuery());
    } catch (e) {
      body.innerHTML = ""; body.appendChild(el("div", { class: "empty sm" }, String(e.message || e)));
      return;
    }
    body.innerHTML = "";
    if (data.win_start) {
      body.appendChild(el("div", { class: "shift-since" },
        "统计窗口：" + fmtDate(data.win_start) + " ~ " + fmtDate(data.win_end) +
        (data.roster_covered ? "" : "（⚠️ 该时段无排班表数据）")));
    }
    const people = data.people || [];
    if (!people.length) {
      body.appendChild(el("div", { class: "empty sm" }, "该时段无可归属的工作量"));
      return;
    }
    const tbl = el("div", { class: "wl-table" });
    tbl.appendChild(el("div", { class: "wl-row wl-head" },
      el("span", { class: "wl-name" }, "同事"),
      el("span", { class: "wl-n" }, "经手"),
      el("span", { class: "wl-n" }, "已闭环"),
      el("span", { class: "wl-n" }, "管理员关"),
      el("span", { class: "wl-n" }, "待确认"),
      el("span", { class: "wl-n" }, "进行中"),
      el("span", { class: "wl-n" }, "回复"),
      el("span", { class: "wl-n" }, "闭环率")));
    // status cell: clickable -> drilldown for (person, bucket)
    const statCell = (p, bucket, val, cls) =>
      el("span", { class: "wl-n wl-link " + (cls || ""),
                   onclick: () => openWorkloadDrill(p.person, bucket) },
        String(val || 0));
    for (const p of people) {
      tbl.appendChild(el("div", { class: "wl-row" },
        el("span", { class: "wl-name" }, p.person),
        statCell(p, "all", p.handled_issues, "strong"),
        statCell(p, "confirmed", p.confirmed, "green"),
        statCell(p, "admin_closed", p.admin_closed, "muted"),
        statCell(p, "inferred", p.inferred, "amber"),
        statCell(p, "open", p.open_n, "red"),
        el("span", { class: "wl-n muted" }, String(p.agent_msgs || 0)),
        el("span", { class: "wl-n" }, Math.round((p.close_rate || 0) * 100) + "%")));
      // inline drilldown slot under each row
      tbl.appendChild(el("div", { class: "wl-drill", id: "wl-drill-" + cssId(p.person) }));
    }
    body.appendChild(tbl);
    body.appendChild(el("div", { class: "wl-note" },
      "归属依据排班表（support 为共用账号，按值班时间推断经手人）。"
      + "经手=该时段有我方回复的不同问题数；已闭环=support/系统确认；管理员关="
      + "排班外管理员（如辉二）代为关闭、不计入闭环率；待确认=系统判定的疑似闭环、"
      + "需人工确认；进行中=仍未闭环；闭环率=(已闭环+待确认)/经手。点数字看明细。"));
  }

  // unique-ish id for a person name (Chinese -> safe token)
  function cssId(s) {
    return encodeURIComponent(s).replace(/[^a-zA-Z0-9]/g, "");
  }

  const BUCKET_LABEL = { all: "全部经手", confirmed: "已闭环",
    admin_closed: "管理员关闭（不计闭环率）",
    inferred: "待确认（疑似闭环）", open: "进行中" };

  // Toggle an inline list of the issues `person` handled in `bucket`, under
  // their row. Click the same cell again to collapse.
  async function openWorkloadDrill(person, bucket) {
    const slot = document.getElementById("wl-drill-" + cssId(person));
    if (!slot) return;
    const key = person + ":" + bucket;
    if (slot.dataset.open === key) { slot.innerHTML = ""; slot.dataset.open = ""; return; }
    slot.dataset.open = key;
    slot.innerHTML = "";
    slot.appendChild(el("div", { class: "loading sm" }, "加载中…"));
    const qs = new URLSearchParams({ person, period: workloadPeriod, bucket });
    let data;
    try {
      data = await api("/api/v1/dashboard/shift-workload/issues?" + qs);
    } catch (e) {
      slot.innerHTML = ""; slot.appendChild(el("div", { class: "empty sm" }, String(e.message || e)));
      return;
    }
    slot.innerHTML = "";
    slot.appendChild(el("div", { class: "wl-drill-head" },
      person + " · " + (BUCKET_LABEL[bucket] || bucket) + "（" + data.count + "）"));
    if (!data.items.length) {
      slot.appendChild(el("div", { class: "empty sm" }, "无"));
      return;
    }
    const list = el("div", { class: "issue-list" });
    for (const it of data.items) {
      const stateLabel = STATE_LABEL[it.lifecycle_state] || it.lifecycle_state;
      const summary = it.summary_zh || it.title || "";
      list.appendChild(el("div", { class: "issue-row",
                                   onclick: () => location.hash = "#/issues/" + it.id },
        el("span", { class: "pill " + it.lifecycle_state }, stateLabel),
        el("div", null,
          el("div", { class: "cust-line" },
            el("span", { class: "cust-chip" }, it.channel_name || it.customer_workspace_id || "?"),
            it.code ? el("span", { class: "ticket-code" }, it.code) : null),
          el("div", { class: "title" }, it.title || "(无标题)"),
          summary ? el("div", { class: "summary" }, summary) : null,
          el("div", { class: "who" }, "我方回复 " + (it.my_msgs || 0) + " 条")),
        el("div", { class: "when" }, fmtAge(it.last_activity_at))));
    }
    slot.appendChild(list);
  }

  // -------------------------------------------------------------------------
  // 下班结算：本人这班经手的问题，逐个标记闭环/非闭环/升级SRE。
  // Period defaults to 今日 (today's shift); the person is resolved from the
  // logged-in Feishu account via /whoami (support is a shared login).
  // -------------------------------------------------------------------------
  let settlePeriod = "today";

  async function openSettlement() {
    const wrap = document.getElementById("settle-wrap");
    if (!wrap) return;
    if (wrap.dataset.open === "1") { wrap.innerHTML = ""; wrap.dataset.open = ""; return; }
    wrap.dataset.open = "1";
    wrap.innerHTML = "";
    wrap.appendChild(el("div", { class: "loading sm" }, "识别身份中…"));
    let who;
    try {
      who = await api("/api/v1/dashboard/shift/whoami");
    } catch (e) {
      wrap.innerHTML = "";
      wrap.appendChild(el("div", { class: "empty sm" }, String(e.message || e)));
      return;
    }
    if (!who.person) {
      wrap.innerHTML = "";
      wrap.appendChild(el("div", { class: "settle-box" },
        el("div", { class: "empty sm" },
          "你（" + (who.name || who.email || "?") +
          "）不在排班名单里，无法结算。请管理员在 roster_identity 配置你的账号。")));
      return;
    }
    await renderSettlement(who.person);
  }

  async function renderSettlement(person) {
    const wrap = document.getElementById("settle-wrap");
    if (!wrap) return;
    wrap.innerHTML = "";
    const box = el("div", { class: "settle-box" });
    wrap.appendChild(box);
    box.appendChild(el("div", { class: "settle-title" },
      "🕔 " + person + " 的下班结算"));
    // period selector for the settlement scope
    const sel = el("div", { class: "chip-row" }, el("span", { class: "chip-label" }, "结算范围"));
    for (const [key, label] of [["today", "今日"], ["yesterday", "昨日"], ["this_week", "本周"]]) {
      sel.appendChild(el("button",
        { class: "chip" + (settlePeriod === key ? " active" : ""),
          onclick: () => { settlePeriod = key; renderSettlement(person); } }, label));
    }
    box.appendChild(sel);
    const body = el("div", { class: "settle-body" }, el("div", { class: "loading sm" }, "加载中…"));
    box.appendChild(body);
    let data;
    try {
      const qs = new URLSearchParams({ person, period: settlePeriod, bucket: "all" });
      data = await api("/api/v1/dashboard/shift-workload/issues?" + qs);
    } catch (e) {
      body.innerHTML = ""; body.appendChild(el("div", { class: "empty sm" }, String(e.message || e)));
      return;
    }
    body.innerHTML = "";
    const items = data.items || [];
    const prog = el("div", { class: "settle-prog", id: "settle-prog" });
    body.appendChild(prog);
    updateSettleProgress(items);
    if (!items.length) {
      body.appendChild(el("div", { class: "empty sm" }, "该时段没有你经手的问题"));
      return;
    }
    const list = el("div", { class: "issue-list settle-list" });
    for (const it of items) list.appendChild(settleRow(it));
    body.appendChild(list);
  }

  function updateSettleProgress(items) {
    const prog = document.getElementById("settle-prog");
    if (!prog) return;
    const total = items.length;
    // Mirrors renderMark: closed (green) / escalated (amber) / judged-open (red)
    // all count as a made decision.
    const done = items.filter(it =>
      it.lifecycle_state === "closed_confirmed" ||
      (it.escalated_ticket_id && String(it.escalated_ticket_id).trim()) ||
      (it.lifecycle_state !== "closed_confirmed" &&
       (it.review_state === "confirmed" || it.internal_confirm))).length;
    prog.textContent = "已处理 " + done + " / " + total;
  }

  // One settlement row: issue summary + current mark + three action buttons.
  function settleRow(it) {
    const row = el("div", { class: "issue-row settle-item", id: "settle-" + it.id });
    const stateLabel = STATE_LABEL[it.lifecycle_state] || it.lifecycle_state;
    const summary = it.summary_zh || it.title || "";
    // current mark badge (闭环 / 已升级+工单号 / 其它状态)
    const mark = el("span", { class: "settle-mark" });
    renderMark(mark, it);
    const acts = el("div", { class: "settle-acts" },
      el("button", { class: "sbtn green", onclick: () => settleAct(it, "close") }, "闭环"),
      el("button", { class: "sbtn red", onclick: () => settleAct(it, "reopen") }, "非闭环"),
      el("button", { class: "sbtn amber", onclick: () => settleAct(it, "escalate") }, "升级SRE"),
      el("button", { class: "sbtn blue", onclick: () => settleAct(it, "internal") }, "内部确认中"));
    row.appendChild(el("div", { class: "settle-main" },
      el("span", { class: "pill " + it.lifecycle_state }, stateLabel),
      el("div", null,
        el("div", { class: "cust-line" },
          el("span", { class: "cust-chip" }, it.channel_name || it.customer_workspace_id || "?"),
          it.code ? el("span", { class: "ticket-code" }, it.code) : null),
        el("div", { class: "title", onclick: () => location.hash = "#/issues/" + it.id },
          it.title || "(无标题)"),
        summary ? el("div", { class: "summary" }, summary) : null,
        mark)));
    row.appendChild(acts);
    return row;
  }

  function renderMark(mark, it) {
    mark.innerHTML = "";
    if (it.lifecycle_state === "closed_confirmed") {
      mark.appendChild(el("span", { class: "mk green" }, "✓ 已确认闭环"));
    }
    // 非闭环 judgment: reopen (and 确认为真问题) set review_state=confirmed on a
    // still-open issue — that's a made decision, show it and count it as
    // processed (previously invisible → the button felt dead).
    if (it.lifecycle_state !== "closed_confirmed" && it.review_state === "confirmed") {
      mark.appendChild(el("span", { class: "mk red" }, "✗ 已标记非闭环 · 跟进中"));
    }
    if (it.lifecycle_state !== "closed_confirmed" && it.internal_confirm) {
      mark.appendChild(el("span", { class: "mk blue" },
        "🔄 内部确认中" +
        (it.internal_confirm.note ? " · " + it.internal_confirm.note : "")));
    }
    if (it.escalated_ticket_id && String(it.escalated_ticket_id).trim()) {
      mark.appendChild(el("span", { class: "mk amber" },
        "⬆ 已升级SRE · " + it.escalated_ticket_id));
    }
  }

  // Apply a settlement action to one issue, then update just that row in place.
  async function settleAct(it, action) {
    let body = { action };
    if (action === "escalate") {
      const t = prompt("升级 SRE — 请输入工单号（如 WO-20260703-0038）：",
        it.escalated_ticket_id || "");
      if (t === null) return;               // cancelled
      if (!t.trim()) { alert("工单号不能为空"); return; }
      body.escalated_ticket_id = t.trim();
    }
    if (action === "internal") {
      const n = prompt("内部确认中 — 备注（和谁确认/确认什么，可留空）：",
        (it.internal_confirm && it.internal_confirm.note) || "");
      if (n === null) return;               // cancelled
      body.note = n.trim() || null;
    }
    const row = document.getElementById("settle-" + it.id);
    if (row) row.classList.add("busy");
    try {
      await api("/api/v1/dashboard/issues/" + it.id + "/review",
        { method: "POST", json: body });
    } catch (e) {
      if (row) row.classList.remove("busy");
      alert("操作失败：" + (e.message || e));
      return;
    }
    // reflect new state locally (avoid a full refetch)
    if (action === "close") { it.lifecycle_state = "closed_confirmed"; setStatus("已标记闭环 · " + (it.code || ""), "ok"); }
    else if (action === "reopen") { it.lifecycle_state = "awaiting_agent"; it.review_state = "confirmed"; setStatus("已标记非闭环 · " + (it.code || ""), "ok"); }
    else if (action === "escalate") { it.escalated_ticket_id = body.escalated_ticket_id; setStatus("已升级 SRE · " + (it.code || ""), "ok"); }
    else if (action === "internal") { it.internal_confirm = { note: body.note }; setStatus("已标记内部确认中 · " + (it.code || ""), "ok"); }
    if (row) {
      row.classList.remove("busy");
      const fresh = settleRow(it);
      row.replaceWith(fresh);
    }
    // refresh the progress counter: a row is "done" if it shows a closed/escalated mark
    const progEl = document.getElementById("settle-prog");
    if (progEl) {
      const rows = document.querySelectorAll(".settle-item");
      const doneRows = Array.from(rows)
        .filter(r => r.querySelector(".mk.green, .mk.amber, .mk.red, .mk.blue")).length;
      progEl.textContent = "已处理 " + doneRows + " / " + rows.length;
    }
  }

  // -------------------------------------------------------------------------
  // 工单报表: issues OPENED in a window, owned by whoever was on duty at
  // creation time (责任人, via shift roster), with first-response / closure
  // stats per person + overall, and the full ticket list for drill-back.
  // -------------------------------------------------------------------------
  const report = {
    period: localStorage.getItem("rp_period") || "this_week",
    start: localStorage.getItem("rp_start") || "",
    end: localStorage.getItem("rp_end") || "",
    person: null,          // client-side filter for the ticket list
  };

  function fmtDur(secs) {
    if (secs == null) return "—";
    if (secs < 60) return Math.round(secs) + " 秒";
    if (secs < 3600) return Math.round(secs / 60) + " 分钟";
    if (secs < 86400) return (secs / 3600).toFixed(1) + " 小时";
    return (secs / 86400).toFixed(1) + " 天";
  }

  function reportQuery() {
    if (report.period === "custom") {
      const p = new URLSearchParams({ period: "custom" });
      if (report.start) p.set("start", report.start);
      if (report.end) p.set("end", report.end + "T23:59:59");
      return "?" + p.toString();
    }
    return "?period=" + report.period;
  }

  async function renderTicketReport() {
    $strip.style.display = "none";
    renderNav("report");
    $back.hidden = true;
    $title.textContent = "工单报表";
    $crumbs.innerHTML = "";
    $crumbs.appendChild(el("a", { onclick: () => location.hash = "#/" }, "全部客户"));
    $crumbs.appendChild(document.createTextNode(" / 工单报表"));
    $view.innerHTML = "";

    const sel = el("div", { class: "chip-row" },
      el("span", { class: "chip-label" }, "时间范围"));
    for (const [key, label] of PERIODS) {
      sel.appendChild(el("button",
        { class: "chip" + (report.period === key ? " active" : ""),
          onclick: () => {
            report.period = key; localStorage.setItem("rp_period", key);
            renderTicketReport();
          } }, label));
    }
    $view.appendChild(sel);
    if (report.period === "custom") {
      const mk = (val, on) => {
        const i = el("input", { type: "date", class: "period-date", value: val || "" });
        i.addEventListener("change", (e) => on(e.target.value));
        return i;
      };
      $view.appendChild(el("div", { class: "chip-row" },
        mk(report.start, (v) => { report.start = v; localStorage.setItem("rp_start", v); }),
        el("span", { class: "period-sep" }, "至"),
        mk(report.end, (v) => { report.end = v; localStorage.setItem("rp_end", v); }),
        el("button", { class: "chip apply", onclick: () => {
          if (!report.start || !report.end) { setStatus("请选择起止日期", "error"); return; }
          renderTicketReport();
        } }, "应用")));
      if (!report.start || !report.end) return;
    }

    const body = el("div", null, el("div", { class: "loading" }, "加载中…"));
    $view.appendChild(body);
    let data;
    try {
      data = await api("/api/v1/dashboard/ticket-report" + reportQuery());
    } catch (e) {
      body.innerHTML = "";
      body.appendChild(el("div", { class: "empty" }, String(e.message || e)));
      return;
    }
    body.innerHTML = "";
    if (data.win_start) {
      body.appendChild(el("div", { class: "shift-since" },
        "统计窗口：" + fmtDate(data.win_start) + " ~ " + fmtDate(data.win_end) +
        "（按工单创建时间统计）"));
    }
    const o = data.overall || {};
    body.appendChild(el("div", { class: "shift-strip report-strip" },
      card("新建工单", o.tickets || 0, ""),
      card("已解决(含疑似)", o.resolved || 0, "green"),
      card("解决率", Math.round((o.resolve_rate || 0) * 100) + "%", "green"),
      card("人工闭环率", Math.round((o.confirm_rate || 0) * 100) + "%", ""),
      card("首响中位", fmtDur(o.first_response_median_secs), "amber"),
      card("闭环时长中位", fmtDur(o.close_median_secs), "")));

    const tbl = el("div", { class: "wl-table" });
    tbl.appendChild(el("div", { class: "wl-row wl-head" },
      el("span", { class: "wl-name" }, "责任人"),
      el("span", { class: "wl-n" }, "工单数"),
      el("span", { class: "wl-n" }, "已解决"),
      el("span", { class: "wl-n" }, "解决率"),
      el("span", { class: "wl-n" }, "人工闭环"),
      el("span", { class: "wl-n" }, "闭环率"),
      el("span", { class: "wl-n" }, "首响中位"),
      el("span", { class: "wl-n" }, "闭环中位")));
    for (const p of (data.people || [])) {
      tbl.appendChild(el("div",
        { class: "wl-row rp-row" + (report.person === p.person ? " active" : ""),
          onclick: () => {
            report.person = report.person === p.person ? null : p.person;
            renderTicketReport();
          } },
        el("span", { class: "wl-name" }, p.person),
        el("span", { class: "wl-n strong" }, String(p.tickets)),
        el("span", { class: "wl-n green" }, String(p.resolved)),
        el("span", { class: "wl-n" }, Math.round((p.resolve_rate || 0) * 100) + "%"),
        el("span", { class: "wl-n" }, String(p.confirmed)),
        el("span", { class: "wl-n" }, Math.round((p.confirm_rate || 0) * 100) + "%"),
        el("span", { class: "wl-n amber" }, fmtDur(p.first_response_median_secs)),
        el("span", { class: "wl-n" }, fmtDur(p.close_median_secs))));
    }
    body.appendChild(tbl);
    body.appendChild(el("div", { class: "wl-note" },
      "责任人 = 工单创建时刻的值班同事（support 为共号，按排班表归属）；已解决 = 人工闭环 + AI判定疑似闭环；"
      + "人工闭环 = 点过「确认闭环」；首响 = 创建到我方首条回复；闭环时长 = 创建到闭环判定；时长为中位数。"
      + "点击某行只看该同事的工单，再点取消。"));

    const shown = (data.items || []).filter(
      (it) => !report.person || (it.owner || "未排班") === report.person);
    body.appendChild(el("div", { class: "list-subhead" },
      (report.person ? report.person + " 的" : "") + "工单明细 (" + shown.length + ")"));
    if (!shown.length) {
      body.appendChild(el("div", { class: "empty" }, "该范围内无工单"));
      return;
    }
    const list = el("div", { class: "issue-list" });
    for (const it of shown) list.appendChild(issueRow(it, { showCustomer: true, showOwner: true }));
    body.appendChild(list);
  }

  // -------------------------------------------------------------------------
  // Metric drill-down: the issue list behind one hero-strip card. Window
  // metrics follow the overview period selection; awaiting_us is live.
  // -------------------------------------------------------------------------
  const METRIC_LABEL = {
    new_issues: "新增问题", active_issues: "活跃问题",
    new_closed: "新闭环", awaiting_us: "待我方回复",
  };

  async function renderMetricIssues(key) {
    const label = METRIC_LABEL[key];
    if (!label) { location.hash = "#/"; return; }
    $strip.style.display = "none";
    renderNav("overview");
    $back.hidden = false;
    $back.onclick = () => goBack("#/");
    const px = key === "awaiting_us" ? "实时 · " : periodPrefix() + " · ";
    $title.textContent = px + label;
    $crumbs.innerHTML = "";
    $crumbs.appendChild(el("a", { onclick: () => location.hash = "#/" }, "全部客户"));
    $crumbs.appendChild(document.createTextNode(" / " + px + label));
    $view.innerHTML = "";
    $view.appendChild(el("div", { class: "loading" }, "加载中…"));

    const qs = new URLSearchParams(summaryQuery().slice(1));
    qs.set("metric", key);
    let data;
    try {
      data = await api("/api/v1/dashboard/metric-issues?" + qs);
    } catch (e) {
      $view.innerHTML = "";
      $view.appendChild(el("div", { class: "empty" }, String(e.message || e)));
      return;
    }
    const items = data.items || [];
    $view.innerHTML = "";
    const wrap = el("div", { class: "detail" });
    wrap.appendChild(el("div", { class: "list-subhead" },
      "共 " + items.length + " 条" +
      (key === "awaiting_us"
        ? "（实时口径，与总览卡片一致）"
        : "（" + periodPrefix() + "口径，与总览卡片一致）") +
      (items.length >= 300 ? "，仅显示前 300 条" : "")));
    if (!items.length) {
      wrap.appendChild(el("div", { class: "empty" }, "该时段没有对应的问题。"));
      $view.appendChild(wrap);
      return;
    }
    const list = el("div", { class: "issue-list" });
    for (const it of items) list.appendChild(issueRow(it, { showCustomer: true }));
    wrap.appendChild(list);
    $view.appendChild(wrap);
  }

  // -------------------------------------------------------------------------
  // 超7天待审批: the >N-day unanswered backlog (past ③a's realtime-alert cap).
  // A reviewer 审批关闭 inline, or opens the detail to follow up / reopen.
  // -------------------------------------------------------------------------
  async function renderStalePending() {
    $strip.style.display = "none";
    renderNav("stale");
    $back.hidden = true;
    $crumbs.innerHTML = "";
    $title.textContent = "超7天待审批";
    $view.innerHTML = "";
    $view.appendChild(el("div", { class: "loading" }, "加载中…"));
    let data;
    try {
      data = await api("/api/v1/dashboard/stale-pending");
    } catch (e) {
      $view.innerHTML = "";
      $view.appendChild(el("div", { class: "empty" }, String(e.message || e)));
      return;
    }
    const items = data.items || [];
    const cutoff = data.cutoff_days || 7;
    $view.innerHTML = "";
    const wrap = el("div", { class: "detail" });
    wrap.appendChild(el("h2", null, "超7天待审批"));
    wrap.appendChild(el("div", { class: "summary-block" },
      "客户已等待超过 " + cutoff + " 天、球在我方且未闭环的问题——已从实时告警移出。"
      + "请人工复核后「审批关闭」，或点进详情跟进/重开。共 ",
      el("span", { id: "stale-count" }, String(items.length)),
      " 条。"));
    if (!items.length) {
      wrap.appendChild(el("div", { class: "empty" }, "✅ 没有超期待审批的问题。"));
      $view.appendChild(wrap);
      return;
    }
    const list = el("div", { class: "issue-list" });
    for (const it of items) list.appendChild(staleRow(it));
    wrap.appendChild(list);
    $view.appendChild(wrap);
  }

  function staleRow(it) {
    const summary = it.summary_zh || it.summary || "";
    const waitDays = Math.floor(it.wait_days || 0);
    const custChip = el("span", { class: "cust-chip",
      onclick: (e) => { e.stopPropagation();
        location.hash = "#/customers/" + customerKey(it); } },
      customerLabel(it));
    const row = el("div", { class: "issue-row stale-item", id: "stale-" + it.id,
      onclick: () => location.hash = "#/issues/" + it.id },
      el("span", { class: "pill " + it.lifecycle_state },
        STATE_LABEL[it.lifecycle_state] || it.lifecycle_state),
      el("div", null,
        el("div", { class: "cust-line" }, custChip,
          it.code ? el("span", { class: "ticket-code" }, it.code) : null),
        el("div", { class: "title" }, it.title || "(无标题)"),
        summary ? el("div", { class: "summary" }, summary) : null,
        el("div", { class: "who" },
          (it.message_count || 0) + " 条消息"
          + (it.external_party_name ? " · " + it.external_party_name : ""))),
      el("div", { class: "when danger" }, "等待 " + waitDays + " 天"));
    if (canWrite()) {
      row.appendChild(el("div", { class: "settle-acts" },
        el("button", { class: "sbtn green",
          onclick: (e) => { e.stopPropagation(); staleClose(it); } }, "✓ 审批关闭")));
    }
    return row;
  }

  async function staleClose(it) {
    if (!confirm("确认「审批关闭」" + (it.code || "") + "「" + (it.title || "") + "」？")) return;
    const row = document.getElementById("stale-" + it.id);
    if (row) row.classList.add("busy");
    try {
      await api("/api/v1/dashboard/issues/" + it.id + "/review",
        { method: "POST", json: { action: "close", note: "超7天人工审批关闭" } });
    } catch (e) {
      if (row) row.classList.remove("busy");
      alert("操作失败：" + (e.message || e));
      return;
    }
    if (row) row.remove();   // closed → drops out of the >7d pending list
    const cnt = document.getElementById("stale-count");
    if (cnt) cnt.textContent = String(Math.max(0, (+cnt.textContent || 1) - 1));
    setStatus("已审批关闭 · " + (it.code || it.id), "ok");
  }

  async function renderShift() {
    $strip.style.display = "none";
    renderNav("shift");
    $view.innerHTML = "";
    // Top-level tab like 超7天/Ticket记录 — the nav is the way around, no ←.
    $back.hidden = true;
    $title.textContent = "班次复盘";
    $crumbs.innerHTML = "";
    $crumbs.appendChild(el("a", { onclick: () => location.hash = "#/" }, "全部客户"));
    $crumbs.appendChild(document.createTextNode(" / 班次复盘"));
    $view.appendChild(el("div", { class: "loading" }, "加载中…"));

    // Per-colleague workload panel (attributed via the duty roster), with its own
    // period selector — this is the "谁在某时间段做了多少" view.
    const wlWrap = el("div", { class: "wl-wrap", id: "wl-wrap" });

    const hours = shiftHours;
    const data = await api("/api/v1/dashboard/shift?hours=" + hours);
    $view.innerHTML = "";
    // 下班结算入口：逐个标记本人这班经手的问题（闭环/非闭环/升级SRE）。
    $view.appendChild(el("div", { class: "settle-entry" },
      el("button", { class: "settle-btn", onclick: () => openSettlement() },
        "🕔 下班结算"),
      el("span", { class: "settle-hint" },
        "逐个标记你本班经手的问题：闭环 / 非闭环 / 升级SRE")));
    const settleWrap = el("div", { class: "settle-wrap", id: "settle-wrap" });
    $view.appendChild(settleWrap);
    $view.appendChild(wlWrap);
    renderWorkload();

    $view.appendChild(el("div", { class: "list-subhead" }, "—— 滚动窗口明细 ——"));

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
      } else if (hash.startsWith("#/metric/")) {
        await renderMetricIssues(hash.slice("#/metric/".length));
      } else if (hash === "#/report") {
        await renderTicketReport();
      } else if (hash === "#/stale") {
        await renderStalePending();
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

  // In-app navigation stack so ← returns to where you actually came from (the
  // stale queue, shift page, a metric list…), not a hardcoded parent. Detects
  // "back" (browser button or ours) as a transition to the previous stack entry
  // and pops; anything else pushes. goBack() uses real history.back() when we
  // have somewhere to go, so browser-back and the ← button stay consistent;
  // direct loads (empty stack) fall back to the view's hierarchical parent.
  const navStack = [location.hash || "#/"];
  function goBack(fallback) {
    if (navStack.length >= 2) history.back();
    else location.hash = fallback || "#/";
  }
  window.addEventListener("hashchange", () => {
    const h = location.hash || "#/";
    if (navStack.length >= 2 && navStack[navStack.length - 2] === h) {
      navStack.pop();
    } else if (navStack[navStack.length - 1] !== h) {
      navStack.push(h);
    }
    route();
  });

  // -------------------------------------------------------------------------
  // Feishu login / approval gate — runs before the dashboard renders.
  // -------------------------------------------------------------------------

  let _me = null;          // whoami result
  function isAdmin() { return _me && _me.role === "admin" && _me.status === "approved"; }
  // Only roster members (+ admins) may write issue state; backend enforces the
  // same via require_roster_member. Non-roster viewers see no action buttons.
  function canWrite() { return _me && _me.can_write === true; }

  function gateScreen(title, desc, btn) {
    $strip.style.display = "none";
    $sources.hidden = true;
    $periodBar.hidden = true;
    $nav.hidden = true;
    $nav.innerHTML = "";
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
      bar.appendChild(el("a", { class: "link", onclick: () => location.hash = "#/admin" }, "成员管理"));
    }
    bar.appendChild(el("a", { class: "link", onclick: async () => {
      await api("/api/dashboard/logout", { method: "POST", json: {} }); boot();
    } }, "退出"));
    document.querySelector(".dash-header").appendChild(bar);
  }

  boot();
})();

