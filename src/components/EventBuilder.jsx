import React, { useState } from 'react';
import BlueprintCanvas from './BlueprintCanvas';
import './EventBuilder.css';

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

function EventBuilder({ events, aiConfigs = [], onAddEvent, onUpdateEvent, onDeleteEvent }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [showFlowEditor, setShowFlowEditor] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showEventConfig, setShowEventConfig] = useState(false);
  const [selectedMode, setSelectedMode] = useState('basic');
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [showSettings, setShowSettings] = useState(false);

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
    setSelectedMode('basic');
    setEventName('');
    setEventDescription('');
    setShowSettings(false);
  };

  const handleClose = () => {
    setEditingIndex(null);
    setShowFlowEditor(false);
    setShowModeSelector(false);
    setShowEventConfig(false);
    setSelectedMode('basic');
    setEventName('');
    setEventDescription('');
    setShowSettings(false);
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
    if (!eventName.trim()) {
      alert('Please enter an event name');
      return;
    }

    setShowEventConfig(false);
    setShowFlowEditor(true);
  };

  const handleEdit = (index) => {
    const event = events[index];
    setEditingIndex(index);
    setEventName(event.name || '');
    setEventDescription(event.description || '');
    setShowFlowEditor(true);
  };

  const handleUpdateSettings = () => {
    if (!eventName.trim()) {
      alert('Please enter an event name');
      return;
    }
    setShowSettings(false);
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
              Event Name
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="My Custom Event"
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

  return (
    <div className="event-builder">
      {showFlowEditor && (
        <BlueprintCanvas
          initialNodes={editingIndex !== null ? events[editingIndex]?.flowData?.nodes || [] : []}
          initialEdges={editingIndex !== null ? events[editingIndex]?.flowData?.edges || [] : []}
          eventName={eventName}
          eventDescription={eventDescription}
          aiConfigs={aiConfigs}
          onOpenSettings={() => setShowSettings(true)}
          onSave={(flowData) => {
            const event = editingIndex !== null ? events[editingIndex] : {
              name: eventName,
              description: eventDescription,
              flowData: { nodes: [], edges: [] }
            };
            handleSave({ ...event, flowData });
          }}
          onClose={handleClose}
        />
      )}

      {showSettings && showFlowEditor && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#2b2b2b',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
          }}>
            <h2 style={{ color: '#fff', marginBottom: '20px' }}>Event Settings</h2>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#fff' }}>
                Event Name
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="My Custom Event"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: '2px solid #444',
                  borderRadius: '8px',
                  background: '#1a1a1a',
                  color: '#fff',
                }}
              />
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
                  background: '#1a1a1a',
                  color: '#fff',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleUpdateSettings}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  background: '#555',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="builder-header">
        <div>
          <h2>Event Builder</h2>
          <p>Create and manage your bot's events using the visual graph editor</p>
        </div>
        <button onClick={() => setShowModeSelector(true)} className="primary">
          + New Event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No Events Yet</h3>
          <p>Create your first event to get started!</p>
          <button onClick={() => setShowModeSelector(true)} className="primary">
            Create First Event
          </button>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event, index) => {
            const nodeCount = event.flowData?.nodes?.length || 0;
            const connectionCount = event.flowData?.edges?.length || 0;

            return (
              <div key={index} className="event-card">
                <div className="event-card-header">
                  <div className="event-type-badge">
                    <span className="event-icon">🎯</span>
                    <span className="event-type-label">Custom Event</span>
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
                  <div className="event-name">{event.name}</div>
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
