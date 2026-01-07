import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import './ActionNode.css';
import { DATA_TYPES } from '../constants/dataTypes';

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
        <div className="action-node-config nodrag" onMouseDown={(e) => e.stopPropagation()}>
          {data.actionType === 'send-message' && (
            <>
              <div className="config-field">
                <label>Message Content</label>
                <textarea
                  value={data.config.content || ''}
                  onChange={(e) => handleConfigChange('content', e.target.value)}
                  placeholder="Type your message here, or connect a STRING input..."
                  rows={3}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
                <small style={{ color: '#b5bac1', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                  💡 Tip: Connect a STRING output to override this text
                </small>
              </div>
              <div className="config-field">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfigChange('ephemeral', !data.config.ephemeral);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', userSelect: 'none' }}
                >
                  <input
                    type="checkbox"
                    checked={data.config.ephemeral || false}
                    onChange={() => {}}
                    readOnly
                    style={{ pointerEvents: 'none', marginRight: '8px' }}
                  />
                  <span>Private Message (only visible to command user)</span>
                </div>
              </div>
            </>
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
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
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
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
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
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <input
                    type="color"
                    value={data.config.color || '#5865f2'}
                    onChange={(e) => handleConfigChange('color', e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
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
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="config-field">
                <label>Author Icon URL</label>
                <input
                  type="text"
                  value={data.config.authorIcon || ''}
                  onChange={(e) => handleConfigChange('authorIcon', e.target.value)}
                  placeholder="https://..."
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="config-field">
                <label>Author URL</label>
                <input
                  type="text"
                  value={data.config.authorUrl || ''}
                  onChange={(e) => handleConfigChange('authorUrl', e.target.value)}
                  placeholder="https://..."
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="config-field">
                <label>Thumbnail URL</label>
                <input
                  type="text"
                  value={data.config.thumbnail || ''}
                  onChange={(e) => handleConfigChange('thumbnail', e.target.value)}
                  placeholder="https://..."
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="config-field">
                <label>Image URL</label>
                <input
                  type="text"
                  value={data.config.image || ''}
                  onChange={(e) => handleConfigChange('image', e.target.value)}
                  placeholder="https://..."
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="config-field">
                <label>URL</label>
                <input
                  type="text"
                  value={data.config.url || ''}
                  onChange={(e) => handleConfigChange('url', e.target.value)}
                  placeholder="https://..."
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="config-field">
                <label>Footer</label>
                <input
                  type="text"
                  value={data.config.footer || ''}
                  onChange={(e) => handleConfigChange('footer', e.target.value)}
                  placeholder="Footer text"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="config-field">
                <label>Footer Icon URL</label>
                <input
                  type="text"
                  value={data.config.footerIcon || ''}
                  onChange={(e) => handleConfigChange('footerIcon', e.target.value)}
                  placeholder="https://..."
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="config-field">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfigChange('timestamp', !data.config.timestamp);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', userSelect: 'none' }}
                >
                  <input
                    type="checkbox"
                    checked={data.config.timestamp || false}
                    onChange={() => {}}
                    readOnly
                    style={{ pointerEvents: 'none', marginRight: '8px' }}
                  />
                  <span>Show Timestamp</span>
                </div>
              </div>

              <div className="config-field">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfigChange('ephemeral', !data.config.ephemeral);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', userSelect: 'none' }}
                >
                  <input
                    type="checkbox"
                    checked={data.config.ephemeral || false}
                    onChange={() => {}}
                    readOnly
                    style={{ pointerEvents: 'none', marginRight: '8px' }}
                  />
                  <span>Private Message (only visible to command user)</span>
                </div>
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
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => updateEmbedField(index, 'value', e.target.value)}
                      placeholder="Field value"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div
                      className="inline-checkbox"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateEmbedField(index, 'inline', !field.inline);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', userSelect: 'none' }}
                    >
                      <input
                        type="checkbox"
                        checked={field.inline || false}
                        onChange={() => {}}
                        readOnly
                        style={{ pointerEvents: 'none', marginRight: '4px' }}
                      />
                      <span>Inline</span>
                    </div>
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
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              />
              <small style={{ color: '#b5bac1', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                💡 Right-click role → Copy ID (Developer Mode must be enabled)
              </small>
            </div>
          )}

          {data.actionType === 'send-dm' && (
            <>
              <div className="config-field">
                <label>DM Content</label>
                <textarea
                  value={data.config.content || ''}
                  onChange={(e) => handleConfigChange('content', e.target.value)}
                  placeholder="Type DM message here, or connect a STRING input..."
                  rows={3}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
                <small style={{ color: '#b5bac1', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                  💡 Connect USER input to send DM to specific user
                </small>
              </div>
            </>
          )}

          {data.actionType === 'react-emoji' && (
            <div className="config-field">
              <label>Emoji</label>
              <input
                type="text"
                value={data.config.emoji || ''}
                onChange={(e) => handleConfigChange('emoji', e.target.value)}
                placeholder="👍 or emoji ID"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              />
              <small style={{ color: '#b5bac1', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                💡 Use emoji or custom emoji ID (right-click emoji → Copy ID)
              </small>
            </div>
          )}

          {data.actionType === 'timeout-member' && (
            <>
              <div className="config-field">
                <label>Duration (seconds)</label>
                <input
                  type="number"
                  value={data.config.duration || 60}
                  onChange={(e) => handleConfigChange('duration', parseInt(e.target.value))}
                  placeholder="60"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
                <small style={{ color: '#b5bac1', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                  ⏱️ Timeout duration in seconds (max: 2419200 = 28 days)
                </small>
              </div>
              <div className="config-field">
                <label>Reason (optional)</label>
                <input
                  type="text"
                  value={data.config.reason || ''}
                  onChange={(e) => handleConfigChange('reason', e.target.value)}
                  placeholder="Reason for timeout"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
                <small style={{ color: '#b5bac1', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                  💡 Connect USER input to timeout specific user, or uses command user by default
                </small>
              </div>
            </>
          )}

          {(data.actionType === 'kick-member' || data.actionType === 'ban-member') && (
            <div className="config-field">
              <label>Reason (optional)</label>
              <input
                type="text"
                value={data.config.reason || ''}
                onChange={(e) => handleConfigChange('reason', e.target.value)}
                placeholder="Reason for action"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              />
              <small style={{ color: '#b5bac1', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                💡 Connect USER input to {data.actionType === 'kick-member' ? 'kick' : 'ban'} specific user
              </small>
            </div>
          )}

          {data.actionType === 'unban-member' && (
            <div className="config-field">
              <label>User ID</label>
              <input
                type="text"
                value={data.config.userId || ''}
                onChange={(e) => handleConfigChange('userId', e.target.value)}
                placeholder="123456789012345678"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              />
              <small style={{ color: '#b5bac1', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                💡 Enter the Discord user ID to unban
              </small>
            </div>
          )}

          {data.actionType === 'create-thread' && (
            <div className="config-field">
              <label>Thread Name</label>
              <input
                type="text"
                value={data.config.name || ''}
                onChange={(e) => handleConfigChange('name', e.target.value)}
                placeholder="New Thread"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              />
              <small style={{ color: '#b5bac1', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                💡 Connect STRING input to set thread name dynamically
              </small>
            </div>
          )}

          {data.actionType === 'branch' && (
            <div className="config-field">
              <p style={{ color: '#b5bac1', fontSize: '12px', margin: 0 }}>
                💡 Connect a BOOLEAN input to the "condition" handle. The flow will split:
                <br/>• <strong style={{color: '#57f287'}}>True output</strong> executes if condition is true
                <br/>• <strong style={{color: '#ed4245'}}>False output</strong> executes if condition is false
              </p>
            </div>
          )}

          {data.actionType === 'save-file-to-server' && (
            <>
              <div className="config-field">
                <label>Filename</label>
                <input
                  type="text"
                  value={data.config.filename || ''}
                  onChange={(e) => handleConfigChange('filename', e.target.value)}
                  placeholder="file.txt"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
                <small style={{ color: '#b5bac1', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                  💡 Connect STRING inputs to set filename and content dynamically
                </small>
              </div>
            </>
          )}

          {data.actionType === 'save-attachment-to-server' && (
            <div className="config-field">
              <label>Filename (optional)</label>
              <input
                type="text"
                value={data.config.filename || ''}
                onChange={(e) => handleConfigChange('filename', e.target.value)}
                placeholder="Leave empty to use original filename"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              />
              <small style={{ color: '#b5bac1', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                💡 Connect ATTACHMENT input to save uploaded file
              </small>
            </div>
          )}

          {(data.actionType === 'set-variable-global' ||
            data.actionType === 'set-variable-server' ||
            data.actionType === 'set-variable-user') && (
            <>
              <div className="config-field">
                <label>Variable Key</label>
                <input
                  type="text"
                  value={data.config.key || ''}
                  onChange={(e) => handleConfigChange('key', e.target.value)}
                  placeholder="myVariable"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="config-field">
                <label>Value</label>
                <input
                  type="text"
                  value={data.config.value || ''}
                  onChange={(e) => handleConfigChange('value', e.target.value)}
                  placeholder="value"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
                <small style={{ color: '#b5bac1', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                  💡 Connect STRING inputs to set key and value dynamically
                </small>
              </div>
            </>
          )}
        </div>
      )}

      {/* Output handles - single or multiple based on action type */}
      {data.outputs && data.outputs.length > 0 ? (
        // Multiple outputs (like Branch node or error handling)
        <div className="action-node-outputs">
          {data.outputs.map((output, index) => (
            <Handle
              key={output.id}
              type="source"
              position={Position.Right}
              id={output.id}
              style={{
                background:
                  output.id === 'true' ? '#57f287' :
                  output.id === 'false' ? '#ed4245' :
                  output.id === 'fail' ? '#ed4245' :
                  DATA_TYPES.FLOW.color,
                width: 12,
                height: 12,
                right: '-6px',
                top: `${50 + index * 20}%`,
                border: '2px solid #2b2d31',
              }}
              title={output.label || output.id}
            />
          ))}
        </div>
      ) : (
        // Single output (default)
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
      )}
    </div>
  );
};

export default memo(ActionNode);
