const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  startBot: (botId, config) => ipcRenderer.invoke('start-bot', botId, config),
  stopBot: (botId) => ipcRenderer.invoke('stop-bot', botId),
  saveBots: (bots) => ipcRenderer.invoke('save-bots', bots),
  loadBots: () => ipcRenderer.invoke('load-bots'),
  onBotLog: (callback) => {
    ipcRenderer.on('bot-log', (event, log) => callback(log));
  },
});
