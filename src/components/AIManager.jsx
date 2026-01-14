import React, { useState } from 'react';
import './AIManager.css';

function AIManager({ aiConfigs = [], onUpdateAIConfigs }) {
  const [selectedAI, setSelectedAI] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newAI, setNewAI] = useState({
    name: '',
    provider: 'claude',
    apiKey: '',
    model: 'claude-3-5-sonnet-20241022',
    temperature: 1.0,
    maxTokens: 4096,
    systemPrompt: '',
  });

  const claudeModels = [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
  ];

  const handleAddAI = () => {
    if (!newAI.name || !newAI.apiKey) {
      alert('Please fill in Name and API Key');
      return;
    }

    const aiConfig = {
      id: Date.now().toString(),
      ...newAI,
    };

    onUpdateAIConfigs([...aiConfigs, aiConfig]);
    setNewAI({
      name: '',
      provider: 'claude',
      apiKey: '',
      model: 'claude-3-5-sonnet-20241022',
      temperature: 1.0,
      maxTokens: 4096,
      systemPrompt: '',
    });
    setIsAdding(false);
  };

  const handleUpdateAI = (id, updates) => {
    const updatedConfigs = aiConfigs.map((ai) =>
      ai.id === id ? { ...ai, ...updates } : ai
    );
    onUpdateAIConfigs(updatedConfigs);
  };

  const handleDeleteAI = (id) => {
    if (confirm('Are you sure you want to delete this AI configuration?')) {
      const updatedConfigs = aiConfigs.filter((ai) => ai.id !== id);
      onUpdateAIConfigs(updatedConfigs);
      if (selectedAI === id) {
        setSelectedAI(null);
      }
    }
  };

  const renderAIForm = (ai, isNew = false) => {
    const updateField = (field, value) => {
      if (isNew) {
        setNewAI({ ...newAI, [field]: value });
      } else {
        handleUpdateAI(ai.id, { [field]: value });
      }
    };

    const currentAI = isNew ? newAI : ai;

    return (
      <div className="ai-form">
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            value={currentAI.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="e.g., My Claude Assistant"
          />
        </div>

        <div className="form-group">
          <label>Provider</label>
          <div className="provider-buttons">
            <button
              className={`provider-btn ${currentAI.provider === 'claude' ? 'active' : ''}`}
              onClick={() => updateField('provider', 'claude')}
            >
              🤖 Claude
            </button>
            <button
              className="provider-btn disabled"
              disabled
              title="Coming soon!"
            >
              💬 ChatGPT (Coming Soon)
            </button>
          </div>
        </div>

        {currentAI.provider === 'claude' && (
          <>
            <div className="form-group">
              <label>API Key *</label>
              <input
                type="password"
                value={currentAI.apiKey}
                onChange={(e) => updateField('apiKey', e.target.value)}
                placeholder="sk-ant-..."
              />
              <small>Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">console.anthropic.com</a></small>
            </div>

            <div className="form-group">
              <label>Model</label>
              <select
                value={currentAI.model}
                onChange={(e) => updateField('model', e.target.value)}
              >
                {claudeModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Temperature (0-1)</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={currentAI.temperature}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  updateField('temperature', isNaN(val) ? 1.0 : val);
                }}
              />
              <small>Higher values make output more random, lower values more focused</small>
            </div>

            <div className="form-group">
              <label>Max Tokens</label>
              <input
                type="number"
                min="1"
                max="8192"
                value={currentAI.maxTokens}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  updateField('maxTokens', isNaN(val) ? 4096 : val);
                }}
              />
              <small>Maximum length of the response</small>
            </div>

            <div className="form-group">
              <label>System Prompt / Style</label>
              <textarea
                value={currentAI.systemPrompt}
                onChange={(e) => updateField('systemPrompt', e.target.value)}
                placeholder="You are a helpful assistant..."
                rows="4"
              />
              <small>Instructions that guide the AI's behavior and personality</small>
            </div>
          </>
        )}

        {isNew && (
          <div className="form-actions">
            <button className="btn-primary" onClick={handleAddAI}>
              Add AI Configuration
            </button>
            <button className="btn-secondary" onClick={() => setIsAdding(false)}>
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="ai-manager">
      <div className="ai-manager-header">
        <h2>AI Configurations</h2>
        <p>Create and manage AI configurations for use in your bot's blueprints</p>
      </div>

      <div className="ai-manager-content">
        <div className="ai-list">
          <div className="ai-list-header">
            <h3>Configured AIs</h3>
            {!isAdding && (
              <button className="btn-add" onClick={() => setIsAdding(true)}>
                + Add AI
              </button>
            )}
          </div>

          {aiConfigs.length === 0 && !isAdding && (
            <div className="empty-state">
              <div className="empty-icon">🤖</div>
              <p>No AI configurations yet</p>
              <small>Click "Add AI" to create your first AI configuration</small>
            </div>
          )}

          {isAdding && (
            <div className="ai-card new-ai">
              <h4>New AI Configuration</h4>
              {renderAIForm(null, true)}
            </div>
          )}

          {aiConfigs.map((ai) => (
            <div
              key={ai.id}
              className={`ai-card ${selectedAI === ai.id ? 'selected' : ''}`}
              onClick={() => setSelectedAI(ai.id)}
            >
              <div className="ai-card-header">
                <div className="ai-card-title">
                  <span className="ai-icon">🤖</span>
                  <h4>{ai.name}</h4>
                </div>
                <button
                  className="btn-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAI(ai.id);
                  }}
                >
                  🗑️
                </button>
              </div>
              <div className="ai-card-info">
                <span className="ai-provider">{ai.provider === 'claude' ? 'Claude' : 'ChatGPT'}</span>
                <span className="ai-model">{claudeModels.find(m => m.id === ai.model)?.name || ai.model}</span>
              </div>
            </div>
          ))}
        </div>

        {selectedAI && (
          <div className="ai-details">
            <h3>Edit Configuration</h3>
            {renderAIForm(aiConfigs.find((ai) => ai.id === selectedAI))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AIManager;
