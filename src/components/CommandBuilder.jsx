import React, { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import './CommandBuilder.css';

const ITEM_TYPES = {
  ACTION: 'action',
};

// Available action blocks
const ACTION_BLOCKS = [
  {
    type: 'send-message',
    label: 'Send Message',
    icon: '💬',
    color: '#5865f2',
    defaultConfig: { content: 'Hello, World!' },
  },
  {
    type: 'embed',
    label: 'Send Embed',
    icon: '📋',
    color: '#57f287',
    defaultConfig: { title: 'My Embed', description: 'Embed description', color: '0x5865f2' },
  },
  {
    type: 'add-role',
    label: 'Add Role',
    icon: '🎭',
    color: '#faa81a',
    defaultConfig: { roleId: '' },
  },
];

function ActionBlock({ action, onDragStart }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPES.ACTION,
    item: { action },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className="action-block"
      style={{
        opacity: isDragging ? 0.5 : 1,
        borderLeft: `4px solid ${action.color}`,
      }}
    >
      <span className="action-icon">{action.icon}</span>
      <span className="action-label">{action.label}</span>
    </div>
  );
}

function CommandActionItem({ action, index, onRemove, onUpdate }) {
  const blockDef = ACTION_BLOCKS.find((b) => b.type === action.type);

  return (
    <div className="command-action-item" style={{ borderLeft: `4px solid ${blockDef?.color || '#5865f2'}` }}>
      <div className="action-item-header">
        <span className="action-icon">{blockDef?.icon}</span>
        <span className="action-label">{blockDef?.label}</span>
        <button onClick={() => onRemove(index)} className="remove-action-btn" title="Remove action">
          ×
        </button>
      </div>
      <div className="action-config">
        {action.type === 'send-message' && (
          <div className="form-group">
            <label>Message Content</label>
            <textarea
              value={action.content || ''}
              onChange={(e) => onUpdate(index, { ...action, content: e.target.value })}
              placeholder="Enter message content..."
              rows={3}
            />
          </div>
        )}

        {action.type === 'embed' && (
          <>
            <div className="form-group">
              <label>Embed Title</label>
              <input
                type="text"
                value={action.title || ''}
                onChange={(e) => onUpdate(index, { ...action, title: e.target.value })}
                placeholder="Embed title..."
              />
            </div>
            <div className="form-group">
              <label>Embed Description</label>
              <textarea
                value={action.description || ''}
                onChange={(e) => onUpdate(index, { ...action, description: e.target.value })}
                placeholder="Embed description..."
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Embed Color (hex)</label>
              <input
                type="text"
                value={action.color || '0x5865f2'}
                onChange={(e) => onUpdate(index, { ...action, color: e.target.value })}
                placeholder="0x5865f2"
              />
            </div>
          </>
        )}

        {action.type === 'add-role' && (
          <div className="form-group">
            <label>Role ID</label>
            <input
              type="text"
              value={action.roleId || ''}
              onChange={(e) => onUpdate(index, { ...action, roleId: e.target.value })}
              placeholder="Right-click role → Copy ID"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CommandEditor({ command, onSave, onCancel }) {
  const [localCommand, setLocalCommand] = useState(
    command || { name: '', description: '', actions: [] }
  );

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ITEM_TYPES.ACTION,
    drop: (item) => {
      const newAction = { ...item.action.defaultConfig, type: item.action.type };
      setLocalCommand((prev) => ({
        ...prev,
        actions: [...prev.actions, newAction],
      }));
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const removeAction = (index) => {
    setLocalCommand((prev) => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index),
    }));
  };

  const updateAction = (index, newAction) => {
    setLocalCommand((prev) => ({
      ...prev,
      actions: prev.actions.map((a, i) => (i === index ? newAction : a)),
    }));
  };

  const handleSave = () => {
    if (!localCommand.name) {
      alert('Please enter a command name');
      return;
    }
    onSave(localCommand);
  };

  return (
    <div className="command-editor">
      <div className="editor-header">
        <h3>{command ? 'Edit Command' : 'Create New Command'}</h3>
        <div className="editor-actions">
          <button onClick={onCancel} className="secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="primary">
            Save Command
          </button>
        </div>
      </div>

      <div className="editor-content">
        <div className="editor-left">
          <div className="form-group">
            <label>Command Name *</label>
            <input
              type="text"
              value={localCommand.name}
              onChange={(e) => setLocalCommand({ ...localCommand, name: e.target.value })}
              placeholder="e.g., hello, info, help"
            />
            <small>No spaces or special characters. Use lowercase.</small>
          </div>

          <div className="form-group">
            <label>Command Description</label>
            <input
              type="text"
              value={localCommand.description}
              onChange={(e) => setLocalCommand({ ...localCommand, description: e.target.value })}
              placeholder="What does this command do?"
            />
          </div>

          <div className="actions-palette">
            <h4>Available Actions</h4>
            <p className="palette-description">Drag actions below into the drop zone to build your command</p>
            <div className="action-blocks">
              {ACTION_BLOCKS.map((action, index) => (
                <ActionBlock key={index} action={action} />
              ))}
            </div>
          </div>
        </div>

        <div className="editor-right">
          <div
            ref={drop}
            className={`actions-dropzone ${isOver ? 'dragover' : ''} ${
              localCommand.actions.length === 0 ? 'empty' : ''
            }`}
          >
            {localCommand.actions.length === 0 ? (
              <div className="dropzone-placeholder">
                <div className="placeholder-icon">🎯</div>
                <p>Drag and drop actions here</p>
                <small>Build your command by adding actions from the left</small>
              </div>
            ) : (
              <div className="actions-list">
                <h4>Command Actions ({localCommand.actions.length})</h4>
                {localCommand.actions.map((action, index) => (
                  <CommandActionItem
                    key={index}
                    action={action}
                    index={index}
                    onRemove={removeAction}
                    onUpdate={updateAction}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CommandBuilder({ commands, onAddCommand, onUpdateCommand, onDeleteCommand }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSave = (command) => {
    if (editingIndex !== null) {
      onUpdateCommand(editingIndex, command);
      setEditingIndex(null);
    } else {
      onAddCommand(command);
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setIsCreating(false);
  };

  if (isCreating || editingIndex !== null) {
    const command = editingIndex !== null ? commands[editingIndex] : null;
    return <CommandEditor command={command} onSave={handleSave} onCancel={handleCancel} />;
  }

  return (
    <div className="command-builder">
      <div className="builder-header">
        <div>
          <h2>Command Builder</h2>
          <p>Create and manage your bot's slash commands using drag-and-drop actions</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="primary">
          + New Command
        </button>
      </div>

      {commands.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No Commands Yet</h3>
          <p>Create your first command to get started!</p>
          <button onClick={() => setIsCreating(true)} className="primary">
            Create First Command
          </button>
        </div>
      ) : (
        <div className="commands-grid">
          {commands.map((command, index) => (
            <div key={index} className="command-card">
              <div className="command-card-header">
                <div className="command-name">/{command.name}</div>
                <div className="command-actions">
                  <button onClick={() => setEditingIndex(index)} className="secondary" title="Edit command">
                    ✏️
                  </button>
                  <button onClick={() => onDeleteCommand(index)} className="danger" title="Delete command">
                    🗑️
                  </button>
                </div>
              </div>
              <div className="command-card-body">
                <p className="command-description">{command.description || 'No description'}</p>
                <div className="command-stats">
                  <span className="stat">
                    <span className="stat-icon">⚡</span>
                    {command.actions?.length || 0} actions
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CommandBuilder;
