import React, { useState } from 'react';
import BotConfig from './BotConfig';
import AIManager from './AIManager';
import EventBuilder from './EventBuilder';
import './BotEditor.css';

function BotEditor({ bot, isRunning, onUpdateBot, onStartBot, onStopBot, onBack }) {
  const [activeTab, setActiveTab] = useState('config');

  if (!bot) {
    return <div className="bot-editor-error">Bot not found</div>;
  }

  const handleConfigChange = (config) => {
    onUpdateBot(config);
  };

  const addEvent = (event) => {
    const newEvents = [...(bot.events || []), event];
    onUpdateBot({ events: newEvents });
  };

  const updateEvent = (index, event) => {
    const newEvents = [...(bot.events || [])];
    newEvents[index] = event;
    onUpdateBot({ events: newEvents });
  };

  const deleteEvent = (index) => {
    const newEvents = (bot.events || []).filter((_, i) => i !== index);
    onUpdateBot({ events: newEvents });
  };

  return (
    <div className="bot-editor">
      <header className="editor-header">
        <div className="header-left">
          <button onClick={onBack} className="back-btn" title="Back to dashboard">
            ← Back
          </button>
          <div className="bot-title">
            <h1>{bot.name}</h1>
            <div className="status-indicator">
              <div className={`status-dot ${isRunning ? 'running' : 'stopped'}`}></div>
              <span>{isRunning ? 'Running' : 'Stopped'}</span>
            </div>
          </div>
        </div>

        <div className="header-controls">
          {isRunning ? (
            <button onClick={onStopBot} className="danger">
              Stop Bot
            </button>
          ) : (
            <button onClick={onStartBot} className="primary">
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
          className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          AI
        </button>
        <button
          className={`tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Events
        </button>
      </div>

      <main className="editor-content">
        {activeTab === 'config' && (
          <BotConfig
            config={bot}
            onConfigChange={handleConfigChange}
            isRunning={isRunning}
          />
        )}

        {activeTab === 'ai' && (
          <AIManager
            aiConfigs={bot.aiConfigs || []}
            onUpdateAIConfigs={(aiConfigs) => onUpdateBot({ aiConfigs })}
          />
        )}

        {activeTab === 'events' && (
          <EventBuilder
            events={bot.events || []}
            aiConfigs={bot.aiConfigs || []}
            onAddEvent={addEvent}
            onUpdateEvent={updateEvent}
            onDeleteEvent={deleteEvent}
          />
        )}
      </main>
    </div>
  );
}

export default BotEditor;
