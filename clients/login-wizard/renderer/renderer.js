"use strict";

const $ = (id) => document.getElementById(id);
const ALREADY_RE = /already logged in/i;

function classifyReply(reply) {
  if (reply && reply.ok) return { kind: "ok", label: "Connected" };
  const text = ((reply && reply.messages) || []).join("\n");
  if (ALREADY_RE.test(text)) {
    return { kind: "warn", label: "Already connected — logout first to switch" };
  }
  return { kind: "err", label: "Failed" };
}

function showLoginMessages(lines, kind) {
  const el = $("login-messages");
  if (!lines || (Array.isArray(lines) && lines.length === 0)) {
    el.classList.remove("visible", "ok", "err", "warn");
    el.textContent = "";
    return;
  }
  el.textContent = Array.isArray(lines) ? lines.join("\n\n") : String(lines);
  el.className = `messages visible ${kind || ""}`.trim();
}

async function refreshHealth() {
  const dot = $("health-dot");
  const text = $("health-text");
  dot.className = "dot dot-unknown";
  text.textContent = "Checking relay…";
  try {
    const h = await window.pixdesk.health();
    dot.className = "dot dot-ok";
    text.textContent = `Relay OK · admin ${h.admin}`;
  } catch (err) {
    dot.className = "dot dot-err";
    text.textContent = `Relay error: ${err.message}`;
  }
}

function reloadChat() {
  const wv = $("chat-webview");
  if (wv && typeof wv.reload === "function") {
    try { wv.reload(); } catch (_) { /* ignore */ }
  }
}

async function loadChat() {
  const wv = $("chat-webview");
  const empty = $("chat-empty");
  const reveal = () => {
    wv.hidden = false;
    empty.classList.add("hidden");
  };
  try {
    const url = await window.pixdesk.getChatUrl();
    wv.src = url;
    wv.addEventListener("dom-ready", reveal, { once: true });
    wv.addEventListener("did-stop-loading", reveal, { once: true });
    wv.addEventListener("did-fail-load", (e) => {
      empty.textContent = `Failed to load chat: ${e.errorDescription || e.errorCode}`;
    });
  } catch (err) {
    empty.textContent = `Failed to load chat: ${err.message}`;
  }
}

function bridgeLabel(bridge) {
  return bridge.charAt(0).toUpperCase() + bridge.slice(1);
}

function initials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).map((s) => s[0] || "").join("").slice(0, 2).toUpperCase();
}

function accountSubtitle(acct) {
  if (acct.bridge === "slack" && acct.workspace) {
    return acct.display_name ? `${acct.display_name} · ${acct.workspace}` : acct.workspace;
  }
  return acct.display_name || acct.username || "(no profile)";
}

const ALL_BRIDGES = ["discord", "slack", "telegram"];

async function renderAccounts() {
  const list = $("accounts-list");
  list.innerHTML = '<li class="accounts-empty">Loading accounts…</li>';

  // Local captured metadata + live bridge status, in parallel.
  const [localAccounts, ...statuses] = await Promise.all([
    window.pixdesk.listAccounts().catch(() => []),
    ...ALL_BRIDGES.map((b) =>
      window.pixdesk.bridgeStatus(b).catch((err) => ({
        bridge: b, connected: false, identity: null, _error: err.message,
      })),
    ),
  ]);
  const localByBridge = new Map(localAccounts.map((a) => [a.bridge, a]));

  list.innerHTML = "";
  for (let i = 0; i < ALL_BRIDGES.length; i++) {
    const bridge = ALL_BRIDGES[i];
    const status = statuses[i];
    const local = localByBridge.get(bridge) || {};
    const connected = Boolean(status && status.connected);

    // Prefer the live identity over local cache; fall back to local.
    const identity = (status && status.identity)
      || accountSubtitle({ ...local, bridge });

    const li = document.createElement("li");
    li.className = "account-row";

    const avatar = document.createElement("div");
    avatar.className = "account-avatar";
    const avatarSrc = local.avatar_url || local.workspace_icon;
    if (avatarSrc) {
      const img = document.createElement("img");
      img.src = avatarSrc;
      img.alt = "";
      img.referrerPolicy = "no-referrer";
      img.onerror = () => { avatar.textContent = initials(identity); };
      avatar.appendChild(img);
    } else {
      avatar.textContent = initials(connected ? identity : bridgeLabel(bridge));
    }

    const info = document.createElement("div");
    info.className = "account-info";
    const bridgeEl = document.createElement("span");
    bridgeEl.className = "account-bridge";
    bridgeEl.textContent = bridgeLabel(bridge);
    const name = document.createElement("span");
    name.className = "account-name";
    name.textContent = connected ? identity : "Not connected";
    if (!connected) name.style.color = "var(--muted)";
    info.append(bridgeEl, name);

    const actions = document.createElement("div");
    actions.className = "account-actions";
    if (connected) {
      const logoutBtn = document.createElement("button");
      logoutBtn.textContent = "Logout";
      logoutBtn.className = "danger";
      logoutBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        logoutBtn.disabled = true;
        showLoginMessages([`Logging out of ${bridgeLabel(bridge)}…`], "");
        try {
          const reply = await window.pixdesk.bridgeLogout(bridge);
          const lines = (reply.messages && reply.messages.length) ? [...reply.messages] : ["Logged out"];
          if (reply.rooms_left) lines.push(`(cleared ${reply.rooms_left} portal room${reply.rooms_left === 1 ? "" : "s"})`);
          showLoginMessages(lines, reply.ok ? "ok" : "err");
        } catch (err) {
          showLoginMessages(err.message, "err");
        }
        await renderAccounts();
        reloadChat();
      });
      const switchBtn = document.createElement("button");
      switchBtn.textContent = "Switch";
      switchBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          await window.pixdesk.bridgeLogout(bridge);
        } catch (_) { /* keep going */ }
        reloadChat();
        startBridgeLogin(bridge);
      });
      actions.append(switchBtn, logoutBtn);
    } else {
      const loginBtn = document.createElement("button");
      loginBtn.textContent = "Login";
      loginBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        startBridgeLogin(bridge);
      });
      actions.appendChild(loginBtn);
    }

    li.append(avatar, info, actions);
    list.appendChild(li);
  }
}

async function startBridgeLogin(bridge) {
  showLoginMessages([`Starting ${bridgeLabel(bridge)} login…`], "");
  try {
    let reply;
    if (bridge === "discord") reply = await window.pixdesk.loginDiscord();
    else if (bridge === "slack") reply = await window.pixdesk.loginSlack();
    else if (bridge === "telegram") {
      await runTelegramLogin();
      await renderAccounts();
      return;
    } else {
      throw new Error(`Unknown bridge: ${bridge}`);
    }
    const cls = classifyReply(reply);
    const lines = (reply.messages && reply.messages.length)
      ? [...reply.messages]
      : ["No response from bridge bot"];
    if (reply.captured_path) lines.push(`(token saved to ${reply.captured_path})`);
    if (reply.rooms_joined) lines.push(`(auto-joined ${reply.rooms_joined} portal room${reply.rooms_joined === 1 ? "" : "s"})`);
    showLoginMessages(lines, cls.kind);
    await renderAccounts();
    if (cls.kind === "ok") reloadChat();
  } catch (err) {
    showLoginMessages(err.message, "err");
  }
}

async function runTelegramLogin() {
  showLoginMessages(["Requesting Telegram QR…"], "");
  const reply = await window.pixdesk.loginTelegramQR();
  if (!reply.ok || !reply.qr_data_url) {
    showLoginMessages(reply.messages.length ? reply.messages : ["No QR returned"], "err");
    return;
  }
  // Inline-render the QR inside the messages area.
  const el = $("login-messages");
  el.classList.add("visible");
  el.textContent = "Scan QR in Telegram app (Settings → Devices → Link Desktop Device).";
  const img = document.createElement("img");
  img.id = "telegram-qr-img";
  img.src = reply.qr_data_url;
  img.alt = "Telegram QR";
  el.appendChild(document.createElement("br"));
  el.appendChild(img);

  const sinceTs = Date.now();
  const deadline = sinceTs + 3 * 60 * 1000;
  let lastMessages = reply.messages;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000));
    const status = await window.pixdesk.loginTelegramStatus({
      room_id: reply.room_id,
      since_ts_ms: sinceTs,
    });
    if (status.messages && status.messages.length) lastMessages = status.messages;
    if (status.ok) {
      showLoginMessages(status.messages, "ok");
      return;
    }
    if (status.needs_password) {
      showLoginMessages(status.messages, "err");
      return;
    }
  }
  showLoginMessages(lastMessages, "err");
}

function openSettings() {
  $("settings-overlay").hidden = false;
  renderAccounts();
}
function closeSettings() {
  $("settings-overlay").hidden = true;
}

function wire() {
  $("settings-open").addEventListener("click", openSettings);
  $("settings-close").addEventListener("click", closeSettings);
  $("settings-overlay").addEventListener("click", (e) => {
    if (e.target.id === "settings-overlay") closeSettings();
  });

  $("health-dot").addEventListener("click", refreshHealth);
}

window.addEventListener("DOMContentLoaded", () => {
  wire();
  refreshHealth();
  loadChat();
});
