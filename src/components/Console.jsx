import React, { useEffect, useRef } from 'react';
import './Console.css';

function Console({ logs, onClear }) {
  const consoleEndRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLogIcon = (type) => {
    switch (type) {
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="console">
      <div className="console-header">
        <div className="console-title">
          <span className="console-icon">▶</span>
          Console
        </div>
        <button onClick={onClear} className="secondary" title="Clear console">
          Clear
        </button>
      </div>
      <div className="console-content">
        {logs.length === 0 ? (
          <div className="console-empty">
            No logs yet. Start your bot to see activity here.
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`console-log log-${log.type}`}>
              <span className="log-icon">{getLogIcon(log.type)}</span>
              <span className="log-time">{formatTime(log.timestamp)}</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))
        )}
        <div ref={consoleEndRef} />
      </div>
    </div>
  );
}

export default Console;
