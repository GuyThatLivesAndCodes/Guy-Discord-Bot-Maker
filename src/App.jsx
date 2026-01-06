import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import BotConfig from './components/BotConfig';
import CommandBuilder from './components/CommandBuilder';
import Console from './components/Console';
import './App.css';

function App() {
  const [botConfig, setBotConfig] = useState({
    token: '',
    applicationId: '',
    guildId: '',
    commands: [],
  });

  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('config');

  useEffect(() => {
    // Load saved config on startup
    loadConfig();

    // Set up log listener
    if (window.electron) {
      window.electron.onBotLog((log) => {
        setLogs((prev) => [...prev, log]);
      });
    }
  }, []);

  const loadConfig = async () => {
    if (window.electron) {
      const result = await window.electron.loadConfig();
      if (result.success && result.config) {
        setBotConfig(result.config);
      }
    }
  };

  const saveConfig = async (config) => {
    setBotConfig(config);
    if (window.electron) {
      await window.electron.saveConfig(config);
    }
  };

  const startBot = async () => {
    if (!botConfig.token) {
      addLog({ type: 'error', message: 'Please enter a bot token first!', timestamp: new Date().toISOString() });
      return;
    }

    setLogs([]);
    if (window.electron) {
      const result = await window.electron.startBot(botConfig);
      if (result.success) {
        setIsRunning(true);
      } else {
        addLog({ type: 'error', message: result.error, timestamp: new Date().toISOString() });
      }
    }
  };

  const stopBot = async () => {
    if (window.electron) {
      const result = await window.electron.stopBot();
      if (result.success) {
        setIsRunning(false);
      }
    }
  };

  const addLog = (log) => {
    setLogs((prev) => [...prev, log]);
  };

  const addCommand = (command) => {
    const newConfig = {
      ...botConfig,
      commands: [...botConfig.commands, command],
    };
    saveConfig(newConfig);
  };

  const updateCommand = (index, command) => {
    const newCommands = [...botConfig.commands];
    newCommands[index] = command;
    const newConfig = {
      ...botConfig,
      commands: newCommands,
    };
    saveConfig(newConfig);
  };

  const deleteCommand = (index) => {
    const newCommands = botConfig.commands.filter((_, i) => i !== index);
    const newConfig = {
      ...botConfig,
      commands: newCommands,
    };
    saveConfig(newConfig);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        <header className="app-header">
          <h1>Discord Bot Maker</h1>
          <div className="header-controls">
            <div className="status-indicator">
              <div className={`status-dot ${isRunning ? 'running' : 'stopped'}`}></div>
              <span>{isRunning ? 'Running' : 'Stopped'}</span>
            </div>
            {isRunning ? (
              <button onClick={stopBot} className="danger">
                Stop Bot
              </button>
            ) : (
              <button onClick={startBot} className="primary">
                Start Bot
              </button>
            )}
          </div>
        </header>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            Configuration
          </button>
          <button
            className={`tab ${activeTab === 'commands' ? 'active' : ''}`}
            onClick={() => setActiveTab('commands')}
          >
            Commands
          </button>
        </div>

        <main className="app-content">
          {activeTab === 'config' && (
            <BotConfig
              config={botConfig}
              onConfigChange={saveConfig}
              isRunning={isRunning}
            />
          )}

          {activeTab === 'commands' && (
            <CommandBuilder
              commands={botConfig.commands}
              onAddCommand={addCommand}
              onUpdateCommand={updateCommand}
              onDeleteCommand={deleteCommand}
            />
          )}
        </main>

        <Console logs={logs} onClear={() => setLogs([])} />
      </div>
    </DndProvider>
  );
}

export default App;
