import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import Modal from './Modal';
import ActionNodeComponent from './ActionNode';
import TriggerNodeComponent from './TriggerNode';
import DataNodeComponent from './DataNode';
import './FlowEventEditor.css';

const nodeTypes = {
  actionNode: ActionNodeComponent,
  triggerNode: TriggerNodeComponent,
  dataNode: DataNodeComponent,
};

// Data types with colors
export const DATA_TYPES = {
  FLOW: { color: '#5865f2', label: 'Flow' },
  USER: { color: '#f23f43', label: 'User' },
  CHANNEL: { color: '#43b581', label: 'Channel' },
  GUILD: { color: '#7289da', label: 'Guild' },
  STRING: { color: '#faa61a', label: 'String' },
  NUMBER: { color: '#00aff4', label: 'Number' },
  BOOLEAN: { color: '#ed4245', label: 'Boolean' },
};

// Trigger node (auto-added for commands)
const TRIGGER_NODE = {
  type: 'on-command-ran',
  label: 'On Command Ran',
  icon: '⚡',
  color: '#5865f2',
};

// Data converter nodes
const DATA_NODES = [
  {
    type: 'get-user-name',
    label: 'Get User Name',
    icon: '👤',
    color: '#f23f43',
    inputs: [{ id: 'user', type: 'USER' }],
    outputs: [{ id: 'name', type: 'STRING' }],
  },
  {
    type: 'get-user-avatar',
    label: 'Get User Avatar',
    icon: '🖼️',
    color: '#f23f43',
    inputs: [{ id: 'user', type: 'USER' }],
    outputs: [{ id: 'url', type: 'STRING' }],
  },
  {
    type: 'get-user-id',
    label: 'Get User ID',
    icon: '🔢',
    color: '#f23f43',
    inputs: [{ id: 'user', type: 'USER' }],
    outputs: [{ id: 'id', type: 'STRING' }],
  },
  {
    type: 'get-channel-name',
    label: 'Get Channel Name',
    icon: '💬',
    color: '#43b581',
    inputs: [{ id: 'channel', type: 'CHANNEL' }],
    outputs: [{ id: 'name', type: 'STRING' }],
  },
  {
    type: 'get-channel-id',
    label: 'Get Channel ID',
    icon: '🔢',
    color: '#43b581',
    inputs: [{ id: 'channel', type: 'CHANNEL' }],
    outputs: [{ id: 'id', type: 'STRING' }],
  },
  {
    type: 'get-guild-name',
    label: 'Get Guild Name',
    icon: '🏰',
    color: '#7289da',
    inputs: [{ id: 'guild', type: 'GUILD' }],
    outputs: [{ id: 'name', type: 'STRING' }],
  },
  // Utility nodes
  {
    type: 'join-strings',
    label: 'Join Strings',
    icon: '🔗',
    color: '#faa61a',
    inputs: [
      { id: 'string1', type: 'STRING' },
      { id: 'string2', type: 'STRING' },
    ],
    outputs: [{ id: 'result', type: 'STRING' }],
  },
  {
    type: 'number-to-string',
    label: 'Number → String',
    icon: '🔄',
    color: '#00aff4',
    inputs: [{ id: 'number', type: 'NUMBER' }],
    outputs: [{ id: 'string', type: 'STRING' }],
  },
  {
    type: 'add-numbers',
    label: 'Add Numbers',
    icon: '➕',
    color: '#00aff4',
    inputs: [
      { id: 'a', type: 'NUMBER' },
      { id: 'b', type: 'NUMBER' },
    ],
    outputs: [{ id: 'result', type: 'NUMBER' }],
  },
  {
    type: 'subtract-numbers',
    label: 'Subtract Numbers',
    icon: '➖',
    color: '#00aff4',
    inputs: [
      { id: 'a', type: 'NUMBER' },
      { id: 'b', type: 'NUMBER' },
    ],
    outputs: [{ id: 'result', type: 'NUMBER' }],
  },
  {
    type: 'multiply-numbers',
    label: 'Multiply Numbers',
    icon: '✖️',
    color: '#00aff4',
    inputs: [
      { id: 'a', type: 'NUMBER' },
      { id: 'b', type: 'NUMBER' },
    ],
    outputs: [{ id: 'result', type: 'NUMBER' }],
  },
  {
    type: 'divide-numbers',
    label: 'Divide Numbers',
    icon: '➗',
    color: '#00aff4',
    inputs: [
      { id: 'a', type: 'NUMBER' },
      { id: 'b', type: 'NUMBER' },
    ],
    outputs: [{ id: 'result', type: 'NUMBER' }],
  },
  {
    type: 'check-has-role',
    label: 'Check Has Role',
    icon: '✅',
    color: '#ed4245',
    inputs: [
      { id: 'user', type: 'USER' },
      { id: 'roleId', type: 'STRING' },
    ],
    outputs: [{ id: 'result', type: 'BOOLEAN' }],
  },
];

// Action types available
const ACTION_TYPES = [
  {
    type: 'send-message',
    label: 'Send Message',
    icon: '💬',
    color: '#5865f2',
    defaultData: { content: 'Hello, World!', ephemeral: false },
    inputs: [
      { id: 'flow', type: 'FLOW' },
      { id: 'content', type: 'STRING', optional: true },
    ],
  },
  {
    type: 'embed',
    label: 'Send Embed',
    icon: '📋',
    color: '#57f287',
    defaultData: {
      title: 'My Embed',
      description: 'Embed description',
      color: '#5865f2',
      fields: [],
      footer: '',
      footerIcon: '',
      thumbnail: '',
      image: '',
      author: '',
      authorIcon: '',
      authorUrl: '',
      url: '',
      timestamp: false,
      ephemeral: false,
    },
    inputs: [
      { id: 'flow', type: 'FLOW' },
      { id: 'title', type: 'STRING', optional: true },
      { id: 'description', type: 'STRING', optional: true },
      { id: 'author', type: 'STRING', optional: true },
      { id: 'thumbnail', type: 'STRING', optional: true },
      { id: 'image', type: 'STRING', optional: true },
    ],
  },
  {
    type: 'add-role',
    label: 'Add Role',
    icon: '🎭',
    color: '#faa81a',
    defaultData: { roleId: '' },
    inputs: [{ id: 'flow', type: 'FLOW' }],
  },
  {
    type: 'remove-role',
    label: 'Remove Role',
    icon: '👤',
    color: '#ed4245',
    defaultData: { roleId: '' },
    inputs: [{ id: 'flow', type: 'FLOW' }],
  },
  {
    type: 'branch',
    label: 'Branch',
    icon: '🔀',
    color: '#00aff4',
    defaultData: {},
    inputs: [
      { id: 'flow', type: 'FLOW' },
      { id: 'condition', type: 'BOOLEAN' },
    ],
    outputs: [
      { id: 'true', type: 'FLOW', label: 'True' },
      { id: 'false', type: 'FLOW', label: 'False' },
    ],
  },
];

function FlowEventEditor({ event, onSave, onClose }) {
  const [eventConfig, setEventConfig] = useState(
    event || {
      type: 'command',
      name: '',
      description: '',
      flowData: { nodes: [], edges: [] },
    }
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(eventConfig.flowData?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(eventConfig.flowData?.edges || []);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loopWarning, setLoopWarning] = useState(null);

  // Auto-add trigger node if it doesn't exist
  useEffect(() => {
    if (nodes.length === 0 || !nodes.find(n => n.type === 'triggerNode')) {
      const triggerNode = {
        id: 'trigger-node',
        type: 'triggerNode',
        position: { x: 250, y: 50 },
        data: {
          label: TRIGGER_NODE.label,
          icon: TRIGGER_NODE.icon,
          color: TRIGGER_NODE.color,
          outputs: [
            { id: 'flow', type: 'FLOW', label: 'Flow' },
            { id: 'user', type: 'USER', label: 'User' },
            { id: 'channel', type: 'CHANNEL', label: 'Channel' },
            { id: 'guild', type: 'GUILD', label: 'Guild' },
          ],
        },
        draggable: false,
      };
      setNodes([triggerNode, ...nodes]);
    }
  }, []);

  const detectLoops = useCallback((currentEdges) => {
    const adjacency = {};
    currentEdges.forEach((edge) => {
      if (!adjacency[edge.source]) adjacency[edge.source] = [];
      adjacency[edge.source].push(edge.target);
    });

    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (node) => {
      visited.add(node);
      recursionStack.add(node);

      const neighbors = adjacency[node] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    for (const node in adjacency) {
      if (!visited.has(node)) {
        if (hasCycle(node)) {
          return true;
        }
      }
    }
    return false;
  }, []);

  const isValidConnection = useCallback((connection, nodes, edges) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);

    if (!sourceNode || !targetNode) return false;

    const targetHandle = connection.targetHandle;

    // Check if this is a non-FLOW input
    if (targetHandle && targetHandle !== 'flow') {
      // Check if there's already a connection to this target handle
      const existingConnection = edges.find(
        e => e.target === connection.target && e.targetHandle === targetHandle
      );

      if (existingConnection) {
        return false; // Prevent multiple connections to non-FLOW inputs
      }
    }

    return true;
  }, []);

  const onConnect = useCallback(
    (params) => {
      if (!isValidConnection(params, nodes, edges)) {
        setLoopWarning('❌ Invalid connection! Non-FLOW inputs can only have one connection.');
        setTimeout(() => setLoopWarning(null), 3000);
        return;
      }

      const sourceNode = nodes.find(n => n.id === params.source);
      const sourceHandle = params.sourceHandle;

      // Get color based on handle type
      let edgeColor = DATA_TYPES.FLOW.color;
      if (sourceHandle?.includes('user')) edgeColor = DATA_TYPES.USER.color;
      else if (sourceHandle?.includes('channel')) edgeColor = DATA_TYPES.CHANNEL.color;
      else if (sourceHandle?.includes('guild')) edgeColor = DATA_TYPES.GUILD.color;
      else if (sourceHandle?.includes('name') || sourceHandle?.includes('id') || sourceHandle?.includes('content')) {
        edgeColor = DATA_TYPES.STRING.color;
      }

      const newEdges = addEdge(
        {
          ...params,
          type: 'smoothstep',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
          style: { stroke: edgeColor, strokeWidth: 2 },
        },
        edges
      );

      if (detectLoops(newEdges)) {
        setLoopWarning('⚠️ Loop detected! This connection creates a cycle in your flow.');
        setTimeout(() => setLoopWarning(null), 3000);
      }

      setEdges(newEdges);
    },
    [edges, setEdges, detectLoops, nodes, isValidConnection]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const addDataNode = (dataNodeType) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'dataNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 200 },
      data: {
        nodeType: dataNodeType.type,
        label: dataNodeType.label,
        icon: dataNodeType.icon,
        color: dataNodeType.color,
        inputs: dataNodeType.inputs,
        outputs: dataNodeType.outputs,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const addActionNode = (actionType) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'actionNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 300 },
      data: {
        actionType: actionType.type,
        label: actionType.label,
        icon: actionType.icon,
        color: actionType.color,
        config: { ...actionType.defaultData },
        inputs: actionType.inputs || [{ id: 'flow', type: 'FLOW' }],
        onUpdate: updateNodeData,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const updateNodeData = useCallback(
    (nodeId, newConfig) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                config: newConfig,
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (nodeId) => {
      if (nodeId === 'trigger-node') return; // Can't delete trigger node
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      setSelectedNode(null);
    },
    [setNodes, setEdges]
  );

  const handleSave = () => {
    if (eventConfig.type === 'command' && !eventConfig.name) {
      alert('Please enter a command name');
      return;
    }

    const updatedEvent = {
      ...eventConfig,
      flowData: { nodes, edges },
    };
    onSave(updatedEvent);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={event ? 'Edit Event' : 'Create New Event'} className="flow-editor-modal">
      <div className="flow-editor-container">
        <div className="flow-editor-sidebar">
          <div className="event-config-section">
            <h4>Event Configuration</h4>

            <div className="form-group">
              <label>Event Type</label>
              <div className="event-type-badge">
                <span className="event-icon">⚡</span>
                <span>Command</span>
              </div>
            </div>

            {eventConfig.type === 'command' && (
              <>
                <div className="form-group">
                  <label>Command Name *</label>
                  <input
                    type="text"
                    value={eventConfig.name}
                    onChange={(e) => setEventConfig({ ...eventConfig, name: e.target.value })}
                    placeholder="hello, info, help"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={eventConfig.description || ''}
                    onChange={(e) => setEventConfig({ ...eventConfig, description: e.target.value })}
                    placeholder="Command description"
                  />
                </div>
              </>
            )}
          </div>

          <div className="data-types-legend">
            <h4>Data Types</h4>
            {Object.entries(DATA_TYPES).map(([key, value]) => (
              <div key={key} className="data-type-item">
                <div className="data-type-dot" style={{ background: value.color }}></div>
                <span>{value.label}</span>
              </div>
            ))}
          </div>

          <div className="actions-palette">
            <h4>Data Nodes</h4>
            <p className="palette-description">Convert data types</p>
            <div className="action-type-list">
              {DATA_NODES.map((dataNode) => (
                <button
                  key={dataNode.type}
                  className="action-type-button"
                  style={{ borderLeft: `4px solid ${dataNode.color}` }}
                  onClick={() => addDataNode(dataNode)}
                >
                  <span className="action-icon">{dataNode.icon}</span>
                  <span>{dataNode.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="actions-palette">
            <h4>Action Nodes</h4>
            <p className="palette-description">Execute actions</p>
            <div className="action-type-list">
              {ACTION_TYPES.map((actionType) => (
                <button
                  key={actionType.type}
                  className="action-type-button"
                  style={{ borderLeft: `4px solid ${actionType.color}` }}
                  onClick={() => addActionNode(actionType)}
                >
                  <span className="action-icon">{actionType.icon}</span>
                  <span>{actionType.label}</span>
                </button>
              ))}
            </div>
          </div>

          {loopWarning && <div className="loop-warning">{loopWarning}</div>}

          <div className="editor-actions">
            <button onClick={onClose} className="secondary">
              Cancel
            </button>
            <button onClick={handleSave} className="primary">
              Save Event
            </button>
          </div>
        </div>

        <div className="flow-editor-canvas">
          <div className="canvas-info">
            <span>📍 Drag nodes to position</span>
            <span>🔗 Connect colored handles by type</span>
            <span>🗑️ Select node and press Delete</span>
          </div>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-right"
          >
            <Background color="#383a40" gap={16} />
            <Controls />
            <MiniMap
              nodeColor={(node) => node.data.color || '#5865f2'}
              maskColor="rgba(0, 0, 0, 0.6)"
            />
          </ReactFlow>
        </div>
      </div>
    </Modal>
  );
}

export default FlowEventEditor;
