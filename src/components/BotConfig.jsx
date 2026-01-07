import React, { useState, useEffect } from 'react';
import './BotConfig.css';

function BotConfig({ config, onConfigChange, isRunning }) {
  const [localConfig, setLocalConfig] = useState(config);

  // Sync local state when the config prop changes
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleChange = (field, value) => {
    const newConfig = { ...localConfig, [field]: value };
    setLocalConfig(newConfig);
  };

  const handleSave = () => {
    onConfigChange(localConfig);
  };

  return (
    <div className="bot-config">
      <div className="config-section">
        <h2>Bot Configuration</h2>
        <p className="section-description">
          Configure your Discord bot's credentials and settings. You'll need a bot token from the Discord Developer Portal.
        </p>

        <div className="form-group">
          <label htmlFor="name">
            Bot Name *
          </label>
          <input
            id="name"
            type="text"
            placeholder="My Awesome Bot"
            value={localConfig.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            disabled={isRunning}
          />
          <small>A friendly name to identify this bot</small>
        </div>

        <div className="form-group">
          <label htmlFor="token">
            Bot Token *
            <span className="tooltip">
              <span className="info-icon">ℹ</span>
              <span className="tooltip-text">
                Get your bot token from Discord Developer Portal → Applications → Your Bot → Bot → Token
              </span>
            </span>
          </label>
          <input
            id="token"
            type="password"
            placeholder="Your bot token here..."
            value={localConfig.token}
            onChange={(e) => handleChange('token', e.target.value)}
            disabled={isRunning}
          />
        </div>

        <div className="form-group">
          <label htmlFor="applicationId">
            Application ID (Client ID)
            <span className="tooltip">
              <span className="info-icon">ℹ</span>
              <span className="tooltip-text">
                Found in Discord Developer Portal → Applications → Your Bot → General Information → Application ID
              </span>
            </span>
          </label>
          <input
            id="applicationId"
            type="text"
            placeholder="Your application ID..."
            value={localConfig.applicationId}
            onChange={(e) => handleChange('applicationId', e.target.value)}
            disabled={isRunning}
          />
          <small>Required for slash commands to work</small>
        </div>

        <div className="form-group">
          <label htmlFor="guildId">
            Guild ID (Optional)
            <span className="tooltip">
              <span className="info-icon">ℹ</span>
              <span className="tooltip-text">
                Right-click your server → Copy Server ID (requires Developer Mode enabled in Discord)
              </span>
            </span>
          </label>
          <input
            id="guildId"
            type="text"
            placeholder="Guild ID for instant command updates..."
            value={localConfig.guildId}
            onChange={(e) => handleChange('guildId', e.target.value)}
            disabled={isRunning}
          />
          <small>If provided, commands update instantly. Otherwise they take up to 1 hour.</small>
        </div>

        <button onClick={handleSave} className="primary" disabled={isRunning}>
          Save Configuration
        </button>
      </div>

      <div className="config-section help-section">
        <h3>Getting Started</h3>
        <ol>
          <li>
            Go to <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer">
              Discord Developer Portal
            </a>
          </li>
          <li>Click "New Application" and give it a name</li>
          <li>Go to the "Bot" tab and click "Add Bot"</li>
          <li>Copy the bot token and paste it above</li>
          <li>Enable "Message Content Intent" under Privileged Gateway Intents</li>
          <li>Go to OAuth2 → URL Generator, select "bot" and "applications.commands"</li>
          <li>Select desired permissions and use the generated URL to invite your bot</li>
        </ol>
      </div>
    </div>
  );
}

export default BotConfig;
