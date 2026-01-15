/**
 * Blueprint-Style Execution Engine (CommonJS version for Electron main process)
 * Executes node graphs with proper exec flow and lazy evaluation
 */

// Node definitions (inline for electron process)
const PinTypes = {
  EXEC: 'EXEC',
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  BOOLEAN: 'BOOLEAN',
  USER: 'USER',
  MEMBER: 'MEMBER',
  CHANNEL: 'CHANNEL',
  GUILD: 'GUILD',
  ROLE: 'ROLE',
  MESSAGE: 'MESSAGE',
  EMBED: 'EMBED',
  ATTACHMENT: 'ATTACHMENT',
  INTERACTION: 'INTERACTION',
  VOICE_CONNECTION: 'VOICE_CONNECTION',
  ARRAY: 'ARRAY',
  ANY: 'ANY',
};

// Simplified node definition lookup (just category info)
const NODE_CATEGORIES = {
  'ON_MESSAGE_CREATED': 'event',
  'ON_MESSAGE_DELETED': 'event',
  'ON_MEMBER_JOINED': 'event',
  'ON_MEMBER_LEFT': 'event',
  'ON_REACTION_ADDED': 'event',
  'ON_VOICE_STATE_CHANGED': 'event',
  'ON_SLASH_COMMAND': 'event',
  'ON_BOT_READY': 'event',
  // Actions start with action-
  // Pure nodes start with pure-
  // Flow nodes start with flow-
};

function getNodeCategory(definitionId) {
  if (NODE_CATEGORIES[definitionId]) return NODE_CATEGORIES[definitionId];
  if (definitionId.startsWith('event-')) return 'event';
  if (definitionId.startsWith('action-')) return 'action';
  if (definitionId.startsWith('pure-')) return 'pure';
  if (definitionId.startsWith('flow-')) return 'flow';
  return 'unknown';
}

/**
 * Execute a complete event flow starting from an event node
 */
async function executeEventFlow(eventNode, flowData, context) {
  const log = context.client && context.client.log ? context.client.log.bind(context.client) : null;

  if (log) {
    log('info', `[EE] executeEventFlow called`);
    log('info', `[EE] Node: id=${eventNode.id}, type=${eventNode.type}, def=${eventNode.data?.definitionId}`);
  }

  // Initialize execution context
  const executionContext = {
    ...context,
    computed: new Map(), // Cache for computed values
    visited: new Set(), // Visited nodes to prevent cycles
  };

  if (log) {
    log('info', `[EE] Context has ${Object.keys(context).length} keys`);
  }

  // Start execution from the event node's exec output
  if (eventNode.data.execOutputs && eventNode.data.execOutputs.length > 0) {
    const firstExecOut = eventNode.data.execOutputs[0];
    if (log) {
      log('info', `[EE] Starting from exec pin: exec-out-${firstExecOut.id}`);
    }
    await executeFromPin(
      eventNode.id,
      `exec-out-${firstExecOut.id}`,
      flowData,
      executionContext
    );
  } else {
    if (log) {
      log('error', '[EE] Event node has NO exec outputs!');
    }
    console.warn('[ExecutionEngine] Event node has no exec outputs!');
  }

  return executionContext;
}

/**
 * Execute flow starting from a specific output pin
 */
async function executeFromPin(nodeId, sourceHandle, flowData, context) {
  const log = context.client && context.client.log ? context.client.log.bind(context.client) : null;

  if (log) {
    log('info', `[EE] executeFromPin: ${sourceHandle} on node ${nodeId}`);
  }

  // Find all edges connected to this output
  const connectedEdges = flowData.edges.filter(
    (edge) => edge.source === nodeId && edge.sourceHandle === sourceHandle
  );

  if (log) {
    log('info', `[EE] Found ${connectedEdges.length} connected edges`);
  }

  // Execute all connected nodes
  for (const edge of connectedEdges) {
    if (log) {
      log('info', `[EE] Processing edge: ${edge.source} -> ${edge.target}`);
    }

    const targetNode = flowData.nodes.find((n) => n.id === edge.target);
    if (!targetNode) {
      if (log) {
        log('error', `[EE] Target node not found: ${edge.target}`);
      }
      continue;
    }

    if (log) {
      log('info', `[EE] Target node: ${targetNode.data?.definitionId}`);
    }

    // Prevent infinite loops
    const visitKey = `${targetNode.id}-${edge.targetHandle}`;
    if (context.visited.has(visitKey)) {
      if (log) {
        log('error', `[EE] Cycle detected, skipping: ${targetNode.id}`);
      }
      continue;
    }
    context.visited.add(visitKey);

    await executeNode(targetNode, edge.targetHandle, flowData, context);
  }
}

/**
 * Execute a single node
 */
async function executeNode(node, entryHandle, flowData, context) {
  const log = context.client && context.client.log ? context.client.log.bind(context.client) : null;

  if (log) {
    log('info', `[EE] executeNode: ${node.data?.definitionId}`);
  }

  const definitionId = node.data?.definitionId;
  if (!definitionId) {
    if (log) {
      log('error', `[EE] Node missing definitionId: ${node.id}`);
    }
    return;
  }

  const category = getNodeCategory(definitionId);
  if (log) {
    log('info', `[EE] Node category: ${category}`);
  }

  try {
    switch (category) {
      case 'event':
        if (log) log('info', '[EE] Executing event node');
        // Event nodes just provide data, continue execution
        await continueExecution(node, 'exec', flowData, context);
        break;

      case 'action':
        if (log) log('info', `[EE] Executing ACTION: ${definitionId}`);
        await executeActionNode(node, definitionId, flowData, context);
        break;

      case 'pure':
        if (log) log('info', '[EE] Executing pure node (lazy)');
        // Pure nodes are executed on-demand via evaluateDataPin
        evaluateDataPin(node, node.data.dataOutputs?.[0]?.id, flowData, context);
        break;

      case 'flow':
        if (log) log('info', '[EE] Executing flow control node');
        await executeFlowNode(node, definitionId, flowData, context);
        break;

      default:
        if (log) log('error', `[EE] Unknown category: ${category} for ${definitionId}`);
    }
  } catch (error) {
    if (log) {
      log('error', `[EE] Error in node ${node.id}: ${error.message}`);
    }
    console.error(`[ExecutionEngine] Error stack:`, error.stack);
    throw error;
  }
}

/**
 * Execute an action node
 */
async function executeActionNode(node, definitionId, flowData, context) {
  const log = context.client && context.client.log ? context.client.log.bind(context.client) : null;

  if (log) {
    log('info', `[EE] executeActionNode: ${definitionId}`);
  }

  // Gather all input values
  const inputs = {};
  const dataInputs = node.data.dataInputs || [];

  if (log) {
    log('info', `[EE] Gathering ${dataInputs.length} inputs: ${dataInputs.map(d => d.id).join(', ')}`);
  }

  for (const dataInput of dataInputs) {
    const value = await evaluateDataPin(
      node,
      `data-in-${dataInput.id}`,
      flowData,
      context
    );

    if (log) {
      const valStr = value ? `${typeof value}` : 'undefined';
      log('info', `[EE] Input '${dataInput.id}': ${valStr}`);
    }

    if (value === undefined && !dataInput.optional) {
      if (log) {
        log('error', `[EE] Missing required input: ${dataInput.id}`);
      }
    }

    inputs[dataInput.id] = value;
  }

  // Execute the action
  if (log) {
    log('info', `[EE] Calling executeAction...`);
  }
  const outputs = await executeAction(definitionId, inputs, context, node);

  if (log) {
    log('info', `[EE] Action completed, outputs: ${outputs ? 'yes' : 'none'}`);
  }

  // Store outputs in context
  if (outputs) {
    context.computed.set(node.id, outputs);
  }

  // Continue execution through exec output
  if (log) {
    log('info', '[EE] Continuing to next node...');
  }
  await continueExecution(node, 'exec', flowData, context);
}

/**
 * Execute a flow control node
 */
async function executeFlowNode(node, definitionId, flowData, context) {
  switch (definitionId) {
    case 'flow-branch': {
      // Evaluate condition
      const condition = await evaluateDataPin(
        node,
        'data-in-condition',
        flowData,
        context
      );

      // Follow true or false path
      const path = condition ? 'true' : 'false';
      await executeFromPin(node.id, `exec-out-${path}`, flowData, context);
      break;
    }

    case 'flow-switch': {
      // Evaluate value
      const value = await evaluateDataPin(
        node,
        'data-in-value',
        flowData,
        context
      );

      // Convert to integer
      const intValue = Math.floor(value || 0);

      // Follow the matching path or default
      let path;
      if (intValue >= 0 && intValue <= 4) {
        path = String(intValue);
      } else {
        path = 'default';
      }

      await executeFromPin(node.id, `exec-out-${path}`, flowData, context);
      break;
    }

    case 'flow-delay': {
      // Get duration
      const duration = await evaluateDataPin(
        node,
        'data-in-duration',
        flowData,
        context
      );

      // Wait
      await new Promise((resolve) => setTimeout(resolve, (duration || 0) * 1000));

      // Continue
      await continueExecution(node, 'exec', flowData, context);
      break;
    }

    case 'flow-sequence': {
      // Execute in order: then1, then2, then3
      await executeFromPin(node.id, 'exec-out-then1', flowData, context);
      await executeFromPin(node.id, 'exec-out-then2', flowData, context);
      await executeFromPin(node.id, 'exec-out-then3', flowData, context);
      break;
    }

    case 'flow-foreach': {
      // Get array
      const array = await evaluateDataPin(
        node,
        'data-in-array',
        flowData,
        context
      );

      if (!Array.isArray(array)) {
        console.warn('[Blueprint] For Each node received non-array:', array);
        await executeFromPin(node.id, 'exec-out-completed', flowData, context);
        return;
      }

      // Loop through elements
      for (let i = 0; i < array.length; i++) {
        // Store current element and index
        context.computed.set(node.id, {
          element: array[i],
          index: i,
        });

        // Execute loop body
        await executeFromPin(node.id, 'exec-out-loopBody', flowData, context);
      }

      // Execute completed path
      await executeFromPin(node.id, 'exec-out-completed', flowData, context);
      break;
    }

    default:
      console.warn('[Blueprint] Unknown flow control node:', definitionId);
  }
}

/**
 * Continue execution through default exec output
 */
async function continueExecution(node, execOutputId, flowData, context) {
  await executeFromPin(node.id, `exec-out-${execOutputId}`, flowData, context);
}

/**
 * Evaluate a data pin value (lazy evaluation with caching)
 */
async function evaluateDataPin(node, targetHandle, flowData, context) {
  // Check cache first
  const cacheKey = `${node.id}-${targetHandle}`;
  if (context.computed.has(cacheKey)) {
    return context.computed.get(cacheKey);
  }

  // Find incoming edge
  const edge = flowData.edges.find(
    (e) => e.target === node.id && e.targetHandle === targetHandle
  );

  if (!edge) {
    // No connection - check if it's a constant
    if (node.data.config) {
      const pinId = targetHandle.replace('data-in-', '').replace('data-out-', '');
      return node.data.config[pinId];
    }
    return undefined;
  }

  // Find source node
  const sourceNode = flowData.nodes.find((n) => n.id === edge.source);
  if (!sourceNode) return undefined;

  const sourceCategory = getNodeCategory(sourceNode.data?.definitionId);

  // If source is a constant node, return config value
  if (sourceNode.data.hasConfig && sourceNode.data.config) {
    const definitionId = sourceNode.data?.definitionId;
    const outputId = edge.sourceHandle.replace('data-out-', '');

    // Handle option nodes specially - they read from interaction context
    if (definitionId && (definitionId.startsWith('OPTION_') || definitionId.startsWith('pure-option-'))) {
      const optionName = sourceNode.data.config.optionName;
      if (!optionName) {
        console.warn('[Blueprint] Option node has no option name configured');
        return undefined;
      }
      // Get value from context (set by interaction)
      const contextKey = `option_${optionName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`;
      const value = context[contextKey];
      context.computed.set(cacheKey, value);
      return value;
    }

    // Regular constant nodes
    const value = sourceNode.data.config[outputId] !== undefined
      ? sourceNode.data.config[outputId]
      : sourceNode.data.config.value;
    context.computed.set(cacheKey, value);
    return value;
  }

  // If source is an event node, get from context
  if (sourceCategory === 'event') {
    const outputId = edge.sourceHandle.replace('data-out-', '');
    const value = context[outputId];
    context.computed.set(cacheKey, value);
    return value;
  }

  // If source is a pure node, compute it
  if (sourceCategory === 'pure') {
    const value = await evaluatePureNode(sourceNode, edge.sourceHandle, flowData, context);
    context.computed.set(cacheKey, value);
    return value;
  }

  // If source is an action or flow node, get from computed outputs
  if (context.computed.has(sourceNode.id)) {
    const outputs = context.computed.get(sourceNode.id);
    const outputId = edge.sourceHandle.replace('data-out-', '');
    const value = outputs[outputId];
    context.computed.set(cacheKey, value);
    return value;
  }

  return undefined;
}

/**
 * Evaluate a pure node
 */
async function evaluatePureNode(node, outputHandle, flowData, context) {
  const definitionId = node.data?.definitionId;
  const dataInputs = node.data.dataInputs || [];

  // Gather inputs
  const inputs = {};
  for (const dataInput of dataInputs) {
    const value = await evaluateDataPin(
      node,
      `data-in-${dataInput.id}`,
      flowData,
      context
    );
    inputs[dataInput.id] = value;
  }

  // Compute
  const result = computePureNode(definitionId, inputs, context);

  // Cache result
  const outputs = {};
  const outputId = outputHandle.replace('data-out-', '');
  outputs[outputId] = result;
  context.computed.set(node.id, outputs);

  return result;
}

/**
 * Compute pure node output
 */
function computePureNode(nodeId, inputs, context) {
  switch (nodeId) {
    // String operations
    case 'pure-join-strings':
      return [inputs.a, inputs.b].filter(x => x !== undefined).join(inputs.separator || '');
    case 'pure-string-uppercase':
      return String(inputs.string || '').toUpperCase();
    case 'pure-string-lowercase':
      return String(inputs.string || '').toLowerCase();

    // Math
    case 'pure-add':
      return (inputs.a || 0) + (inputs.b || 0);
    case 'pure-subtract':
      return (inputs.a || 0) - (inputs.b || 0);
    case 'pure-multiply':
      return (inputs.a || 0) * (inputs.b || 0);
    case 'pure-divide':
      return inputs.b !== 0 ? (inputs.a || 0) / inputs.b : 0;
    case 'pure-random':
      const min = inputs.min || 0;
      const max = inputs.max || 100;
      return Math.floor(Math.random() * (max - min + 1)) + min;

    // Comparison
    case 'pure-equals':
      return inputs.a === inputs.b;
    case 'pure-greater':
      return (inputs.a || 0) > (inputs.b || 0);
    case 'pure-less':
      return (inputs.a || 0) < (inputs.b || 0);

    // Boolean
    case 'pure-and':
      return Boolean(inputs.a) && Boolean(inputs.b);
    case 'pure-or':
      return Boolean(inputs.a) || Boolean(inputs.b);
    case 'pure-not':
      return !Boolean(inputs.value);

    // Discord data
    case 'pure-get-user-name':
      return inputs.user?.username || inputs.user?.user?.username || '';
    case 'pure-get-user-id':
      return inputs.user?.id || '';
    case 'pure-get-channel-name':
      return inputs.channel?.name || '';
    case 'pure-get-guild-name':
      return inputs.guild?.name || '';
    case 'pure-get-member-count':
      return inputs.guild?.memberCount || 0;
    case 'pure-has-role':
      return inputs.member?.roles?.cache?.has(inputs.role?.id) || false;

    // Type conversion
    case 'pure-to-string':
      return String(inputs.value ?? '');
    case 'pure-to-number':
      return Number(inputs.value) || 0;

    // New string operations
    case 'pure-string-join': {
      // Join all string inputs together
      const values = [];
      for (let i = 1; i <= 10; i++) {
        const key = `string${i}`;
        if (inputs[key] !== undefined) {
          values.push(String(inputs[key]));
        }
      }
      return values.join('');
    }
    case 'pure-string-equals': {
      const a = String(inputs.a || '');
      const b = String(inputs.b || '');
      const caseSensitive = inputs.caseSensitive !== false; // Default true
      if (caseSensitive) {
        return a === b;
      } else {
        return a.toLowerCase() === b.toLowerCase();
      }
    }
    case 'pure-string-contains': {
      const text = String(inputs.text || '');
      const search = String(inputs.search || '');
      const caseSensitive = inputs.caseSensitive !== false; // Default true
      if (caseSensitive) {
        return text.includes(search);
      } else {
        return text.toLowerCase().includes(search.toLowerCase());
      }
    }

    // New math operations
    case 'pure-math-add':
      return (inputs.a || 0) + (inputs.b || 0);
    case 'pure-math-subtract':
      return (inputs.a || 0) - (inputs.b || 0);
    case 'pure-math-multiply':
      return (inputs.a || 0) * (inputs.b || 0);
    case 'pure-math-divide':
      return inputs.b !== 0 ? (inputs.a || 0) / inputs.b : 0;
    case 'pure-random-number': {
      const min = inputs.min !== undefined ? inputs.min : 0;
      const max = inputs.max !== undefined ? inputs.max : 100;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // New comparison operations
    case 'pure-compare-equal':
      return inputs.a === inputs.b;
    case 'pure-compare-not-equal':
      return inputs.a !== inputs.b;
    case 'pure-compare-greater':
      return (inputs.a || 0) > (inputs.b || 0);
    case 'pure-compare-less':
      return (inputs.a || 0) < (inputs.b || 0);
    case 'pure-compare-greater-equal':
      return (inputs.a || 0) >= (inputs.b || 0);
    case 'pure-compare-less-equal':
      return (inputs.a || 0) <= (inputs.b || 0);

    // Discord permission and role checks
    case 'pure-check-permission': {
      const member = inputs.member;
      const permission = inputs.permission;
      if (!member || !permission) return false;
      try {
        // member.permissions is a PermissionsBitField
        return member.permissions?.has(permission) || false;
      } catch (e) {
        return false;
      }
    }
    case 'pure-check-role': {
      const member = inputs.member;
      const roleId = inputs.roleId;
      if (!member || !roleId) return false;
      try {
        return member.roles?.cache?.has(roleId) || false;
      } catch (e) {
        return false;
      }
    }

    // File and attachment operations
    case 'pure-get-attachment-url': {
      const attachment = inputs.attachment;
      return attachment?.url || attachment?.proxyURL || '';
    }
    case 'pure-get-attachment-name': {
      const attachment = inputs.attachment;
      return attachment?.name || '';
    }
    case 'pure-find-files': {
      const fs = require('fs');
      const path = require('path');
      const directory = inputs.directory || node.data?.config?.directory || './audio';
      const pattern = inputs.pattern || node.data?.config?.pattern || '*';
      const index = inputs.index !== undefined ? inputs.index : (node.data?.config?.index || 0);

      try {
        // Read directory
        const files = fs.readdirSync(directory);

        // Filter by pattern (simple glob matching)
        const filtered = files.filter(file => {
          if (pattern === '*') return true;
          if (pattern.startsWith('*.')) {
            const ext = pattern.substring(1);
            return file.endsWith(ext);
          }
          return file.includes(pattern);
        });

        // Get file at index
        const selectedFile = filtered[index] || '';
        const fullPath = selectedFile ? path.join(directory, selectedFile) : '';

        return {
          path: fullPath,
          count: filtered.length,
        };
      } catch (e) {
        console.error('[ExecutionEngine] Error finding files:', e.message);
        return {
          path: '',
          count: 0,
        };
      }
    }

    // Command Options - read values from interaction context
    case 'OPTION_STRING':
    case 'pure-option-string': {
      // Option nodes need access to the node config, not inputs
      // The config is on the node itself
      return undefined; // Will be handled specially in evaluateDataPin
    }

    default:
      console.warn('[Blueprint] Unknown pure node:', nodeId);
      return undefined;
  }
}

/**
 * Execute an action
 */
async function executeAction(actionId, inputs, context, node) {
  console.log('[ExecutionEngine] executeAction called:', actionId);
  console.log('[ExecutionEngine] Inputs:', Object.keys(inputs));

  try {
    switch (actionId) {
      case 'action-send-message': {
        console.log('[ExecutionEngine] Executing action-send-message');
        const targetChannel = inputs.channel;
        if (!targetChannel || !targetChannel.send) {
          console.error('[Blueprint] Invalid channel for send message');
          return null;
        }

        const options = {};
        if (inputs.content) options.content = String(inputs.content);
        if (inputs.embed) options.embeds = [inputs.embed];
        if (inputs.files) options.files = inputs.files;

        const sentMessage = await targetChannel.send(options);
        return { message: sentMessage };
      }

      case 'action-reply-message': {
        if (!inputs.message || !inputs.message.reply) {
          console.error('[Blueprint] Invalid message for reply');
          return null;
        }

        const options = {};
        if (inputs.content) options.content = String(inputs.content);
        if (inputs.embed) options.embeds = [inputs.embed];

        const reply = await inputs.message.reply(options);
        return { reply };
      }

      case 'action-reply-interaction': {
        if (!inputs.interaction || !inputs.interaction.reply) {
          console.error('[Blueprint] Invalid interaction for reply');
          return null;
        }

        const options = {};
        if (inputs.content) options.content = String(inputs.content);
        if (inputs.embed) options.embeds = [inputs.embed];
        if (inputs.ephemeral) options.ephemeral = true;

        if (inputs.interaction.replied || inputs.interaction.deferred) {
          await inputs.interaction.followUp(options);
        } else {
          await inputs.interaction.reply(options);
        }
        return {};
      }

      case 'action-edit-message': {
        if (!inputs.message || !inputs.message.edit) {
          console.error('[Blueprint] Invalid message for edit');
          return null;
        }

        const options = {};
        if (inputs.content) options.content = String(inputs.content);
        if (inputs.embed) options.embeds = [inputs.embed];

        await inputs.message.edit(options);
        return {};
      }

      case 'action-delete-message': {
        console.log('[ExecutionEngine] Executing action-delete-message');
        console.log('[ExecutionEngine] Has message:', !!inputs.message);
        console.log('[ExecutionEngine] Message object:', inputs.message);

        if (!inputs.message || !inputs.message.delete) {
          console.error('[ExecutionEngine] Invalid message for delete - message:', inputs.message);
          return null;
        }

        console.log('[ExecutionEngine] Attempting to delete message...');
        await inputs.message.delete();
        console.log('[ExecutionEngine] Message deleted successfully');
        return {};
      }

      case 'action-add-reaction': {
        if (!inputs.message || !inputs.message.react) {
          console.error('[Blueprint] Invalid message for reaction');
          return null;
        }

        await inputs.message.react(inputs.emoji);
        return {};
      }

      case 'action-add-role': {
        if (!inputs.member || !inputs.member.roles || !inputs.role) {
          console.error('[Blueprint] Invalid member or role for add role');
          return null;
        }

        await inputs.member.roles.add(inputs.role);
        return {};
      }

      case 'action-remove-role': {
        if (!inputs.member || !inputs.member.roles || !inputs.role) {
          console.error('[Blueprint] Invalid member or role for remove role');
          return null;
        }

        await inputs.member.roles.remove(inputs.role);
        return {};
      }

      case 'action-kick-member': {
        if (!inputs.member || !inputs.member.kick) {
          console.error('[Blueprint] Invalid member for kick');
          return null;
        }

        await inputs.member.kick(inputs.reason);
        return {};
      }

      case 'action-ban-member': {
        if (!inputs.member || !inputs.member.ban) {
          console.error('[Blueprint] Invalid member for ban');
          return null;
        }

        const options = {};
        if (inputs.reason) options.reason = inputs.reason;
        if (inputs.deleteMessageDays) options.deleteMessageDays = inputs.deleteMessageDays;

        await inputs.member.ban(options);
        return {};
      }

      case 'action-timeout-member': {
        if (!inputs.member || !inputs.member.timeout) {
          console.error('[Blueprint] Invalid member for timeout');
          return null;
        }

        const duration = (inputs.duration || 0) * 1000;
        await inputs.member.timeout(duration, inputs.reason);
        return {};
      }

      case 'action-send-dm': {
        if (!inputs.user || !inputs.user.send) {
          console.error('[Blueprint] Invalid user for DM');
          return null;
        }

        const options = {};
        if (inputs.content) options.content = String(inputs.content);
        if (inputs.embed) options.embeds = [inputs.embed];

        const dmMessage = await inputs.user.send(options);
        return { message: dmMessage };
      }

      case 'action-create-embed': {
        const embed = {};
        if (inputs.title) embed.title = inputs.title;
        if (inputs.description) embed.description = inputs.description;
        if (inputs.color) embed.color = parseInt(inputs.color.replace('#', ''), 16);
        if (inputs.thumbnail) embed.thumbnail = { url: inputs.thumbnail };
        if (inputs.image) embed.image = { url: inputs.image };
        if (inputs.footer) embed.footer = { text: inputs.footer };

        return { embed };
      }

      case 'action-set-presence': {
        // Get bot client from context
        const client = context.client?.client;
        if (!client || !client.user) {
          console.error('[Blueprint] No client available for set presence');
          return null;
        }

        // Map activity type strings to Discord.js ActivityType enum
        const activityTypeMap = {
          'playing': 0,
          'streaming': 1,
          'listening': 2,
          'watching': 3,
          'competing': 5,
        };

        // Map status strings to Discord.js PresenceUpdateStatus
        const statusMap = {
          'online': 'online',
          'idle': 'idle',
          'dnd': 'dnd',
          'invisible': 'invisible',
        };

        const activityType = inputs.activityType?.toLowerCase() || 'playing';
        const activityName = inputs.activityName || '';
        const status = inputs.status?.toLowerCase() || 'online';
        const url = inputs.url || null;

        const presence = {
          status: statusMap[status] || 'online',
        };

        if (activityName) {
          presence.activities = [{
            name: activityName,
            type: activityTypeMap[activityType] || 0,
          }];

          // Add URL for streaming
          if (activityType === 'streaming' && url) {
            presence.activities[0].url = url;
          }
        }

        await client.user.setPresence(presence);
        console.log('[Blueprint] Set presence:', presence);
        return {};
      }

      case 'action-join-voice': {
        const channel = inputs.channel;
        if (!channel || channel.type !== 2) {  // 2 = GUILD_VOICE
          console.error('[Blueprint] Invalid voice channel for join');
          return null;
        }

        // Call the bot runner's voice join method
        const botClient = context.client;
        if (botClient && botClient.joinVoiceChannel) {
          await botClient.joinVoiceChannel(channel);
        }
        return {};
      }

      case 'action-leave-voice': {
        const guild = inputs.guild;
        if (!guild) {
          console.error('[Blueprint] Invalid guild for leave voice');
          return null;
        }

        // Call the bot runner's voice leave method
        const botClient = context.client;
        if (botClient && botClient.leaveVoiceChannel) {
          await botClient.leaveVoiceChannel(guild.id);
        }
        return {};
      }

      case 'action-play-sound': {
        const channel = inputs.channel;
        const filePath = inputs.filePath;
        const volume = inputs.volume !== undefined ? inputs.volume : 1.0;

        if (!channel || channel.type !== 2) {
          console.error('[Blueprint] Invalid voice channel for play sound');
          return null;
        }

        if (!filePath) {
          console.error('[Blueprint] No file path provided for play sound');
          return null;
        }

        // Call the bot runner's play sound method
        const botClient = context.client;
        if (botClient && botClient.playSound) {
          // Play sound with callbacks for onStart and onEnd
          await botClient.playSound(channel, filePath, volume, {
            onStart: async () => {
              // Execute onStart pin if connected
              await executeFromPin(node.id, 'exec-out-onStart', flowData, context);
            },
            onEnd: async () => {
              // Execute onEnd pin if connected
              await executeFromPin(node.id, 'exec-out-onEnd', flowData, context);
            },
          });
        }
        return {};
      }

      case 'action-stop-sound': {
        const guild = inputs.guild;
        if (!guild) {
          console.error('[Blueprint] Invalid guild for stop sound');
          return null;
        }

        // Call the bot runner's stop sound method
        const botClient = context.client;
        if (botClient && botClient.stopSound) {
          await botClient.stopSound(guild.id);
        }
        return {};
      }

      case 'action-claude-api': {
        const log = context.client?.log || console.log.bind(console);

        try {
          log('info', '[Claude] Executing Claude API action');

          // Debug logging
          log('info', `[Claude] Node exists: ${!!node}`);
          log('info', `[Claude] Node.data exists: ${!!node?.data}`);
          log('info', `[Claude] Node.data.config exists: ${!!node?.data?.config}`);

          // Get AI config ID from node config
          const aiConfigId = node?.data?.config?.aiConfigId;
          const prompt = inputs.prompt;
          const channel = inputs.channel;
          const messageCountOverride = inputs.messageCount;

          log('info', `[Claude] AI Config ID: ${aiConfigId || 'NONE'}`);
          log('info', `[Claude] Prompt: ${prompt ? 'provided' : 'MISSING'}`);
          log('info', `[Claude] Channel: ${channel ? 'provided' : 'none'}`);

          if (!aiConfigId) {
            log('error', '[Claude] No AI configuration selected');
            return { response: '', error: 'No AI configuration selected. Please select an AI in the node settings.' };
          }

          // Find the AI config
          const aiConfigs = context.aiConfigs || [];
          log('info', `[Claude] Available AI configs: ${aiConfigs.length}`);

          const aiConfig = aiConfigs.find(cfg => cfg.id === aiConfigId);

          if (!aiConfig) {
            log('error', `[Claude] AI configuration not found: ${aiConfigId}`);
            return { response: '', error: 'Selected AI configuration not found. Please check your AI settings.' };
          }

          log('info', `[Claude] Using AI config: ${aiConfig.name}`);

          if (!prompt) {
            log('error', '[Claude] Missing prompt');
            return { response: '', error: 'Prompt is required' };
          }

          try {
          // Use messageCount from input override or node config or AI config
          const messageCount = messageCountOverride !== undefined
            ? messageCountOverride
            : (node?.data?.config?.messageCount || 10);

          log('info', `[Claude] Message count: ${messageCount}`);

          // Build messages array with conversation history
          const messages = [];

          // Fetch previous messages if channel is provided and messageCount > 0
          if (channel && messageCount > 0) {
            try {
              log('info', `[Claude] Fetching ${messageCount} previous messages`);
              const fetchedMessages = await channel.messages.fetch({ limit: messageCount });
              const messageArray = Array.from(fetchedMessages.values()).reverse();

              // Add messages to context
              for (const msg of messageArray) {
                if (msg.content) {
                  messages.push({
                    role: msg.author.bot ? 'assistant' : 'user',
                    content: msg.content
                  });
                }
              }
              log('info', `[Claude] Added ${messages.length} messages to context`);
            } catch (fetchError) {
              log('warning', `[Claude] Could not fetch messages: ${fetchError.message}`);
              // Continue without previous messages
            }
          }

          // Add the current prompt
          messages.push({
            role: 'user',
            content: prompt
          });

          // Build request body using AI config settings
          const requestBody = {
            model: aiConfig.model || 'claude-3-5-sonnet-20241022',
            max_tokens: aiConfig.maxTokens || 4096,
            messages: messages
          };

          // Add temperature if specified
          if (aiConfig.temperature !== undefined) {
            requestBody.temperature = aiConfig.temperature;
          }

          // Add system prompt from AI config if provided
          if (aiConfig.systemPrompt) {
            requestBody.system = aiConfig.systemPrompt;
          }

          log('info', `[Claude] Making API request (model: ${requestBody.model}, tokens: ${requestBody.max_tokens})`);

          // Make API call using https
          const https = require('https');
          const postData = JSON.stringify(requestBody);

          const options = {
            hostname: 'api.anthropic.com',
            port: 443,
            path: '/v1/messages',
            method: 'POST',
            headers: {
              'x-api-key': aiConfig.apiKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            }
          };

          const response = await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
              let data = '';
              res.on('data', (chunk) => {
                data += chunk;
              });
              res.on('end', () => {
                try {
                  const parsedResponse = JSON.parse(data);
                  if (parsedResponse.error) {
                    reject(new Error(parsedResponse.error.message || 'Claude API error'));
                  } else {
                    resolve(parsedResponse);
                  }
                } catch (error) {
                  reject(new Error('Failed to parse Claude API response: ' + error.message));
                }
              });
            });

            req.on('error', (error) => {
              reject(new Error('Claude API request failed: ' + error.message));
            });

            req.write(postData);
            req.end();
          });

          // Extract response text
          if (response.content && response.content.length > 0) {
            const responseText = response.content[0].text;
            log('success', `[Claude] Response received (${responseText.length} chars)`);
            return { response: responseText, error: '' };
          } else {
            log('warning', '[Claude] No content in response');
            return { response: '', error: 'No response from Claude API' };
          }
        } catch (error) {
          log('error', `[Claude] API call failed: ${error.message}`);
          return { response: '', error: error.message };
        }
        } catch (error) {
          log('error', `[Claude] Initialization error: ${error.message}`);
          log('error', `[Claude] Stack: ${error.stack}`);
          return { response: '', error: `Setup error: ${error.message}` };
        }
      }

      default:
        console.warn('[Blueprint] Unknown action:', actionId);
        return null;
    }
  } catch (error) {
    console.error(`[Blueprint] Error executing action ${actionId}:`, error);
    throw error;
  }
}

module.exports = {
  executeEventFlow,
  executeFromPin,
  executeNode,
  evaluateDataPin,
  computePureNode,
  executeAction,
};
