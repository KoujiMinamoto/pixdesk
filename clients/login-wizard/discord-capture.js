"use strict";

const { BrowserWindow, session } = require("electron");

const PARTITION = "persist:discord-login";
const CHROME_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36";

/**
 * Open a Discord signin window, wait for the user to sign in, then sniff the
 * first Authorization header on a /api/* request — that header IS the user
 * token (unprefixed; "Bot " is for bots, "Bearer " is for OAuth).
 *
 * Resolves with { token } on success.
 */
async function runDiscordCapture({ timeoutMs = 5 * 60 * 1000 } = {}) {
  const discordSession = session.fromPartition(PARTITION);
  // Spoof Chrome at the session level BEFORE any navigation so the first
  // request already looks like Chrome (avoids "Electron/" leaking into the
  // initial UA header on signin pages with strict browser checks).
  discordSession.setUserAgent(CHROME_UA);
  await discordSession.clearStorageData();

  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    title: "Sign in to Discord",
    webPreferences: {
      partition: PARTITION,
      contextIsolation: true,
      sandbox: true,
    },
  });
  win.webContents.setUserAgent(CHROME_UA);

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn, val) => {
      if (settled) return;
      settled = true;
      try { discordSession.webRequest.onBeforeSendHeaders(null); } catch (_) {}
      try { win.destroy(); } catch (_) {}
      discordSession.clearStorageData().catch(() => {});
      fn(val);
    };

    const timer = setTimeout(
      () => finish(reject, new Error("Discord login timed out (5 min)")),
      timeoutMs,
    );

    win.on("closed", () => {
      clearTimeout(timer);
      if (!settled) finish(reject, new Error("Discord login window was closed"));
    });

    let capturing = false;
    discordSession.webRequest.onBeforeSendHeaders(
      { urls: ["https://discord.com/api/*", "https://*.discord.com/api/*"] },
      async (details, callback) => {
        const headers = details.requestHeaders || {};
        const auth = headers["Authorization"] || headers["authorization"];
        callback({ requestHeaders: headers });
        if (
          settled || capturing ||
          typeof auth !== "string" ||
          /^(Bot |Bearer )/i.test(auth) ||
          auth.length < 50
        ) return;
        capturing = true;
        clearTimeout(timer);
        const result = { token: auth };
        try {
          const profile = await win.webContents.executeJavaScript(
            `fetch("/api/v9/users/@me", { headers: { authorization: ${JSON.stringify(auth)} } })
               .then(r => r.ok ? r.json() : null).catch(() => null)`,
          );
          if (profile && profile.id) {
            result.user_id = profile.id;
            result.username = profile.username;
            result.display_name = profile.global_name || profile.username;
            if (profile.avatar) {
              const ext = profile.avatar.startsWith("a_") ? "gif" : "png";
              result.avatar_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${ext}?size=128`;
            }
          }
        } catch (_) { /* metadata is best-effort */ }
        finish(resolve, result);
      },
    );

    win.loadURL("https://discord.com/login").catch((err) => {
      clearTimeout(timer);
      finish(reject, err);
    });
  });
}

module.exports = { runDiscordCapture };
