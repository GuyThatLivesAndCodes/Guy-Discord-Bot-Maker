import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './DataNode.css';

// Data types - duplicated to avoid circular dependency
const DATA_TYPES = {
  FLOW: { color: '#5865f2', label: 'Flow' },
  USER: { color: '#f23f43', label: 'User' },
  CHANNEL: { color: '#43b581', label: 'Channel' },
  GUILD: { color: '#7289da', label: 'Guild' },
  STRING: { color: '#faa61a', label: 'String' },
  NUMBER: { color: '#00aff4', label: 'Number' },
  BOOLEAN: { color: '#ed4245', label: 'Boolean' },
};

const DataNode = ({ id, data }) => {
  return (
    <div className="data-node" style={{ borderColor: data.color }}>
      <div className="data-node-header" style={{ background: data.color }}>
        <span className="data-node-icon">{data.icon}</span>
        <span className="data-node-label">{data.label}</span>
      </div>

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
