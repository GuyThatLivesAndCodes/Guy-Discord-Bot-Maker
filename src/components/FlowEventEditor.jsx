import React, { useState, useCallback, useMemo } from 'react';
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
import './FlowEventEditor.css';

const nodeTypes = {
  actionNode: ActionNodeComponent,
};

// Action types available
const ACTION_TYPES = [
  {
    type: 'send-message',
    label: 'Send Message',
    icon: '💬',
    color: '#5865f2',
    defaultData: { content: 'Hello, World!' },
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
    },
  },
  {
    type: 'add-role',
    label: 'Add Role',
    icon: '🎭',
    color: '#faa81a',
    defaultData: { roleId: '' },
  },
  {
    type: 'remove-role',
    label: 'Remove Role',
    icon: '👤',
    color: '#ed4245',
    defaultData: { roleId: '' },
  },
  {
    type: 'condition',
    label: 'Condition',
    icon: '🔀',
    color: '#00aff4',
    defaultData: { condition: 'has-role', value: '' },
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

  // Detect loops in the graph
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

  const onConnect = useCallback(
    (params) => {
      const newEdges = addEdge(
        {
          ...params,
          type: 'smoothstep',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed },
        },
        edges
      );

      // Check for loops
      if (detectLoops(newEdges)) {
        setLoopWarning('⚠️ Loop detected! This connection creates a cycle in your flow.');
        setTimeout(() => setLoopWarning(null), 3000);
      }

      setEdges(newEdges);
    },
    [edges, setEdges, detectLoops]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const addActionNode = (actionType) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'actionNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {
        actionType: actionType.type,
        label: actionType.label,
        icon: actionType.icon,
        color: actionType.color,
        config: { ...actionType.defaultData },
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

          <div className="actions-palette">
            <h4>Action Nodes</h4>
            <p className="palette-description">Click to add to graph</p>
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
            <span>🔗 Drag from handle to create connections</span>
            <span>🗑️ Select node and press Delete to remove</span>
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
