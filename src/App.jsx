import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Dashboard from './components/Dashboard';
import BotEditor from './components/BotEditor';
import Console from './components/Console';
import './App.css';

function App() {
  const [bots, setBots] = useState([]);
  const [activeBotId, setActiveBotId] = useState(null);
  const [runningBots, setRunningBots] = useState(new Set());
  const [logs, setLogs] = useState([]);
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'editor'

  useEffect(() => {
    loadBots();

    // Set up log listener
    if (window.electron) {
      window.electron.onBotLog((log) => {
        setLogs((prev) => [...prev, log]);
      });
    }
  }, []);

  const loadBots = async () => {
    if (window.electron) {
      const result = await window.electron.loadBots();
      if (result.success && result.bots) {
        setBots(result.bots);
      }
    }
  };

  const saveBots = async (newBots) => {
    setBots(newBots);
    if (window.electron) {
      await window.electron.saveBots(newBots);
    }
  };

  const createBot = () => {
    const newBot = {
      id: Date.now().toString(),
      name: `Bot ${bots.length + 1}`,
      token: '',
      applicationId: '',
      guildId: '',
      events: [],
      createdAt: new Date().toISOString(),
    };
    const newBots = [...bots, newBot];
    saveBots(newBots);
    setActiveBotId(newBot.id);
    setView('editor');
  };

  const updateBot = (botId, updates) => {
    const newBots = bots.map((bot) =>
      bot.id === botId ? { ...bot, ...updates } : bot
    );
    saveBots(newBots);
  };

  const deleteBot = async (botId) => {
    // Stop bot if running
    if (runningBots.has(botId)) {
      await stopBot(botId);
    }
    const newBots = bots.filter((bot) => bot.id !== botId);
    saveBots(newBots);
    if (activeBotId === botId) {
      setActiveBotId(null);
      setView('dashboard');
    }
  };

  const startBot = async (botId) => {
    const bot = bots.find((b) => b.id === botId);
    if (!bot || !bot.token) {
      addLog({
        type: 'error',
        message: `[${bot?.name || 'Unknown'}] Please configure bot token first!`,
        timestamp: new Date().toISOString(),
        botId,
      });
      return;
    }

    if (window.electron) {
      const result = await window.electron.startBot(botId, bot);
      if (result.success) {
        setRunningBots((prev) => new Set([...prev, botId]));
        addLog({
          type: 'info',
          message: `[${bot.name}] Starting bot...`,
          timestamp: new Date().toISOString(),
          botId,
        });
      } else {
        addLog({
          type: 'error',
          message: `[${bot.name}] ${result.error}`,
          timestamp: new Date().toISOString(),
          botId,
        });
      }
    }
  };

  const stopBot = async (botId) => {
    const bot = bots.find((b) => b.id === botId);
    if (window.electron) {
      const result = await window.electron.stopBot(botId);
      if (result.success) {
        setRunningBots((prev) => {
          const newSet = new Set(prev);
          newSet.delete(botId);
          return newSet;
        });
        addLog({
          type: 'info',
          message: `[${bot?.name || 'Unknown'}] Stopping bot...`,
          timestamp: new Date().toISOString(),
          botId,
        });
      }
    }
  };

  const addLog = (log) => {
    setLogs((prev) => [...prev, log]);
  };

  const openBot = (botId) => {
    setActiveBotId(botId);
    setView('editor');
  };

  const backToDashboard = () => {
    setActiveBotId(null);
    setView('dashboard');
  };

  const activeBot = bots.find((b) => b.id === activeBotId);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        {view === 'dashboard' ? (
          <Dashboard
            bots={bots}
            runningBots={runningBots}
            onCreateBot={createBot}
            onOpenBot={openBot}
            onStartBot={startBot}
            onStopBot={stopBot}
            onDeleteBot={deleteBot}
          />
        ) : (
          <BotEditor
            bot={activeBot}
            isRunning={runningBots.has(activeBotId)}
            onUpdateBot={(updates) => updateBot(activeBotId, updates)}
            onStartBot={() => startBot(activeBotId)}
            onStopBot={() => stopBot(activeBotId)}
            onBack={backToDashboard}
          />
        )}

        <Console logs={logs} onClear={() => setLogs([])} />
      </div>
    </DndProvider>
  );
}

export default App;
