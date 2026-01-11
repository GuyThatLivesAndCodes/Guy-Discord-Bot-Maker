import React, { useCallback, useState, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import BlueprintNode from './nodes/BlueprintNode';
import { ALL_NODES, getNodeDefinition, NodeCategory } from '../constants/nodeDefinitions';
import { arePinTypesCompatible, getPinColor, PinTypes } from '../constants/pinTypes';

const nodeTypes = {
  blueprintNode: BlueprintNode,
};

const BlueprintCanvas = ({ initialNodes = [], initialEdges = [], eventName = '', eventDescription = '', onSave, onClose, onOpenSettings }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNodePalette, setShowNodePalette] = useState(false);
  const [paletteCategory, setPaletteCategory] = useState('all');
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // Handle config changes for all nodes
  const handleConfigChange = useCallback((nodeId, newConfig) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, config: newConfig } }
          : n
      )
    );
  }, [setNodes]);

  // Connection validation
  const isValidConnection = useCallback((connection) => {
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode) return false;

    const sourceDef = getNodeDefinition(sourceNode.data.definitionId);
    const targetDef = getNodeDefinition(targetNode.data.definitionId);

    if (!sourceDef || !targetDef) return false;

    // Get pin types
    const sourceHandle = connection.sourceHandle;
    const targetHandle = connection.targetHandle;

    // Exec pins can only connect to exec pins
    if (sourceHandle.includes('exec-out') && !targetHandle.includes('exec-in')) {
      return false;
    }
    if (sourceHandle.includes('data-out') && !targetHandle.includes('data-in')) {
      return false;
    }

    // Check data type compatibility
    if (sourceHandle.includes('data-out') && targetHandle.includes('data-in')) {
      const sourcePin = [...(sourceDef.dataOutputs || [])].find(
        (p) => sourceHandle === `data-out-${p.id}`
      );
      const targetPin = [...(targetDef.dataInputs || [])].find(
        (p) => targetHandle === `data-in-${p.id}`
      );

      if (sourcePin && targetPin) {
        return arePinTypesCompatible(sourcePin.type, targetPin.type);
      }
    }

    // Check if target already has a connection (data inputs can only have one)
    if (targetHandle.includes('data-in')) {
      const existingConnection = edges.find(
        (e) => e.target === connection.target && e.targetHandle === connection.targetHandle
      );
      if (existingConnection) return false;
    }

    return true;
  }, [nodes, edges]);

  // Handle new connections
  const onConnect = useCallback(
    (params) => {
      if (!isValidConnection(params)) {
        console.warn('Invalid connection attempt');
        return;
      }

      // Get pin color for the edge
      const sourceNode = nodes.find((n) => n.id === params.source);
      const sourceDef = getNodeDefinition(sourceNode?.data?.definitionId);

      let edgeColor = '#fff';
      if (params.sourceHandle.includes('exec-out')) {
        edgeColor = '#fff';
      } else if (params.sourceHandle.includes('data-out')) {
        const outputPin = sourceDef?.dataOutputs?.find(
          (p) => params.sourceHandle === `data-out-${p.id}`
        );
        if (outputPin) {
          edgeColor = getPinColor(outputPin.type);
        }
      }

      const isExec = params.sourceHandle.includes('exec-out');
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: isExec,
        style: {
          stroke: edgeColor,
          strokeWidth: isExec ? 4 : 2.5,
          filter: `drop-shadow(0 0 ${isExec ? '6px' : '4px'} ${edgeColor}40)`,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
          width: isExec ? 24 : 20,
          height: isExec ? 24 : 20,
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [isValidConnection, setEdges, nodes]
  );


  // Add node from palette
  const addNode = useCallback(
    (nodeDefId) => {
      const definition = getNodeDefinition(nodeDefId);
      if (!definition) return;

      const newNode = {
        id: `node-${Date.now()}`,
        type: 'blueprintNode',
        position: {
          x: Math.random() * 500 + 100,
          y: Math.random() * 300 + 100,
        },
        data: {
          definitionId: nodeDefId,
          label: definition.label,
          icon: definition.icon,
          category: definition.category,
          execInputs: definition.execInputs || [],
          execOutputs: definition.execOutputs || [],
          dataInputs: definition.dataInputs || [],
          dataOutputs: definition.dataOutputs || [],
          hasConfig: definition.hasConfig,
          defaultConfig: definition.defaultConfig,
          config: definition.defaultConfig ? { ...definition.defaultConfig } : {},
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setShowNodePalette(false);
    },
    [setNodes]
  );

  // Save blueprint
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave({
        nodes,
        edges,
      });
    }
  }, [nodes, edges, onSave]);

  // Filter nodes for palette
  const filteredNodes = Object.entries(ALL_NODES).filter(([key, node]) => {
    const matchesCategory =
      paletteCategory === 'all' || node.category === paletteCategory;
    const matchesSearch =
      !searchQuery ||
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 1000, background: '#1a1a1a' }}>
      {/* Top Toolbar */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          right: 10,
          zIndex: 10,
          display: 'flex',
          gap: '8px',
          background: '#2b2b2b',
          padding: '8px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => setShowNodePalette(!showNodePalette)}
          style={{
            padding: '8px 16px',
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {showNodePalette ? '✕ Close' : '+ Add Node'}
        </button>

        {/* Event Name Display */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          paddingLeft: '16px',
        }}>
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>
            {eventName || 'Unnamed Event'}
          </span>
          {eventDescription && (
            <span style={{ color: '#888', fontSize: '12px' }}>
              • {eventDescription}
            </span>
          )}
        </div>

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            style={{
              padding: '8px 16px',
              background: '#9b59b6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
            title="Event Settings"
          >
            ⚙️ Settings
          </button>
        )}
        <button
          onClick={handleSave}
          style={{
            padding: '8px 16px',
            background: '#2ecc71',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          💾 Save
        </button>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ✕ Close
          </button>
        )}
      </div>

      {/* Node Palette */}
      {showNodePalette && (
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: 10,
            zIndex: 10,
            width: '350px',
            maxHeight: '80vh',
            background: '#2b2b2b',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search */}
          <div style={{ padding: '12px', borderBottom: '1px solid #444' }}>
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#1a1a1a',
                border: '1px solid #555',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Category Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #444',
              background: '#1a1a1a',
            }}
          >
            {['all', NodeCategory.EVENT, NodeCategory.ACTION, NodeCategory.PURE, NodeCategory.FLOW_CONTROL].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setPaletteCategory(cat)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: paletteCategory === cat ? '#3498db' : 'transparent',
                    color: paletteCategory === cat ? '#fff' : '#aaa',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    fontWeight: paletteCategory === cat ? 'bold' : 'normal',
                  }}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              )
            )}
          </div>

          {/* Node List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {filteredNodes.map(([key, node]) => (
              <div
                key={key}
                onClick={() => addNode(key)}
                style={{
                  padding: '10px',
                  margin: '4px 0',
                  background: '#3a3a3a',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#4a4a4a')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#3a3a3a')}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{node.icon}</span>
                  <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '13px' }}>
                    {node.label}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#aaa', marginLeft: '26px' }}>
                  {node.description}
                </div>
              </div>
            ))}
            {filteredNodes.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                No nodes found
              </div>
            )}
          </div>
        </div>
      )}

      {/* React Flow Canvas */}
      <ReactFlow
        ref={reactFlowWrapper}
        nodes={nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            onConfigChange: (newConfig) => handleConfigChange(node.id, newConfig)
          }
        }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #151515 100%)' }}
        connectionLineStyle={{
          stroke: '#faa61a',
          strokeWidth: 3,
          filter: 'drop-shadow(0 0 6px rgba(250,166,26,0.6))'
        }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
          style: {
            filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))'
          }
        }}
      >
        <Background
          color="#2a2a2a"
          gap={25}
          size={2}
          style={{
            opacity: 0.3
          }}
        />
        <Controls />
        <MiniMap
          style={{ background: '#2b2b2b' }}
          maskColor="rgba(0, 0, 0, 0.6)"
          nodeColor={(node) => {
            const def = getNodeDefinition(node.data?.definitionId);
            return def ? getPinColor(PinTypes.ANY) : '#888';
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default BlueprintCanvas;
