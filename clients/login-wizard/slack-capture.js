"use strict";

const { BrowserWindow, session } = require("electron");

const PARTITION = "persist:slack-login";
// Match the URL Slack lands on once the user is fully signed in. We accept any
// path under app.slack.com (with optional team id) — Slack has shipped multiple
// post-signin landing URLs over the years (/client/T.../C..., /client/T...,
// /T.../C...). Keep this loose; capture() itself will reject if the actual
// xoxc token isn't in localStorage yet, in which case we just wait.
const APP_HOST_RE = /^https:\/\/app\.slack\.com\/(?:client\/)?([A-Z0-9]+)?/;
// Pretend to be a normal Chrome — Electron's default UA leaks "Electron/" which
// some IdP login flows (Okta in particular) treat as an embedded webview.
const CHROME_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36";

/**
 * Open a Slack signin window, wait for the user to land on app.slack.com/client,
 * then read xoxc from localStorage and xoxd from the session's cookie store.
 *
 * Resolves with { authToken, cookieToken, workspace } on success.
 * Rejects on user-close / timeout / parse failure.
 */
async function runSlackCapture({ timeoutMs = 5 * 60 * 1000 } = {}) {
  const slackSession = session.fromPartition(PARTITION);
  // Spoof Chrome at the session level BEFORE any navigation — Slack's signin
  // page reads navigator.userAgent + the request UA header and rejects
  // anything containing "Electron/" as an embedded browser.
  slackSession.setUserAgent(CHROME_UA);
  // Always start from a clean slate so previous logins don't auto-fill the
  // wrong workspace and so we never leak credentials across runs.
  await slackSession.clearStorageData();

  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    title: "Sign in to Slack",
    webPreferences: {
      partition: PARTITION,
      contextIsolation: true,
      sandbox: true,
    },
  });
  win.webContents.setUserAgent(CHROME_UA);
  // Slack's "Launch Slack" / open-workspace button can open in a new window
  // (window.open). Force any popup to navigate the existing window instead so
  // our did-navigate listener catches the post-signin URL.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url && url.startsWith("https://")) {
      win.loadURL(url).catch(() => { /* swallow */ });
    }
    return { action: "deny" };
  });

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn, val) => {
      if (settled) return;
      settled = true;
      try { win.destroy(); } catch (_) { /* already gone */ }
      // Best-effort cleanup; do not block resolution on it.
      slackSession.clearStorageData().catch(() => {});
      fn(val);
    };

    const timer = setTimeout(
      () => finish(reject, new Error("Slack login timed out (5 min)")),
      timeoutMs,
    );

    win.on("closed", () => {
      clearTimeout(timer);
      if (!settled) finish(reject, new Error("Slack login window was closed"));
    });

    let capturing = false;
    const onNav = async (_evt, url) => {
      console.log("[slack-capture] nav:", url);
      if (settled || capturing) return;
      const m = APP_HOST_RE.exec(url);
      if (!m) return;
      capturing = true;
      const teamIdFromUrl = m[1] || null;
      try {
        // Give the page a moment to populate localStorage before we read it.
        await new Promise((r) => setTimeout(r, 1500));
        const captured = await capture(win.webContents, slackSession, teamIdFromUrl);
        clearTimeout(timer);
        finish(resolve, captured);
      } catch (err) {
        // Token not in storage yet — keep waiting for a later navigation.
        console.log("[slack-capture] capture not ready:", err.message);
        capturing = false;
      }
    };
    // did-navigate covers full page loads; did-navigate-in-page covers Slack's
    // post-signin SPA route push (history.pushState).
    win.webContents.on("did-navigate", onNav);
    win.webContents.on("did-navigate-in-page", onNav);

    win.loadURL("https://slack.com/signin").catch((err) => {
      clearTimeout(timer);
      finish(reject, err);
    });
  });
}

async function capture(webContents, slackSession, teamIdFromUrl) {
  const cookies = await slackSession.cookies.get({ url: "https://slack.com/" });
  const dCookie = cookies.find((c) => c.name === "d");
  if (!dCookie || !dCookie.value.startsWith("xoxd-")) {
    throw new Error("Could not find Slack `d` cookie (xoxd-*) after login");
  }

  const raw = await webContents.executeJavaScript(
    'localStorage.getItem("localConfig_v2")',
  );
  if (!raw) throw new Error("Slack localStorage missing localConfig_v2");
  const cfg = JSON.parse(raw);
  const teams = cfg.teams || {};
  const teamIds = Object.keys(teams);
  if (teamIds.length === 0) {
    throw new Error("No teams found in Slack localConfig_v2");
  }

  // Prefer the team whose id appears in the URL; fall back to the first.
  const chosenId = teams[teamIdFromUrl] ? teamIdFromUrl : teamIds[0];
  const team = teams[chosenId];
  if (!team || typeof team.token !== "string" || !team.token.startsWith("xoxc-")) {
    throw new Error(`Slack team ${chosenId} has no xoxc token`);
  }

  return {
    authToken: team.token,
    cookieToken: dCookie.value,
    workspace: team.name || team.domain || chosenId,
    workspaceId: chosenId,
    workspaceDomain: team.domain || null,
    workspaceIcon: pickIcon(team.icon),
    userId: team.user_id || null,
    ...(await fetchSlackProfile(webContents, team.token, team.user_id)),
  };
}

function pickIcon(icon) {
  if (!icon || typeof icon !== "object") return null;
  return icon.image_88 || icon.image_132 || icon.image_44 || icon.image_default || null;
}

async function fetchSlackProfile(webContents, token, userId) {
  if (!token || !userId) return {};
  try {
    const resp = await webContents.executeJavaScript(`
      (async () => {
        try {
          const fd = new FormData();
          fd.append("token", ${JSON.stringify(token)});
          fd.append("user", ${JSON.stringify(userId)});
          const r = await fetch("https://slack.com/api/users.profile.get", { method: "POST", body: fd });
          return r.ok ? await r.json() : null;
        } catch (_) { return null; }
      })()
    `);
    if (!resp || !resp.ok || !resp.profile) return {};
    const p = resp.profile;
    return {
      displayName: p.real_name || p.display_name || p.real_name_normalized || null,
      avatarUrl: p.image_192 || p.image_72 || p.image_48 || p.image_original || null,
    };
  } catch (_) {
    return {};
  }
}

module.exports = { runSlackCapture };
