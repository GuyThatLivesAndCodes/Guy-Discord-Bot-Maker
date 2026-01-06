const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const BotRunner = require('./botRunner');

let mainWindow;
let botRunner;

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
  if (botRunner) {
    botRunner.stop();
  }
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
ipcMain.handle('start-bot', async (event, config) => {
  try {
    if (botRunner) {
      botRunner.stop();
    }

    botRunner = new BotRunner(config, (log) => {
      // Send logs to renderer
      mainWindow.webContents.send('bot-log', log);
    });

    await botRunner.start();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-bot', async () => {
  try {
    if (botRunner) {
      botRunner.stop();
      botRunner = null;
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-config', async (event, config) => {
  try {
    const fs = require('fs');
    const configPath = path.join(app.getPath('userData'), 'bot-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-config', async () => {
  try {
    const fs = require('fs');
    const configPath = path.join(app.getPath('userData'), 'bot-config.json');
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return { success: true, config: JSON.parse(data) };
    }
    return { success: true, config: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
