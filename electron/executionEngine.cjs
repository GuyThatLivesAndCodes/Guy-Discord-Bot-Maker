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
  if (definitionId.startsWith('action-')) return 'action';
  if (definitionId.startsWith('pure-')) return 'pure';
  if (definitionId.startsWith('flow-')) return 'flow';
  return 'unknown';
}

/**
 * Execute a complete event flow starting from an event node
 */
async function executeEventFlow(eventNode, flowData, context) {
  // Initialize execution context
  const executionContext = {
    ...context,
    computed: new Map(), // Cache for computed values
    visited: new Set(), // Visited nodes to prevent cycles
  };

  // Start execution from the event node's exec output
  if (eventNode.data.execOutputs && eventNode.data.execOutputs.length > 0) {
    const firstExecOut = eventNode.data.execOutputs[0];
    await executeFromPin(
      eventNode.id,
      `exec-out-${firstExecOut.id}`,
      flowData,
      executionContext
    );
  }

  return executionContext;
}

/**
 * Execute flow starting from a specific output pin
 */
async function executeFromPin(nodeId, sourceHandle, flowData, context) {
  // Find all edges connected to this output
  const connectedEdges = flowData.edges.filter(
    (edge) => edge.source === nodeId && edge.sourceHandle === sourceHandle
  );

  // Execute all connected nodes
  for (const edge of connectedEdges) {
    const targetNode = flowData.nodes.find((n) => n.id === edge.target);
    if (!targetNode) continue;

    // Prevent infinite loops
    const visitKey = `${targetNode.id}-${edge.targetHandle}`;
    if (context.visited.has(visitKey)) {
      console.warn('[Blueprint] Cycle detected, skipping node:', targetNode.id);
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
  const definitionId = node.data?.definitionId;
  if (!definitionId) {
    console.error('[Blueprint] Node missing definitionId:', node.id);
    return;
  }

  const category = getNodeCategory(definitionId);

  try {
    switch (category) {
      case 'event':
        // Event nodes just provide data, continue execution
        await continueExecution(node, 'exec', flowData, context);
        break;

      case 'action':
        await executeActionNode(node, definitionId, flowData, context);
        break;

      case 'pure':
        // Pure nodes are executed on-demand via evaluateDataPin
        evaluateDataPin(node, node.data.dataOutputs?.[0]?.id, flowData, context);
        break;

      case 'flow':
        await executeFlowNode(node, definitionId, flowData, context);
        break;

      default:
        console.warn('[Blueprint] Unknown node category:', category, 'for', definitionId);
    }
  } catch (error) {
    console.error(`[Blueprint] Error executing node ${node.id}:`, error);
    throw error;
  }
}

/**
 * Execute an action node
 */
async function executeActionNode(node, definitionId, flowData, context) {
  // Gather all input values
  const inputs = {};
  const dataInputs = node.data.dataInputs || [];

  for (const dataInput of dataInputs) {
    const value = await evaluateDataPin(
      node,
      `data-in-${dataInput.id}`,
      flowData,
      context
    );

    if (value === undefined && !dataInput.optional) {
      console.warn(`[Blueprint] Missing required input ${dataInput.id} for node ${node.id}`);
    }

    inputs[dataInput.id] = value;
  }

  // Execute the action
  const outputs = await executeAction(definitionId, inputs, context);

  // Store outputs in context
  if (outputs) {
    context.computed.set(node.id, outputs);
  }

  // Continue execution through exec output
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
    const outputId = edge.sourceHandle.replace('data-out-', '');
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
    case 'pure-string-contains':
      return String(inputs.string || '').includes(String(inputs.substring || ''));
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

    default:
      console.warn('[Blueprint] Unknown pure node:', nodeId);
      return undefined;
  }
}

/**
 * Execute an action
 */
async function executeAction(actionId, inputs, context) {
  try {
    switch (actionId) {
      case 'action-send-message': {
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
        if (!inputs.message || !inputs.message.delete) {
          console.error('[Blueprint] Invalid message for delete');
          return null;
        }

        await inputs.message.delete();
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
