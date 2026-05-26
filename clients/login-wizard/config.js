"use strict";

const { app, BrowserWindow, dialog } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");

const CONFIG_DIR = path.join(app?.getPath ? app.getPath("home") : process.env.HOME, ".config", "pixdesk");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

const DEFAULTS = {
  relayUrl: "http://127.0.0.1:8765",
  sharedSecret: "",
};

let _cache = null;

async function loadConfig() {
  if (_cache) return _cache;
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    _cache = { ...DEFAULTS, ...JSON.parse(raw) };
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    _cache = { ...DEFAULTS };
  }
  return _cache;
}

async function saveConfig(partial) {
  const current = await loadConfig();
  const next = { ...current, ...partial };
  await fs.mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(next, null, 2), { mode: 0o600 });
  _cache = next;
  return next;
}

async function openSettingsDialog(parent) {
  const cfg = await loadConfig();
  const { response, checkboxChecked } = await dialog.showMessageBox(parent, {
    type: "info",
    title: "PixDesk Settings",
    message: "Edit ~/.config/pixdesk/config.json directly.",
    detail:
      `relayUrl:    ${cfg.relayUrl}\n` +
      `sharedSecret: ${cfg.sharedSecret ? "<set>" : "<missing>"}\n\n` +
      `Path: ${CONFIG_PATH}\n\n` +
      `For dev: ssh -L 8765:127.0.0.1:8765 root@<host>`,
    buttons: ["OK", "Reveal in Finder"],
    defaultId: 0,
  });
  if (response === 1) {
    const { shell } = require("electron");
    await fs.mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
    shell.showItemInFolder(CONFIG_PATH);
  }
}

module.exports = { loadConfig, saveConfig, openSettingsDialog, CONFIG_PATH };
