const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  startBot: (config) => ipcRenderer.invoke('start-bot', config),
  stopBot: () => ipcRenderer.invoke('stop-bot'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  loadConfig: () => ipcRenderer.invoke('load-config'),
  onBotLog: (callback) => {
    ipcRenderer.on('bot-log', (event, log) => callback(log));
  },
});
