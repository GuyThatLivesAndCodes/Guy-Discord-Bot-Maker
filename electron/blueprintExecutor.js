/**
 * Blueprint Executor - Integration layer for botRunner.js
 * Executes blueprint-style events using the new execution engine
 */

// This will be required from the renderer process via webpack/electron integration
// For now, we'll define the core execution logic here

/**
 * Execute a blueprint event flow
 */
async function executeBlueprintFlow(eventNode, flowData, context, client) {
  // Import execution engine (CommonJS version)
  const { executeEventFlow } = require('./executionEngine.cjs');

  client.log('info', `[BP] executeBlueprintFlow: node=${eventNode.id}`);

  // Add Discord client to context
  const fullContext = {
    ...context,
    client,
  };

  // Execute the flow
  try {
    client.log('info', '[BP] Calling executeEventFlow in execution engine...');
    const result = await executeEventFlow(eventNode, flowData, fullContext);
    client.log('info', '[BP] executeEventFlow returned successfully');
    return result;
  } catch (error) {
    client.log('error', `[BP] Error in executeEventFlow: ${error.message}`);
    console.error('[Blueprint] Full error:', error);
    throw error;
  }
}

/**
 * Find the event node in a blueprint graph
 */
function findEventNode(flowData, eventType) {
  // Look for a node with the matching event type
  return flowData.nodes.find((node) => {
    if (node.type !== 'blueprintNode') return false;

    const defId = node.data?.definitionId;
    if (!defId) return false;

    // Map Discord event types to blueprint event nodes (support both old and new formats)
    const eventMapping = {
      messageCreate: ['event-message-created', 'ON_MESSAGE_CREATED'],
      messageDelete: ['event-message-deleted', 'ON_MESSAGE_DELETED'],
      messageUpdate: ['event-message-updated', 'ON_MESSAGE_UPDATED'],
      guildMemberAdd: ['event-member-join', 'ON_MEMBER_JOINED'],
      guildMemberRemove: ['event-member-leave', 'ON_MEMBER_LEFT'],
      messageReactionAdd: ['event-reaction-add', 'ON_REACTION_ADDED'],
      messageReactionRemove: ['event-reaction-remove', 'ON_REACTION_REMOVED'],
      voiceStateUpdate: ['event-voice-state-update', 'ON_VOICE_STATE_CHANGED'],
      voiceJoin: ['event-voice-join'],
      voiceLeave: ['event-voice-leave'],
      interactionCreate: ['event-slash-command', 'ON_SLASH_COMMAND'],
      ready: ['event-bot-ready', 'ON_BOT_READY'],
    };

    const expectedDefIds = eventMapping[eventType];
    return expectedDefIds && expectedDefIds.includes(defId);
  });
}

/**
 * Convert Discord event data to blueprint context
 */
function createEventContext(eventType, eventData) {
  const context = {};

  switch (eventType) {
    case 'messageCreate':
      context.message = eventData.message;
      context.content = eventData.message.content;
      context.author = eventData.message.author;
      context.member = eventData.message.member;
      context.channel = eventData.message.channel;
      context.guild = eventData.message.guild;
      break;

    case 'messageDelete':
      context.message = eventData.message;
      context.channel = eventData.message.channel;
      context.guild = eventData.message.guild;
      break;

    case 'guildMemberAdd':
    case 'guildMemberRemove':
      context.member = eventData.member;
      context.user = eventData.member.user;
      context.guild = eventData.member.guild;
      break;

    case 'messageReactionAdd':
      context.reaction = eventData.reaction;
      context.user = eventData.user;
      context.message = eventData.reaction.message;
      context.emoji = eventData.reaction.emoji.name;
      break;

    case 'voiceStateUpdate':
      context.member = eventData.newState.member;
      context.oldChannel = eventData.oldState.channel;
      context.newChannel = eventData.newState.channel;
      context.guild = eventData.newState.guild;
      break;

    case 'voiceJoin':
    case 'voiceLeave':
      context.member = eventData.member;
      context.channel = eventData.channel;
      context.guild = eventData.guild;
      break;

    case 'interactionCreate':
      context.interaction = eventData.interaction;
      context.user = eventData.interaction.user;
      context.member = eventData.interaction.member;
      context.channel = eventData.interaction.channel;
      context.guild = eventData.interaction.guild;

      // Add command options - handle both legacy and new option systems
      if (eventData.interaction.options) {
        // For slash commands, options come from interaction.options
        const options = eventData.interaction.options;
        if (options.data && Array.isArray(options.data)) {
          options.data.forEach((opt) => {
            // Store option values for option nodes to access
            // Priority: channel/user/role objects first (they have full object data), then value (for strings/numbers)
            context[`option_${opt.name}`] = opt.channel || opt.user || opt.role || opt.value;
          });
        }
      }
      break;

    case 'ready':
      context.client = eventData.client;
      break;

    default:
      console.warn('[Blueprint] Unknown event type:', eventType);
  }

  return context;
}

/**
 * Check if an event uses the new blueprint system
 */
function isBlueprintEvent(eventConfig) {
  // Check if the event has nodes with the blueprintNode type
  if (!eventConfig.flowData || !eventConfig.flowData.nodes) return false;

  return eventConfig.flowData.nodes.some((node) => node.type === 'blueprintNode');
}

/**
 * Extract slash command configuration from a blueprint
 * Looks for ON_SLASH_COMMAND node and associated option nodes
 */
function extractCommandConfiguration(flowData) {
  if (!flowData || !flowData.nodes) {
    return null;
  }

  // Find the ON_SLASH_COMMAND event node (support both old and new formats)
  const commandNode = flowData.nodes.find((node) =>
    node.type === 'blueprintNode' &&
    (node.data?.definitionId === 'event-slash-command' || node.data?.definitionId === 'ON_SLASH_COMMAND')
  );

  if (!commandNode) {
    return null;
  }

  // Get command name and description from node config
  const commandName = commandNode.data?.config?.commandName || '';
  const commandDescription = commandNode.data?.config?.commandDescription || 'A slash command';

  if (!commandName) {
    console.warn('[Blueprint] ON_SLASH_COMMAND node has no command name configured');
    return null;
  }

  // Find all option nodes in the graph (support both old and new formats)
  const optionNodes = flowData.nodes.filter((node) =>
    node.type === 'blueprintNode' &&
    node.data?.definitionId &&
    (node.data.definitionId.startsWith('OPTION_') || node.data.definitionId.startsWith('pure-option-'))
  );

  // Build options array
  const options = optionNodes.map((optionNode) => {
    const optionDef = optionNode.data?.definitionId;
    const config = optionNode.data?.config || {};

    // Map option definition IDs to Discord types (support both old and new formats)
    const typeMapping = {
      'OPTION_STRING': 'STRING',
      'OPTION_NUMBER': 'NUMBER',
      'OPTION_BOOLEAN': 'BOOLEAN',
      'OPTION_USER': 'USER',
      'OPTION_CHANNEL': 'CHANNEL',
      'OPTION_ROLE': 'ROLE',
      'pure-option-string': 'STRING',
      'pure-option-number': 'NUMBER',
      'pure-option-boolean': 'BOOLEAN',
      'pure-option-user': 'USER',
      'pure-option-channel': 'CHANNEL',
      'pure-option-role': 'ROLE',
    };

    return {
      name: config.optionName || 'option',
      description: config.description || 'An option',
      required: config.required || false,
      type: typeMapping[optionDef] || 'STRING',
    };
  }).filter(opt => opt.name && opt.name !== 'option'); // Filter out unconfigured options

  return {
    name: commandName,
    description: commandDescription,
    options: options,
  };
}

/**
 * Execute a blueprint command (slash command)
 */
async function executeBlueprintCommand(interaction, command, client) {
  const flowData = command.flowData;

  if (!flowData || !flowData.nodes || flowData.nodes.length === 0) {
    await interaction.reply({
      content: 'This command has no actions configured.',
      ephemeral: true,
    });
    return;
  }

  // Find the ON_SLASH_COMMAND event node
  const eventNode = findEventNode(flowData, 'interactionCreate');

  if (!eventNode) {
    console.error('[Blueprint] No ON_SLASH_COMMAND event node found');
    await interaction.reply({
      content: 'Command configuration error: No event node found.',
      ephemeral: true,
    });
    return;
  }

  // Create context (this already handles options via createEventContext)
  const context = createEventContext('interactionCreate', { interaction });

  // Execute the flow
  try {
    await executeBlueprintFlow(eventNode, flowData, context, client);
  } catch (error) {
    console.error('[Blueprint] Error executing command:', error);

    // Try to send error message
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: 'An error occurred while executing this command.',
          ephemeral: true,
        });
      } else {
        await interaction.followUp({
          content: 'An error occurred while executing this command.',
          ephemeral: true,
        });
      }
    } catch (replyError) {
      console.error('[Blueprint] Could not send error message:', replyError);
    }
  }
}

/**
 * Execute a blueprint Discord event (message, member join, etc.)
 */
async function executeBlueprintEvent(eventType, eventData, eventConfig, client) {
  // Use client.log to show in UI logs
  client.log('info', `[BP] executeBlueprintEvent called: ${eventType}`);

  const flowData = eventConfig.flowData;

  const nodeCount = flowData?.nodes?.length || 0;
  const edgeCount = flowData?.edges?.length || 0;
  client.log('info', `[BP] FlowData: hasData=${!!flowData}, nodes=${nodeCount}, edges=${edgeCount}`);

  if (!flowData || !flowData.nodes || flowData.nodes.length === 0) {
    client.log('error', '[BP] No flowData or nodes found!');
    return;
  }

  // Find the appropriate event node
  const eventNode = findEventNode(flowData, eventType);

  if (!eventNode) {
    client.log('error', `[BP] No event node found for ${eventType}`);
    const nodeList = flowData.nodes.map(n => n.data?.definitionId || 'unknown').join(', ');
    client.log('info', `[BP] Available nodes: ${nodeList}`);
    return;
  }

  client.log('info', `[BP] Event node found: ${eventNode.data?.definitionId}`);

  // Create context
  const context = createEventContext(eventType, eventData);

  const contextKeys = Object.keys(context).join(', ');
  client.log('info', `[BP] Context keys: ${contextKeys}`);
  client.log('info', `[BP] Has message: ${!!context.message}, has channel: ${!!context.channel}`);

  // Execute the flow
  try {
    client.log('info', '[BP] Starting flow execution...');
    await executeBlueprintFlow(eventNode, flowData, context, client);
    client.log('success', '[BP] Flow execution completed!');
  } catch (error) {
    client.log('error', `[BP] Execution error: ${error.message}`);
    console.error('[Blueprint] Full error:', error);
    console.error('[Blueprint] Stack:', error.stack);
  }
}

module.exports = {
  executeBlueprintFlow,
  executeBlueprintCommand,
  executeBlueprintEvent,
  findEventNode,
  createEventContext,
  isBlueprintEvent,
  extractCommandConfiguration,
};
