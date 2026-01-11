import React, { useState } from 'react';
import BlueprintCanvas from './BlueprintCanvas';
import './EventBuilder.css';

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
    type: 'event',
    label: 'Event Trigger',
    icon: '🎯',
    description: 'Triggered by Discord events (message, member join, reactions, etc.)',
    available: true,
  },
  {
    type: 'anti-hack',
    label: 'Anti-Hack',
    icon: '🛡️',
    description: 'Detect and prevent hacked clients, spam, and suspicious behavior',
    available: true,
  },
];

// Event modes
const EVENT_MODES = [
  {
    mode: 'basic',
    label: 'Basic Event',
    icon: '🎯',
    description: 'Simple blueprint system with essential nodes. Perfect for getting started!',
    available: true,
  },
  {
    mode: 'advanced',
    label: 'Advanced Event',
    icon: '🚀',
    description: 'Full-featured system with all nodes, variables, and advanced features.',
    available: false,
  },
];

function EventBuilder({ events, onAddEvent, onUpdateEvent, onDeleteEvent }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [showFlowEditor, setShowFlowEditor] = useState(false);
  const [showEventTypeSelector, setShowEventTypeSelector] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showEventConfig, setShowEventConfig] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState(null);
  const [selectedMode, setSelectedMode] = useState('basic');
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventTriggerType, setEventTriggerType] = useState('messageCreate');

  const handleSave = (event) => {
    if (editingIndex !== null) {
      onUpdateEvent(editingIndex, event);
      setEditingIndex(null);
    } else {
      onAddEvent(event);
    }
    setShowFlowEditor(false);
    setShowModeSelector(false);
    setShowEventConfig(false);
    setSelectedEventType(null);
    setSelectedMode('basic');
    setEventName('');
    setEventDescription('');
    setEventTriggerType('messageCreate');
  };

  const handleClose = () => {
    setEditingIndex(null);
    setShowFlowEditor(false);
    setShowEventTypeSelector(false);
    setShowModeSelector(false);
    setShowEventConfig(false);
    setSelectedEventType(null);
    setSelectedMode('basic');
    setEventName('');
    setEventDescription('');
    setEventTriggerType('messageCreate');
  };

  const handleSelectEventType = (eventType) => {
    if (!eventType.available) {
      return;
    }
    setSelectedEventType(eventType.type);
    setShowEventTypeSelector(false);
    setShowModeSelector(true); // Show mode selector next
  };

  const handleSelectMode = (mode) => {
    if (!mode.available) {
      return;
    }
    setSelectedMode(mode.mode);
    setShowModeSelector(false);
    setShowEventConfig(true); // Show config form next
  };

  const handleConfigComplete = () => {
    // Validate name
    if (selectedEventType === 'command' && !eventName.trim()) {
      alert('Please enter a command name');
      return;
    }
    if (selectedEventType === 'event' && !eventName.trim()) {
      alert('Please enter an event name');
      return;
    }

    setShowEventConfig(false);
    setShowFlowEditor(true);
  };

  const handleEdit = (index) => {
    const event = events[index];
    setEditingIndex(index);
    setSelectedEventType(event.type);
    setEventName(event.name || '');
    setEventDescription(event.description || '');
    setEventTriggerType(event.triggerType || 'messageCreate');
    setShowFlowEditor(true);
  };

  // Event configuration screen
  if (showEventConfig) {
    return (
      <div className="event-type-selector">
        <div className="selector-header">
          <h2>Configure Event</h2>
          <button onClick={handleClose} className="secondary">
            Cancel
          </button>
        </div>
        <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#fff' }}>
              {selectedEventType === 'command' ? 'Command Name' : 'Event Name'}
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              placeholder={selectedEventType === 'command' ? 'hello' : 'My Custom Event'}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '2px solid #444',
                borderRadius: '8px',
                background: '#2b2b2b',
                color: '#fff',
              }}
            />
            {selectedEventType === 'command' && (
              <p style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
                Command will be: /{eventName || 'yourcommand'}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#fff' }}>
              Description
            </label>
            <textarea
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="What does this event do?"
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '2px solid #444',
                borderRadius: '8px',
                background: '#2b2b2b',
                color: '#fff',
                resize: 'vertical',
              }}
            />
          </div>

          {selectedEventType === 'event' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#fff' }}>
                Trigger Type
              </label>
              <select
                value={eventTriggerType}
                onChange={(e) => setEventTriggerType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: '2px solid #444',
                  borderRadius: '8px',
                  background: '#2b2b2b',
                  color: '#fff',
                }}
              >
                <option value="messageCreate">Message Created</option>
                <option value="messageDelete">Message Deleted</option>
                <option value="guildMemberAdd">Member Joined</option>
                <option value="guildMemberRemove">Member Left</option>
                <option value="messageReactionAdd">Reaction Added</option>
                <option value="voiceStateUpdate">Voice State Changed</option>
              </select>
            </div>
          )}

          <button
            onClick={handleConfigComplete}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: 'bold',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Continue to Blueprint Editor →
          </button>
        </div>
      </div>
    );
  }

  // Mode selector screen
  if (showModeSelector) {
    return (
      <div className="event-type-selector">
        <div className="selector-header">
          <h2>Choose Event Mode</h2>
          <button onClick={handleClose} className="secondary">
            Cancel
          </button>
        </div>
        <div className="event-types-grid">
          {EVENT_MODES.map((mode) => (
            <div
              key={mode.mode}
              className={`event-type-card ${!mode.available ? 'disabled' : ''}`}
              onClick={() => handleSelectMode(mode)}
            >
              <div className="event-type-icon">{mode.icon}</div>
              <h3>{mode.label}</h3>
              <p>{mode.description}</p>
              {!mode.available && <div className="coming-soon-badge">Coming Soon</div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Event type selector screen
  if (showEventTypeSelector) {
    return (
      <div className="event-type-selector">
        <div className="selector-header">
          <h2>Choose Event Type</h2>
          <button onClick={handleClose} className="secondary">
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
      {showFlowEditor && (
        <BlueprintCanvas
          initialNodes={editingIndex !== null ? events[editingIndex]?.flowData?.nodes || [] : []}
          initialEdges={editingIndex !== null ? events[editingIndex]?.flowData?.edges || [] : []}
          onSave={(flowData) => {
            const event = editingIndex !== null ? events[editingIndex] : {
              type: selectedEventType,
              name: eventName,
              description: eventDescription,
              triggerType: selectedEventType === 'event' ? eventTriggerType : undefined,
              flowData: { nodes: [], edges: [] }
            };
            handleSave({ ...event, flowData });
          }}
          onClose={handleClose}
        />
      )}

      <div className="builder-header">
        <div>
          <h2>Event Builder</h2>
          <p>Create and manage your bot's events using the visual graph editor</p>
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
            const nodeCount = event.flowData?.nodes?.length || 0;
            const connectionCount = event.flowData?.edges?.length || 0;

            return (
              <div key={index} className="event-card">
                <div className="event-card-header">
                  <div className="event-type-badge">
                    <span className="event-icon">{eventTypeDef?.icon}</span>
                    <span className="event-type-label">{eventTypeDef?.label}</span>
                  </div>
                  <div className="event-actions">
                    <button onClick={() => handleEdit(index)} className="secondary" title="Edit event">
                      ✏️
                    </button>
                    <button onClick={() => onDeleteEvent(index)} className="danger" title="Delete event">
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="event-card-body">
                  {event.type === 'command' && <div className="event-name">/{event.name}</div>}
                  {event.type === 'event' && <div className="event-name">{event.triggerType || 'Event'}</div>}
                  {event.type === 'anti-hack' && <div className="event-name">🛡️ {event.triggerType || 'Anti-Hack'}</div>}
                  <p className="event-description">{event.description || 'No description'}</p>
                  <div className="event-stats">
                    <span className="stat">
                      <span className="stat-icon">🔷</span>
                      {nodeCount} nodes
                    </span>
                    <span className="stat">
                      <span className="stat-icon">🔗</span>
                      {connectionCount} connections
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
