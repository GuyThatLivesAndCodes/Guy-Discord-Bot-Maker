/**
 * Blueprint-Style Execution Engine
 * Executes node graphs with proper exec flow and lazy evaluation
 */

import { getNodeDefinition } from '../constants/nodeDefinitions';
import { PinTypes } from '../constants/pinTypes';

/**
 * Execute a complete event flow starting from an event node
 */
export async function executeEventFlow(eventNode, flowData, context) {
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
      console.warn('Cycle detected, skipping node:', targetNode.id);
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
  const definition = getNodeDefinition(node.data.definitionId);
  if (!definition) {
    console.error('Unknown node type:', node.data.definitionId);
    return;
  }

  try {
    // Different execution based on category
    switch (definition.category) {
      case 'event':
        // Event nodes just provide data, no execution needed
        // Data is already in context from the trigger
        await continueExecution(node, 'exec', flowData, context);
        break;

      case 'action':
        await executeActionNode(node, definition, flowData, context);
        break;

      case 'pure':
        // Pure nodes are executed on-demand via evaluateDataPin
        // If we reach here, just compute and continue
        evaluateDataPin(node, definition.dataOutputs[0]?.id, flowData, context);
        break;

      case 'flow':
        await executeFlowNode(node, definition, flowData, context);
        break;

      default:
        console.warn('Unknown node category:', definition.category);
    }
  } catch (error) {
    console.error(`Error executing node ${node.id}:`, error);
    throw error;
  }
}

/**
 * Execute an action node (has side effects)
 */
async function executeActionNode(node, definition, flowData, context) {
  // Gather all input values
  const inputs = {};

  for (const dataInput of definition.dataInputs || []) {
    const value = await evaluateDataPin(
      node,
      `data-in-${dataInput.id}`,
      flowData,
      context
    );

    if (value === undefined && !dataInput.optional) {
      console.warn(`Missing required input ${dataInput.id} for node ${node.id}`);
    }

    inputs[dataInput.id] = value;
  }

  // Execute the action
  const outputs = await executeAction(definition.id, inputs, context);

  // Store outputs in context
  if (outputs) {
    context.computed.set(node.id, outputs);
  }

  // Continue execution through exec output
  await continueExecution(node, 'exec', flowData, context);
}

/**
 * Execute a flow control node (branching, loops, etc.)
 */
async function executeFlowNode(node, definition, flowData, context) {
  switch (definition.id) {
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
      await new Promise((resolve) => setTimeout(resolve, duration * 1000));

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
        console.warn('For Each node received non-array:', array);
        await executeFromPin(node.id, 'exec-out-completed', flowData, context);
        return;
      }

      // Loop through elements
      for (let i = 0; i < array.length; i++) {
        // Store current element and index in computed
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
      console.warn('Unknown flow control node:', definition.id);
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
    // No connection - check if it's a constant or use default
    if (node.data.config) {
      const pinId = targetHandle.replace('data-in-', '').replace('data-out-', '');
      return node.data.config[pinId];
    }
    return undefined;
  }

  // Find source node
  const sourceNode = flowData.nodes.find((n) => n.id === edge.source);
  if (!sourceNode) return undefined;

  const sourceDefinition = getNodeDefinition(sourceNode.data.definitionId);
  if (!sourceDefinition) return undefined;

  // If source is a constant node, return config value
  if (sourceNode.data.hasConfig && sourceNode.data.config) {
    const outputId = edge.sourceHandle.replace('data-out-', '');
    const value = sourceNode.data.config[outputId];
    context.computed.set(cacheKey, value);
    return value;
  }

  // If source is an event node, get from context
  if (sourceDefinition.category === 'event') {
    const outputId = edge.sourceHandle.replace('data-out-', '');
    const value = context[outputId];
    context.computed.set(cacheKey, value);
    return value;
  }

  // If source is a pure node, compute it
  if (sourceDefinition.category === 'pure') {
    const value = await evaluatePureNode(sourceNode, sourceDefinition, edge.sourceHandle, flowData, context);
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
 * Evaluate a pure node (no side effects, just computation)
 */
async function evaluatePureNode(node, definition, outputHandle, flowData, context) {
  // Gather inputs
  const inputs = {};

  for (const dataInput of definition.dataInputs || []) {
    const value = await evaluateDataPin(
      node,
      `data-in-${dataInput.id}`,
      flowData,
      context
    );
    inputs[dataInput.id] = value;
  }

  // Compute based on node type
  const result = computePureNode(definition.id, inputs, context);

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

    // Math operations
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

    // Boolean logic
    case 'pure-and':
      return Boolean(inputs.a) && Boolean(inputs.b);

    case 'pure-or':
      return Boolean(inputs.a) || Boolean(inputs.b);

    case 'pure-not':
      return !Boolean(inputs.value);

    // Discord data extraction
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

    // Constants are handled in evaluateDataPin

    default:
      console.warn('Unknown pure node:', nodeId);
      return undefined;
  }
}

/**
 * Execute an action (Discord API calls, etc.)
 */
async function executeAction(actionId, inputs, context) {
  const { client, interaction, message, channel, guild, member, user } = context;

  try {
    switch (actionId) {
      case 'action-send-message': {
        const targetChannel = inputs.channel;
        if (!targetChannel || !targetChannel.send) {
          console.error('Invalid channel for send message');
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
          console.error('Invalid message for reply');
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
          console.error('Invalid interaction for reply');
          return null;
        }

        const options = {};
        if (inputs.content) options.content = String(inputs.content);
        if (inputs.embed) options.embeds = [inputs.embed];
        if (inputs.ephemeral) options.ephemeral = true;

        // Check if already replied
        if (inputs.interaction.replied || inputs.interaction.deferred) {
          await inputs.interaction.followUp(options);
        } else {
          await inputs.interaction.reply(options);
        }
        return {};
      }

      case 'action-edit-message': {
        if (!inputs.message || !inputs.message.edit) {
          console.error('Invalid message for edit');
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
          console.error('Invalid message for delete');
          return null;
        }

        await inputs.message.delete();
        return {};
      }

      case 'action-add-reaction': {
        if (!inputs.message || !inputs.message.react) {
          console.error('Invalid message for reaction');
          return null;
        }

        await inputs.message.react(inputs.emoji);
        return {};
      }

      case 'action-add-role': {
        if (!inputs.member || !inputs.member.roles || !inputs.role) {
          console.error('Invalid member or role for add role');
          return null;
        }

        await inputs.member.roles.add(inputs.role);
        return {};
      }

      case 'action-remove-role': {
        if (!inputs.member || !inputs.member.roles || !inputs.role) {
          console.error('Invalid member or role for remove role');
          return null;
        }

        await inputs.member.roles.remove(inputs.role);
        return {};
      }

      case 'action-kick-member': {
        if (!inputs.member || !inputs.member.kick) {
          console.error('Invalid member for kick');
          return null;
        }

        await inputs.member.kick(inputs.reason);
        return {};
      }

      case 'action-ban-member': {
        if (!inputs.member || !inputs.member.ban) {
          console.error('Invalid member for ban');
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
          console.error('Invalid member for timeout');
          return null;
        }

        const duration = inputs.duration * 1000; // Convert to milliseconds
        await inputs.member.timeout(duration, inputs.reason);
        return {};
      }

      case 'action-send-dm': {
        if (!inputs.user || !inputs.user.send) {
          console.error('Invalid user for DM');
          return null;
        }

        const options = {};
        if (inputs.content) options.content = String(inputs.content);
        if (inputs.embed) options.embeds = [inputs.embed];

        const dmMessage = await inputs.user.send(options);
        return { message: dmMessage };
      }

      case 'action-create-embed': {
        const embed = {
          title: inputs.title,
          description: inputs.description,
          color: inputs.color ? parseInt(inputs.color.replace('#', ''), 16) : undefined,
          thumbnail: inputs.thumbnail ? { url: inputs.thumbnail } : undefined,
          image: inputs.image ? { url: inputs.image } : undefined,
          footer: inputs.footer ? { text: inputs.footer } : undefined,
        };

        return { embed };
      }

      default:
        console.warn('Unknown action:', actionId);
        return null;
    }
  } catch (error) {
    console.error(`Error executing action ${actionId}:`, error);
    throw error;
  }
}
