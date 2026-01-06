const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const BotRunner = require('./botRunner');

let mainWindow;
const botRunners = new Map(); // Store multiple bot instances

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // In development, load from Vite dev server
  // In production, load from built files
  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Stop all running bots
  botRunners.forEach((runner) => runner.stop());
  botRunners.clear();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers for bot operations
ipcMain.handle('start-bot', async (event, botId, config) => {
  try {
    // Stop bot if already running
    if (botRunners.has(botId)) {
      botRunners.get(botId).stop();
      botRunners.delete(botId);
    }

    const botRunner = new BotRunner(botId, config, (log) => {
      // Send logs to renderer with bot ID
      mainWindow.webContents.send('bot-log', { ...log, botId });
    });

    await botRunner.start();
    botRunners.set(botId, botRunner);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-bot', async (event, botId) => {
  try {
    if (botRunners.has(botId)) {
      botRunners.get(botId).stop();
      botRunners.delete(botId);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-bots', async (event, bots) => {
  try {
    const fs = require('fs');
    const botsPath = path.join(app.getPath('userData'), 'bots.json');
    fs.writeFileSync(botsPath, JSON.stringify(bots, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-bots', async () => {
  try {
    const fs = require('fs');
    const botsPath = path.join(app.getPath('userData'), 'bots.json');
    if (fs.existsSync(botsPath)) {
      const data = fs.readFileSync(botsPath, 'utf8');
      return { success: true, bots: JSON.parse(data) };
    }
    return { success: true, bots: [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
