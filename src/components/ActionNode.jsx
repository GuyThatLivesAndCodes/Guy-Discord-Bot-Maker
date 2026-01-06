import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import './ActionNode.css';

// Data types - duplicated to avoid circular dependency
const DATA_TYPES = {
  FLOW: { color: '#5865f2', label: 'Flow' },
  USER: { color: '#f23f43', label: 'User' },
  CHANNEL: { color: '#43b581', label: 'Channel' },
  GUILD: { color: '#7289da', label: 'Guild' },
  STRING: { color: '#faa61a', label: 'String' },
  NUMBER: { color: '#00aff4', label: 'Number' },
};

const ActionNode = ({ id, data }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleConfigChange = (field, value) => {
    const newConfig = { ...data.config, [field]: value };
    data.onUpdate(id, newConfig);
  };

  const addEmbedField = () => {
    const fields = data.config.fields || [];
    const newFields = [
      ...fields,
      { name: 'Field Name', value: 'Field Value', inline: false },
    ];
    handleConfigChange('fields', newFields);
  };

  const updateEmbedField = (index, field, value) => {
    const fields = [...(data.config.fields || [])];
    fields[index] = { ...fields[index], [field]: value };
    handleConfigChange('fields', fields);
  };

  const removeEmbedField = (index) => {
    const fields = (data.config.fields || []).filter((_, i) => i !== index);
    handleConfigChange('fields', fields);
  };

  return (
    <div className="action-node" style={{ borderColor: data.color }}>
      {/* Input handles - positioned along left side */}
      {data.inputs?.map((input, index) => (
        <Handle
          key={input.id}
          type="target"
          position={Position.Left}
          id={input.id}
          style={{
            background: DATA_TYPES[input.type]?.color || '#5865f2',
            width: 12,
            height: 12,
            top: `${50 + index * 15}%`,
            left: '-6px',
            border: '2px solid #2b2d31',
          }}
        />
      ))}

      <div className="action-node-header" style={{ background: data.color }}>
        <span className="action-node-icon">{data.icon}</span>
        <span className="action-node-label">{data.label}</span>
        <button
          className="action-node-expand"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {isExpanded && (
        <div className="action-node-config">
          {data.actionType === 'send-message' && (
            <div className="config-field">
              <label>Message Content</label>
              <textarea
                value={data.config.content || ''}
                onChange={(e) => handleConfigChange('content', e.target.value)}
                placeholder="Type your message here, or connect a STRING input..."
                rows={3}
              />
              <small style={{ color: '#b5bac1', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                💡 Tip: Connect a STRING output to override this text
              </small>
            </div>
          )}

          {data.actionType === 'embed' && (
            <>
              <div className="config-field">
                <label>Title</label>
                <input
                  type="text"
                  value={data.config.title || ''}
                  onChange={(e) => handleConfigChange('title', e.target.value)}
                  placeholder="Embed title"
                />
                <small style={{ color: '#b5bac1', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                  💡 Connect a STRING to use dynamic data
                </small>
              </div>

              <div className="config-field">
                <label>Description</label>
                <textarea
                  value={data.config.description || ''}
                  onChange={(e) => handleConfigChange('description', e.target.value)}
                  placeholder="Main embed text"
                  rows={2}
                />
                <small style={{ color: '#b5bac1', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                  💡 Supports Discord markdown formatting
                </small>
              </div>

              <div className="config-field">
                <label>Color (hex)</label>
                <div className="color-input-group">
                  <input
                    type="text"
                    value={data.config.color || '#5865f2'}
                    onChange={(e) => handleConfigChange('color', e.target.value)}
                    placeholder="#5865f2"
                  />
                  <input
                    type="color"
                    value={data.config.color || '#5865f2'}
                    onChange={(e) => handleConfigChange('color', e.target.value)}
                  />
                </div>
              </div>

              <div className="config-field">
                <label>Author</label>
                <input
                  type="text"
                  value={data.config.author || ''}
                  onChange={(e) => handleConfigChange('author', e.target.value)}
                  placeholder="Author name"
                />
              </div>

              <div className="config-field">
                <label>Author Icon URL</label>
                <input
                  type="text"
                  value={data.config.authorIcon || ''}
                  onChange={(e) => handleConfigChange('authorIcon', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="config-field">
                <label>Author URL</label>
                <input
                  type="text"
                  value={data.config.authorUrl || ''}
                  onChange={(e) => handleConfigChange('authorUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="config-field">
                <label>Thumbnail URL</label>
                <input
                  type="text"
                  value={data.config.thumbnail || ''}
                  onChange={(e) => handleConfigChange('thumbnail', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="config-field">
                <label>Image URL</label>
                <input
                  type="text"
                  value={data.config.image || ''}
                  onChange={(e) => handleConfigChange('image', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="config-field">
                <label>URL</label>
                <input
                  type="text"
                  value={data.config.url || ''}
                  onChange={(e) => handleConfigChange('url', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="config-field">
                <label>Footer</label>
                <input
                  type="text"
                  value={data.config.footer || ''}
                  onChange={(e) => handleConfigChange('footer', e.target.value)}
                  placeholder="Footer text"
                />
              </div>

              <div className="config-field">
                <label>Footer Icon URL</label>
                <input
                  type="text"
                  value={data.config.footerIcon || ''}
                  onChange={(e) => handleConfigChange('footerIcon', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="config-field">
                <label>
                  <input
                    type="checkbox"
                    checked={data.config.timestamp || false}
                    onChange={(e) => handleConfigChange('timestamp', e.target.checked)}
                  />
                  Show Timestamp
                </label>
              </div>

              <div className="config-field embed-fields-section">
                <label>Fields</label>
                {(data.config.fields || []).map((field, index) => (
                  <div key={index} className="embed-field-item">
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => updateEmbedField(index, 'name', e.target.value)}
                      placeholder="Field name"
                    />
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => updateEmbedField(index, 'value', e.target.value)}
                      placeholder="Field value"
                    />
                    <label className="inline-checkbox">
                      <input
                        type="checkbox"
                        checked={field.inline || false}
                        onChange={(e) => updateEmbedField(index, 'inline', e.target.checked)}
                      />
                      Inline
                    </label>
                    <button onClick={() => removeEmbedField(index)} className="remove-field-btn">
                      ×
                    </button>
                  </div>
                ))}
                <button onClick={addEmbedField} className="add-field-btn">
                  + Add Field
                </button>
              </div>
            </>
          )}

          {(data.actionType === 'add-role' || data.actionType === 'remove-role') && (
            <div className="config-field">
              <label>Role ID</label>
              <input
                type="text"
                value={data.config.roleId || ''}
                onChange={(e) => handleConfigChange('roleId', e.target.value)}
                placeholder="123456789012345678"
              />
              <small style={{ color: '#b5bac1', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                💡 Right-click role → Copy ID (Developer Mode must be enabled)
              </small>
            </div>
          )}

          {data.actionType === 'condition' && (
            <>
              <div className="config-field">
                <label>Condition Type</label>
                <select
                  value={data.config.condition || 'has-role'}
                  onChange={(e) => handleConfigChange('condition', e.target.value)}
                >
                  <option value="has-role">Has Role</option>
                  <option value="user-id">User ID Equals</option>
                  <option value="random">Random Chance</option>
                </select>
              </div>

              <div className="config-field">
                <label>Value</label>
                <input
                  type="text"
                  value={data.config.value || ''}
                  onChange={(e) => handleConfigChange('value', e.target.value)}
                  placeholder="Role ID, User ID, or %"
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Output handle for flow continuation */}
      <Handle
        type="source"
        position={Position.Right}
        id="flow"
        style={{
          background: DATA_TYPES.FLOW.color,
          width: 12,
          height: 12,
          right: '-6px',
          border: '2px solid #2b2d31',
        }}
      />
    </div>
  );
};

export default memo(ActionNode);
