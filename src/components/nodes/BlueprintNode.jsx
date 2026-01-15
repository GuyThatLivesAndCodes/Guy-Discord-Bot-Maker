import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { CategoryColors } from '../../constants/nodeDefinitions';
import { getPinColor } from '../../constants/pinTypes';

/**
 * UE5 Blueprint-Style Node Component
 * Renders nodes with proper input/output pins, colored by category
 */
const BlueprintNode = ({ data, selected }) => {
  const [collapsed, setCollapsed] = useState(false);

  const {
    label,
    icon,
    category,
    execInputs = [],
    execOutputs = [],
    dataInputs = [],
    dataOutputs = [],
    config = {},
    onConfigChange,
  } = data;

  const headerColor = CategoryColors[category] || '#7f8c8d';
  const hasExecFlow = execInputs.length > 0 || execOutputs.length > 0;

  // Pin size constants
  const PIN_SIZE = 12;
  const PIN_BORDER = 2;

  return (
    <div
      className="blueprint-node"
      style={{
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: selected
          ? '0 0 0 3px #faa61a, 0 8px 24px rgba(0,0,0,0.5), 0 0 60px rgba(250,166,26,0.3)'
          : '0 4px 16px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)',
        transition: 'all 0.2s ease',
        minWidth: '200px',
        background: 'linear-gradient(135deg, #2b2b2b 0%, #252525 100%)',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        border: selected ? 'none' : '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: headerColor,
          color: 'white',
          padding: '8px 12px',
          fontWeight: 'bold',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {icon && <span style={{ fontSize: '16px' }}>{icon}</span>}
          <span>{label}</span>
        </div>
        {(dataInputs.length > 0 || dataOutputs.length > 0) && (
          <span style={{ fontSize: '10px', opacity: 0.8 }}>
            {collapsed ? '▼' : '▲'}
          </span>
        )}
      </div>

      {/* Body */}
      {!collapsed && (
        <div
          style={{
            background: '#3a3a3a',
            padding: '12px 8px',
            minHeight: '40px',
          }}
        >
          {/* Execution Inputs */}
          {execInputs.map((pin, index) => (
            <div
              key={`exec-in-${pin.id}`}
              style={{
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              <Handle
                type="target"
                position={Position.Left}
                id={`exec-in-${pin.id}`}
                style={{
                  width: `${PIN_SIZE}px`,
                  height: `${PIN_SIZE}px`,
                  background: '#FFFFFF',
                  border: `${PIN_BORDER}px solid #1a1a1a`,
                  borderRadius: '50%',
                  left: `-${PIN_SIZE / 2 + 2}px`,
                  boxShadow: '0 0 8px rgba(255,255,255,0.5), inset 0 0 4px rgba(0,0,0,0.3)',
                  transition: 'all 0.2s ease',
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  color: '#FFFFFF',
                  marginLeft: '8px',
                  fontWeight: 'bold',
                }}
              >
                ▶ {pin.label}
              </span>
            </div>
          ))}

          {/* Data Inputs */}
          {dataInputs.map((pin, index) => (
            <div
              key={`data-in-${pin.id}`}
              style={{
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              <Handle
                type="target"
                position={Position.Left}
                id={`data-in-${pin.id}`}
                style={{
                  width: `${PIN_SIZE}px`,
                  height: `${PIN_SIZE}px`,
                  background: getPinColor(pin.type),
                  border: `${PIN_BORDER}px solid #1a1a1a`,
                  borderRadius: '50%',
                  left: `-${PIN_SIZE / 2 + 2}px`,
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  color: getPinColor(pin.type),
                  marginLeft: '8px',
                }}
              >
                {pin.label}
                {pin.optional && <span style={{ opacity: 0.5 }}> (opt)</span>}
              </span>
            </div>
          ))}

          {/* Configuration UI (for constant nodes, etc.) */}
          {data.hasConfig && onConfigChange && (
            <div style={{ margin: '8px 0', padding: '8px', background: '#2b2b2b', borderRadius: '4px' }}>
              {Object.keys(data.defaultConfig || {}).map((key) => {
                // Special handling for AI config selector
                if (key === 'aiConfigId') {
                  const aiConfigs = data.aiConfigs || [];
                  const hasNoAI = aiConfigs.length === 0;

                  return (
                    <div key={key} style={{ marginBottom: '6px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '10px',
                        color: '#aaa',
                        marginBottom: '2px',
                        fontWeight: 'bold'
                      }}>
                        AI Configuration
                      </label>
                      {hasNoAI ? (
                        <div style={{
                          padding: '8px',
                          background: '#3a2a2a',
                          border: '1px solid #ff6b6b',
                          borderRadius: '4px',
                          fontSize: '10px',
                          color: '#ff6b6b'
                        }}>
                          ⚠️ No AI configured. Go to AI tab to add one.
                        </div>
                      ) : (
                        <select
                          value={config[key] || ''}
                          onChange={(e) => {
                            onConfigChange({ ...config, [key]: e.target.value });
                          }}
                          style={{
                            width: '100%',
                            padding: '4px 8px',
                            background: '#1a1a1a',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '11px',
                          }}
                        >
                          <option value="">Select AI...</option>
                          {aiConfigs.map((ai) => (
                            <option key={ai.id} value={ai.id}>
                              {ai.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                }

                const isCheckbox = typeof config[key] === 'boolean' || typeof data.defaultConfig[key] === 'boolean';
                const fieldLabel = key === 'commandName' ? 'Command' :
                                 key === 'commandDescription' ? 'Cmd Description' :
                                 key === 'optionName' ? 'Option Name' :
                                 key === 'description' ? 'Description' :
                                 key === 'required' ? 'Required?' :
                                 key === 'value' ? 'Value' :
                                 key === 'messageCount' ? 'Message Count' : key;

                return (
                  <div key={key} style={{ marginBottom: '6px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '10px',
                      color: '#aaa',
                      marginBottom: '2px',
                      fontWeight: 'bold'
                    }}>
                      {fieldLabel}
                    </label>
                    {isCheckbox ? (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={config[key] ?? data.defaultConfig[key]}
                          onChange={(e) => {
                            onConfigChange({ ...config, [key]: e.target.checked });
                          }}
                          style={{
                            cursor: 'pointer',
                          }}
                        />
                        <span style={{ fontSize: '11px', color: '#fff' }}>
                          {config[key] ?? data.defaultConfig[key] ? 'Yes' : 'No'}
                        </span>
                      </label>
                    ) : (
                      <input
                        type={typeof config[key] === 'number' || typeof data.defaultConfig[key] === 'number' ? 'number' : 'text'}
                        value={config[key] ?? data.defaultConfig[key]}
                        onChange={(e) => {
                          const value = typeof config[key] === 'number' || typeof data.defaultConfig[key] === 'number'
                            ? parseFloat(e.target.value) || 0
                            : e.target.value;
                          onConfigChange({ ...config, [key]: value });
                        }}
                        placeholder={fieldLabel}
                        style={{
                          width: '100%',
                          padding: '4px 8px',
                          background: '#1a1a1a',
                          border: '1px solid #555',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Data Outputs */}
          {dataOutputs.map((pin, index) => (
            <div
              key={`data-out-${pin.id}`}
              style={{
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                position: 'relative',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  color: getPinColor(pin.type),
                  marginRight: '8px',
                }}
              >
                {pin.label}
              </span>
              <Handle
                type="source"
                position={Position.Right}
                id={`data-out-${pin.id}`}
                style={{
                  width: `${PIN_SIZE}px`,
                  height: `${PIN_SIZE}px`,
                  background: getPinColor(pin.type),
                  border: `${PIN_BORDER}px solid #1a1a1a`,
                  borderRadius: '50%',
                  right: `-${PIN_SIZE / 2 + 2}px`,
                }}
              />
            </div>
          ))}

          {/* Execution Outputs */}
          {execOutputs.map((pin, index) => (
            <div
              key={`exec-out-${pin.id}`}
              style={{
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                position: 'relative',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  color: '#FFFFFF',
                  marginRight: '8px',
                  fontWeight: 'bold',
                }}
              >
                {pin.label} ▶
              </span>
              <Handle
                type="source"
                position={Position.Right}
                id={`exec-out-${pin.id}`}
                style={{
                  width: `${PIN_SIZE}px`,
                  height: `${PIN_SIZE}px`,
                  background: '#FFFFFF',
                  border: `${PIN_BORDER}px solid #1a1a1a`,
                  borderRadius: '50%',
                  right: `-${PIN_SIZE / 2 + 2}px`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Collapsed view - just show pins */}
      {collapsed && (
        <div
          style={{
            background: '#3a3a3a',
            padding: '4px 8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            {[...execInputs, ...dataInputs].map((pin, index) => (
              <Handle
                key={`collapsed-in-${pin.id}`}
                type="target"
                position={Position.Left}
                id={pin.id.startsWith('exec-') ? `exec-in-${pin.id}` : `data-in-${pin.id}`}
                style={{
                  width: `${PIN_SIZE}px`,
                  height: `${PIN_SIZE}px`,
                  background: pin.id?.startsWith('exec-') ? '#FFFFFF' : getPinColor(pin.type),
                  border: `${PIN_BORDER}px solid #1a1a1a`,
                  borderRadius: '50%',
                  left: `-${PIN_SIZE / 2 + 2}px`,
                  top: `${20 + index * 15}px`,
                }}
              />
            ))}
          </div>
          <div>
            {[...dataOutputs, ...execOutputs].map((pin, index) => (
              <Handle
                key={`collapsed-out-${pin.id}`}
                type="source"
                position={Position.Right}
                id={pin.id.startsWith('exec-') ? `exec-out-${pin.id}` : `data-out-${pin.id}`}
                style={{
                  width: `${PIN_SIZE}px`,
                  height: `${PIN_SIZE}px`,
                  background: pin.id?.startsWith('exec-') ? '#FFFFFF' : getPinColor(pin.type),
                  border: `${PIN_BORDER}px solid #1a1a1a`,
                  borderRadius: '50%',
                  right: `-${PIN_SIZE / 2 + 2}px`,
                  top: `${20 + index * 15}px`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(BlueprintNode);
