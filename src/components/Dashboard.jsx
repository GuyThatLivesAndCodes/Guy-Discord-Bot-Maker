import React from 'react';
import './Dashboard.css';

function Dashboard({ bots, runningBots, onCreateBot, onOpenBot, onStartBot, onStopBot, onDeleteBot }) {
  const handleDelete = (botId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this bot? This cannot be undone.')) {
      onDeleteBot(botId);
    }
  };

  const handleToggleBot = (botId, isRunning, e) => {
    e.stopPropagation();
    if (isRunning) {
      onStopBot(botId);
    } else {
      onStartBot(botId);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Discord Bot Maker</h1>
          <p className="subtitle">Manage multiple Discord bots with ease</p>
        </div>
        <div className="dashboard-stats">
          <div className="stat-box">
            <span className="stat-value">{bots.length}</span>
            <span className="stat-label">Total Bots</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{runningBots.size}</span>
            <span className="stat-label">Running</span>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="bots-grid">
          <div className="bot-card create-card" onClick={onCreateBot}>
            <div className="create-icon">+</div>
            <h3>Create New Bot</h3>
            <p>Set up a new Discord bot</p>
          </div>

          {bots.map((bot) => {
            const isRunning = runningBots.has(bot.id);
            const eventCount = bot.events?.length || 0;
            const commandEvents = bot.events?.filter((e) => e.type === 'command').length || 0;

            return (
              <div
                key={bot.id}
                className={`bot-card ${isRunning ? 'running' : ''}`}
                onClick={() => onOpenBot(bot.id)}
              >
                <div className="bot-card-header">
                  <div className="bot-status">
                    <div className={`status-dot ${isRunning ? 'running' : 'stopped'}`}></div>
                    <span className="bot-name">{bot.name}</span>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDelete(bot.id, e)}
                    title="Delete bot"
                  >
                    🗑️
                  </button>
                </div>

                <div className="bot-card-body">
                  <div className="bot-info">
                    <div className="info-item">
                      <span className="info-icon">⚡</span>
                      <span>{eventCount} events</span>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">💬</span>
                      <span>{commandEvents} commands</span>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">🔑</span>
                      <span>{bot.token ? 'Configured' : 'Not configured'}</span>
                    </div>
                  </div>

                  <button
                    className={`bot-toggle-btn ${isRunning ? 'danger' : 'primary'}`}
                    onClick={(e) => handleToggleBot(bot.id, isRunning, e)}
                  >
                    {isRunning ? 'Stop Bot' : 'Start Bot'}
                  </button>
                </div>

                {bot.createdAt && (
                  <div className="bot-card-footer">
                    Created {new Date(bot.createdAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {bots.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🤖</div>
            <h2>No Bots Yet</h2>
            <p>Create your first Discord bot to get started!</p>
            <button onClick={onCreateBot} className="primary large">
              Create Your First Bot
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
