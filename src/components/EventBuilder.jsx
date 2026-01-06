import React, { useState } from 'react';
import FlowEventEditor from './FlowEventEditor';
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
    type: 'responsive-trigger',
    label: 'Event Trigger',
    icon: '🎯',
    description: 'Discord event triggers (user join/leave, message delete, etc.) - Coming Soon',
    available: false,
  },
];

function EventBuilder({ events, onAddEvent, onUpdateEvent, onDeleteEvent }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [showFlowEditor, setShowFlowEditor] = useState(false);
  const [showEventTypeSelector, setShowEventTypeSelector] = useState(false);

  const handleSave = (event) => {
    if (editingIndex !== null) {
      onUpdateEvent(editingIndex, event);
      setEditingIndex(null);
    } else {
      onAddEvent(event);
    }
    setShowFlowEditor(false);
  };

  const handleClose = () => {
    setEditingIndex(null);
    setShowFlowEditor(false);
    setShowEventTypeSelector(false);
  };

  const handleSelectEventType = (eventType) => {
    if (!eventType.available) {
      return;
    }
    setShowEventTypeSelector(false);
    setShowFlowEditor(true);
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setShowFlowEditor(true);
  };

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
        <FlowEventEditor
          event={editingIndex !== null ? events[editingIndex] : null}
          onSave={handleSave}
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
