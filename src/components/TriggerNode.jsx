import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { DATA_TYPES } from './FlowEventEditor';
import './TriggerNode.css';

const TriggerNode = ({ id, data }) => {
  return (
    <div className="trigger-node" style={{ borderColor: data.color }}>
      <div className="trigger-node-header" style={{ background: data.color }}>
        <span className="trigger-node-icon">{data.icon}</span>
        <span className="trigger-node-label">{data.label}</span>
      </div>

      <div className="trigger-node-outputs">
        {data.outputs?.map((output, index) => (
          <div key={output.id} className="trigger-output">
            <span className="output-label">{output.label}</span>
            <Handle
              type="source"
              position={Position.Right}
              id={output.id}
              style={{
                background: DATA_TYPES[output.type]?.color || '#5865f2',
                width: 12,
                height: 12,
                right: -6,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(TriggerNode);
