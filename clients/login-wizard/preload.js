"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pixdesk", {
  health: () => ipcRenderer.invoke("relay:health"),
  loginDiscord: () => ipcRenderer.invoke("login:discord"),
  loginSlack: () => ipcRenderer.invoke("login:slack"),
  loginTelegramQR: () => ipcRenderer.invoke("login:telegram:qr"),
  loginTelegramStatus: (args) => ipcRenderer.invoke("login:telegram:status", args),
  getConfig: () => ipcRenderer.invoke("config:get"),
  setConfig: (partial) => ipcRenderer.invoke("config:set", partial),
  getChatUrl: () => ipcRenderer.invoke("chat:url"),
  revealCaptured: (filePath) => ipcRenderer.invoke("captured:reveal", filePath),
  listAccounts: () => ipcRenderer.invoke("accounts:list"),
  bridgeStatus: (bridge) => ipcRenderer.invoke("bridge:status", bridge),
  bridgeLogout: (bridge) => ipcRenderer.invoke("bridge:logout", bridge),
});
