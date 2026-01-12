const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const BotRunner = require('./botRunner');

let mainWindow;
const botRunners = new Map(); // Store multiple bot instances

// Migration function to fix old blueprint nodes with incorrect definitionIds
function migrateBlueprint(blueprint) {
  // Mapping of old key-based IDs to new actual IDs
  const definitionIdMap = {
    // Action nodes
    'SEND_MESSAGE': 'action-send-message',
    'REPLY_TO_MESSAGE': 'action-reply-message',
    'DELETE_MESSAGE': 'action-delete-message',
    'EDIT_MESSAGE': 'action-edit-message',
    'ADD_REACTION': 'action-add-reaction',
    'REMOVE_REACTION': 'action-remove-reaction',
    'CREATE_THREAD': 'action-create-thread',
    'PIN_MESSAGE': 'action-pin-message',
    'KICK_MEMBER': 'action-kick-member',
    'BAN_MEMBER': 'action-ban-member',
    'TIMEOUT_MEMBER': 'action-timeout-member',
    'ADD_ROLE': 'action-add-role',
    'REMOVE_ROLE': 'action-remove-role',
    'SET_NICKNAME': 'action-set-nickname',
    'CREATE_CHANNEL': 'action-create-channel',
    'DELETE_CHANNEL': 'action-delete-channel',
    'EDIT_CHANNEL': 'action-edit-channel',
    'LOG': 'action-log',
    'HTTP_REQUEST': 'action-http-request',
    'WAIT': 'action-wait',

    // Pure nodes
    'GET_MESSAGE_CONTENT': 'pure-get-message-content',
    'GET_MESSAGE_AUTHOR': 'pure-get-message-author',
    'GET_MESSAGE_CHANNEL': 'pure-get-message-channel',
    'GET_USER_ID': 'pure-get-user-id',
    'GET_USER_NAME': 'pure-get-user-name',
    'GET_USER_DISCRIMINATOR': 'pure-get-user-discriminator',
    'GET_USER_TAG': 'pure-get-user-tag',
    'GET_USER_AVATAR': 'pure-get-user-avatar',
    'GET_CHANNEL_ID': 'pure-get-channel-id',
    'GET_CHANNEL_NAME': 'pure-get-channel-name',
    'GET_MEMBER_ROLES': 'pure-get-member-roles',
    'HAS_ROLE': 'pure-has-role',
    'STRING_CONCAT': 'pure-string-concat',
    'STRING_CONTAINS': 'pure-string-contains',
    'STRING_LENGTH': 'pure-string-length',
    'NUMBER_ADD': 'pure-number-add',
    'NUMBER_SUBTRACT': 'pure-number-subtract',
    'NUMBER_MULTIPLY': 'pure-number-multiply',
    'NUMBER_DIVIDE': 'pure-number-divide',
    'COMPARE_EQUAL': 'pure-compare-equal',
    'COMPARE_NOT_EQUAL': 'pure-compare-not-equal',
    'COMPARE_GREATER': 'pure-compare-greater',
    'COMPARE_LESS': 'pure-compare-less',
    'LOGICAL_AND': 'pure-logical-and',
    'LOGICAL_OR': 'pure-logical-or',
    'LOGICAL_NOT': 'pure-logical-not',

    // Flow control nodes
    'BRANCH': 'flow-branch',
    'FOR_LOOP': 'flow-for-loop',
    'WHILE_LOOP': 'flow-while-loop',

    // Event nodes
    'ON_MESSAGE_CREATED': 'event-message-created',
    'ON_MESSAGE_DELETED': 'event-message-deleted',
    'ON_MESSAGE_UPDATED': 'event-message-updated',
    'ON_MEMBER_JOIN': 'event-member-join',
    'ON_MEMBER_LEAVE': 'event-member-leave',
    'ON_REACTION_ADD': 'event-reaction-add',
    'ON_REACTION_REMOVE': 'event-reaction-remove',
  };

  if (!blueprint.flowData || !blueprint.flowData.nodes) {
    return blueprint;
  }

  // Update each node's definitionId if it uses the old format
  blueprint.flowData.nodes = blueprint.flowData.nodes.map(node => {
    if (node.data && node.data.definitionId) {
      const oldId = node.data.definitionId;
      const newId = definitionIdMap[oldId];

      if (newId) {
        console.log(`[Migration] Updating node ${node.id}: ${oldId} -> ${newId}`);
        node.data.definitionId = newId;
      }
    }
    return node;
  });

  return blueprint;
}

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
      const bots = JSON.parse(data);

      // Migrate all blueprints to use correct definitionIds
      const migratedBots = bots.map(bot => {
        // Migrate events
        if (bot.events && Array.isArray(bot.events)) {
          bot.events = bot.events.map(event => migrateBlueprint(event));
        }

        // Migrate commands
        if (bot.commands && Array.isArray(bot.commands)) {
          bot.commands = bot.commands.map(command => migrateBlueprint(command));
        }

        return bot;
      });

      // Save migrated data back to file
      fs.writeFileSync(botsPath, JSON.stringify(migratedBots, null, 2));
      console.log('[Migration] Migrated all blueprints to new definitionId format');

      return { success: true, bots: migratedBots };
    }
    return { success: true, bots: [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
