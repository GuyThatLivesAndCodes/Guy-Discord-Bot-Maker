import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import './DataNode.css';
import { DATA_TYPES } from '../constants/dataTypes';

const DataNode = ({ id, data }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleConfigChange = (field, value) => {
    if (data.onUpdate) {
      const newConfig = { ...data.config, [field]: value };
      data.onUpdate(id, newConfig);
    }
  };

  const hasConfig = data.config !== undefined;

  return (
    <div className="data-node" style={{ borderColor: data.color }}>
      <div className="data-node-header" style={{ background: data.color }}>
        <span className="data-node-icon">{data.icon}</span>
        <span className="data-node-label">{data.label}</span>
        {hasConfig && (
          <button
            className="data-node-expand"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              marginLeft: 'auto',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '12px'
            }}
          >
            {isExpanded ? '−' : '+'}
          </button>
        )}
      </div>

      {isExpanded && hasConfig && (
        <div className="data-node-config" style={{ padding: '10px', background: '#1e1e1e' }}>
          {data.nodeType === 'static-boolean' && (
            <label style={{ display: 'flex', alignItems: 'center', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={data.config.value || false}
                onChange={(e) => handleConfigChange('value', e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              {data.config.value ? 'True' : 'False'}
            </label>
          )}

          {data.nodeType === 'static-number' && (
            <input
              type="number"
              value={data.config.value || 0}
              onChange={(e) => handleConfigChange('value', parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '6px',
                background: '#2b2d31',
                border: '1px solid #383a40',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '12px'
              }}
            />
          )}

          {data.nodeType === 'static-string' && (
            <textarea
              value={data.config.value || ''}
              onChange={(e) => handleConfigChange('value', e.target.value)}
              placeholder="Enter text..."
              rows={3}
              style={{
                width: '100%',
                padding: '6px',
                background: '#2b2d31',
                border: '1px solid #383a40',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '12px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          )}
        </div>
      )}

      <div className="data-node-body">
        {data.inputs?.map((input, index) => (
          <div key={input.id} className="data-input">
            <Handle
              type="target"
              position={Position.Left}
              id={input.id}
              style={{
                background: DATA_TYPES[input.type]?.color || '#5865f2',
                width: 12,
                height: 12,
                left: '-6px',
                border: '2px solid #2b2d31',
              }}
            />
            <span className="input-label" style={{ color: DATA_TYPES[input.type]?.color }}>
              {input.type}
            </span>
          </div>
        ))}

        {data.outputs?.map((output, index) => (
          <div key={output.id} className="data-output">
            <span className="output-label" style={{ color: DATA_TYPES[output.type]?.color }}>
              {output.type}
            </span>
            <Handle
              type="source"
              position={Position.Right}
              id={output.id}
              style={{
                background: DATA_TYPES[output.type]?.color || '#5865f2',
                width: 12,
                height: 12,
                right: '-6px',
                border: '2px solid #2b2d31',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(DataNode);
