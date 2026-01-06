import React, { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import './EventBuilder.css';

const ITEM_TYPES = {
  ACTION: 'action',
};

// Event types
const EVENT_TYPES = [
  {
    type: 'command',
    label: 'Command',
    icon: '⚡',
    description: 'Triggered when a user runs a slash command',
    available: true,
  },
  {
    type: 'responsive-trigger',
    label: 'Responsive Trigger',
    icon: '🤖',
    description: 'AI-powered response triggers (Coming Soon)',
    available: false,
  },
];

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

function ActionBlock({ action }) {
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

function EventActionItem({ action, index, onRemove, onUpdate }) {
  const blockDef = ACTION_BLOCKS.find((b) => b.type === action.type);

  return (
    <div className="event-action-item" style={{ borderLeft: `4px solid ${blockDef?.color || '#5865f2'}` }}>
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

function EventEditor({ event, onSave, onCancel }) {
  const [localEvent, setLocalEvent] = useState(
    event || { type: 'command', name: '', description: '', actions: [] }
  );

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ITEM_TYPES.ACTION,
    drop: (item) => {
      const newAction = { ...item.action.defaultConfig, type: item.action.type };
      setLocalEvent((prev) => ({
        ...prev,
        actions: [...prev.actions, newAction],
      }));
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const removeAction = (index) => {
    setLocalEvent((prev) => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index),
    }));
  };

  const updateAction = (index, newAction) => {
    setLocalEvent((prev) => ({
      ...prev,
      actions: prev.actions.map((a, i) => (i === index ? newAction : a)),
    }));
  };

  const handleSave = () => {
    if (localEvent.type === 'command' && !localEvent.name) {
      alert('Please enter a command name');
      return;
    }
    onSave(localEvent);
  };

  const eventTypeDef = EVENT_TYPES.find((et) => et.type === localEvent.type);

  return (
    <div className="event-editor">
      <div className="editor-header">
        <h3>{event ? 'Edit Event' : 'Create New Event'}</h3>
        <div className="editor-actions">
          <button onClick={onCancel} className="secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="primary">
            Save Event
          </button>
        </div>
      </div>

      <div className="editor-content">
        <div className="editor-left">
          <div className="form-group">
            <label>Event Type</label>
            <div className="event-type-badge">
              <span className="event-icon">{eventTypeDef?.icon}</span>
              <span>{eventTypeDef?.label}</span>
            </div>
            <small>{eventTypeDef?.description}</small>
          </div>

          {localEvent.type === 'command' && (
            <>
              <div className="form-group">
                <label>Command Name *</label>
                <input
                  type="text"
                  value={localEvent.name}
                  onChange={(e) => setLocalEvent({ ...localEvent, name: e.target.value })}
                  placeholder="e.g., hello, info, help"
                />
                <small>No spaces or special characters. Use lowercase.</small>
              </div>

              <div className="form-group">
                <label>Command Description</label>
                <input
                  type="text"
                  value={localEvent.description || ''}
                  onChange={(e) => setLocalEvent({ ...localEvent, description: e.target.value })}
                  placeholder="What does this command do?"
                />
              </div>
            </>
          )}

          <div className="actions-palette">
            <h4>Available Actions</h4>
            <p className="palette-description">Drag actions below into the drop zone to build your event</p>
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
              localEvent.actions.length === 0 ? 'empty' : ''
            }`}
          >
            {localEvent.actions.length === 0 ? (
              <div className="dropzone-placeholder">
                <div className="placeholder-icon">🎯</div>
                <p>Drag and drop actions here</p>
                <small>Build your event by adding actions from the left</small>
              </div>
            ) : (
              <div className="actions-list">
                <h4>Event Actions ({localEvent.actions.length})</h4>
                {localEvent.actions.map((action, index) => (
                  <EventActionItem
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

function EventBuilder({ events, onAddEvent, onUpdateEvent, onDeleteEvent }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showEventTypeSelector, setShowEventTypeSelector] = useState(false);

  const handleSave = (event) => {
    if (editingIndex !== null) {
      onUpdateEvent(editingIndex, event);
      setEditingIndex(null);
    } else {
      onAddEvent(event);
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setIsCreating(false);
    setShowEventTypeSelector(false);
  };

  const handleSelectEventType = (eventType) => {
    if (!eventType.available) {
      return;
    }
    setShowEventTypeSelector(false);
    setIsCreating(true);
  };

  if (isCreating || editingIndex !== null) {
    const event = editingIndex !== null ? events[editingIndex] : null;
    return <EventEditor event={event} onSave={handleSave} onCancel={handleCancel} />;
  }

  if (showEventTypeSelector) {
    return (
      <div className="event-type-selector">
        <div className="selector-header">
          <h2>Choose Event Type</h2>
          <button onClick={handleCancel} className="secondary">
            Cancel
          </button>
        </div>
        <div className="event-types-grid">
          {EVENT_TYPES.map((eventType) => (
            <div
              key={eventType.type}
              className={`event-type-card ${!eventType.available ? 'disabled' : ''}`}
              onClick={() => handleSelectEventType(eventType)}
            >
              <div className="event-type-icon">{eventType.icon}</div>
              <h3>{eventType.label}</h3>
              <p>{eventType.description}</p>
              {!eventType.available && <div className="coming-soon-badge">Coming Soon</div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="event-builder">
      <div className="builder-header">
        <div>
          <h2>Event Builder</h2>
          <p>Create and manage your bot's events using drag-and-drop actions</p>
        </div>
        <button onClick={() => setShowEventTypeSelector(true)} className="primary">
          + New Event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No Events Yet</h3>
          <p>Create your first event to get started!</p>
          <button onClick={() => setShowEventTypeSelector(true)} className="primary">
            Create First Event
          </button>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event, index) => {
            const eventTypeDef = EVENT_TYPES.find((et) => et.type === event.type);
            return (
              <div key={index} className="event-card">
                <div className="event-card-header">
                  <div className="event-type-badge">
                    <span className="event-icon">{eventTypeDef?.icon}</span>
                    <span className="event-type-label">{eventTypeDef?.label}</span>
                  </div>
                  <div className="event-actions">
                    <button onClick={() => setEditingIndex(index)} className="secondary" title="Edit event">
                      ✏️
                    </button>
                    <button onClick={() => onDeleteEvent(index)} className="danger" title="Delete event">
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="event-card-body">
                  {event.type === 'command' && <div className="event-name">/{event.name}</div>}
                  <p className="event-description">{event.description || 'No description'}</p>
                  <div className="event-stats">
                    <span className="stat">
                      <span className="stat-icon">⚡</span>
                      {event.actions?.length || 0} actions
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default EventBuilder;
