"use strict";

const { app, BrowserWindow, ipcMain, Menu, session, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
const { loadConfig, saveConfig, openSettingsDialog } = require("./config");
const { runSlackCapture } = require("./slack-capture");
const { runDiscordCapture } = require("./discord-capture");

const DEFAULT_CHAT_URL = "http://192.168.72.185:8080";
const CHROME_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36";

let mainWindow = null;

function createMainWindow() {
  // Element checks navigator.userAgent AND server-side User-Agent header to
  // refuse "embedded" browsers. Override on the partition session BEFORE the
  // webview attaches so both checks see Chrome.
  session.fromPartition("persist:matrix-chat").setUserAgent(CHROME_UA);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "PixDesk Login Wizard",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true,
    },
  });

  // Belt-and-suspenders: also force the param at attach time so the
  // BrowserWindow-level UA can't leak in.
  mainWindow.webContents.on("will-attach-webview", (_evt, _prefs, params) => {
    if (params.partition === "persist:matrix-chat") {
      params.useragent = CHROME_UA;
    }
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
}

function buildMenu() {
  const template = [
    {
      label: app.name,
      submenu: [
        { label: "Settings…", click: () => openSettingsDialog(mainWindow) },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function callRelay(pathSuffix, body) {
  const cfg = await loadConfig();
  if (!cfg.relayUrl || !cfg.sharedSecret) {
    throw new Error("Relay URL / shared secret not configured. Open Settings.");
  }
  const url = cfg.relayUrl.replace(/\/$/, "") + pathSuffix;
  const init = {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Authorization": `Bearer ${cfg.sharedSecret}`,
    },
  };
  if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  const resp = await fetch(url, init);
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!resp.ok) {
    throw new Error(`relay ${resp.status}: ${(json && json.detail) || text.slice(0, 200)}`);
  }
  return json;
}

async function saveCapturedToken(bridge, payload) {
  const dir = path.join(app.getPath("home"), ".config", "pixdesk", "captured");
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(dir, `${bridge}-${ts}.json`);
  await fs.writeFile(
    file,
    JSON.stringify({ bridge, capturedAt: ts, ...payload }, null, 2),
    { mode: 0o600 },
  );
  return file;
}

async function listAccounts() {
  const dir = path.join(app.getPath("home"), ".config", "pixdesk", "captured");
  let entries;
  try {
    entries = await fs.readdir(dir);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
  // Group by bridge prefix and keep the most recent file per bridge.
  const latestByBridge = new Map();
  for (const name of entries) {
    if (!name.endsWith(".json")) continue;
    const dash = name.indexOf("-");
    if (dash <= 0) continue;
    const bridge = name.slice(0, dash);
    const prev = latestByBridge.get(bridge);
    if (!prev || name > prev) latestByBridge.set(bridge, name);
  }
  const out = [];
  for (const [bridge, name] of latestByBridge) {
    const fp = path.join(dir, name);
    try {
      const raw = await fs.readFile(fp, "utf8");
      const data = JSON.parse(raw);
      out.push({
        bridge,
        captured_path: fp,
        captured_at: data.capturedAt || null,
        display_name: data.display_name || null,
        username: data.username || null,
        workspace: data.workspace || null,
        avatar_url: data.avatar_url || null,
        workspace_icon: data.workspace_icon || null,
      });
    } catch (_) { /* skip malformed */ }
  }
  out.sort((a, b) => a.bridge.localeCompare(b.bridge));
  return out;
}

ipcMain.handle("relay:health", async () => {
  return callRelay("/healthz", undefined);
});

ipcMain.handle("login:discord", async () => {
  const captured = await runDiscordCapture();
  const capturedPath = await saveCapturedToken("discord", {
    token: captured.token,
    user_id: captured.user_id || null,
    username: captured.username || null,
    display_name: captured.display_name || null,
    avatar_url: captured.avatar_url || null,
  });
  const reply = await callRelay("/login/discord", { token: captured.token });
  return {
    ...reply,
    captured_path: capturedPath,
    display_name: captured.display_name || null,
    avatar_url: captured.avatar_url || null,
  };
});

ipcMain.handle("login:slack", async () => {
  const captured = await runSlackCapture();
  const capturedPath = await saveCapturedToken("slack", {
    auth_token: captured.authToken,
    cookie_token: captured.cookieToken,
    workspace: captured.workspace,
    workspace_id: captured.workspaceId || null,
    workspace_domain: captured.workspaceDomain || null,
    workspace_icon: captured.workspaceIcon || null,
    user_id: captured.userId || null,
    display_name: captured.displayName || null,
    avatar_url: captured.avatarUrl || null,
  });
  const reply = await callRelay("/login/slack", {
    auth_token: captured.authToken,
    cookie_token: captured.cookieToken,
  });
  return {
    ...reply,
    workspace: captured.workspace,
    captured_path: capturedPath,
    display_name: captured.displayName || null,
    avatar_url: captured.avatarUrl || null,
    workspace_icon: captured.workspaceIcon || null,
  };
});

ipcMain.handle("login:telegram:qr", async () => {
  return callRelay("/login/telegram/qr", {});
});

ipcMain.handle("login:telegram:status", async (_evt, args) => {
  return callRelay("/login/telegram/status", args);
});

ipcMain.handle("config:get", async () => {
  const cfg = await loadConfig();
  return { relayUrl: cfg.relayUrl || "", hasSecret: Boolean(cfg.sharedSecret) };
});

ipcMain.handle("config:set", async (_evt, partial) => {
  await saveConfig(partial);
  return { ok: true };
});

ipcMain.handle("chat:url", async () => {
  const cfg = await loadConfig();
  return cfg.chatUrl || DEFAULT_CHAT_URL;
});

ipcMain.handle("captured:reveal", async (_evt, filePath) => {
  if (typeof filePath !== "string") return { ok: false };
  shell.showItemInFolder(filePath);
  return { ok: true };
});

ipcMain.handle("accounts:list", async () => {
  return listAccounts();
});

ipcMain.handle("bridge:status", async (_evt, bridge) => {
  if (typeof bridge !== "string") throw new Error("bridge required");
  return callRelay(`/status/${encodeURIComponent(bridge)}`, {});
});

ipcMain.handle("bridge:logout", async (_evt, bridge) => {
  if (typeof bridge !== "string") throw new Error("bridge required");
  const reply = await callRelay(`/logout/${encodeURIComponent(bridge)}`, {});
  // Also clear the local captured-token file for this bridge so the
  // accounts list reflects the new state immediately.
  try {
    const dir = path.join(app.getPath("home"), ".config", "pixdesk", "captured");
    const entries = await fs.readdir(dir);
    await Promise.all(entries
      .filter((n) => n.startsWith(`${bridge}-`) && n.endsWith(".json"))
      .map((n) => fs.unlink(path.join(dir, n)).catch(() => {})));
  } catch (_) { /* ignore */ }
  return reply;
});

app.whenReady().then(() => {
  app.userAgentFallback = CHROME_UA;
  buildMenu();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
