import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { DATA_TYPES } from './FlowEventEditor';
import './DataNode.css';

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
                width: 10,
                height: 10,
                left: -5,
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
                width: 10,
                height: 10,
                right: -5,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(DataNode);
