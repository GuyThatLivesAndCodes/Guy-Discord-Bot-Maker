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

  // Add Discord client to context
  const fullContext = {
    ...context,
    client,
  };

  // Execute the flow
  try {
    const result = await executeEventFlow(eventNode, flowData, fullContext);
    return result;
  } catch (error) {
    console.error('[Blueprint] Error executing flow:', error);
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

    // Map Discord event types to blueprint event nodes
    const eventMapping = {
      messageCreate: 'ON_MESSAGE_CREATED',
      messageDelete: 'ON_MESSAGE_DELETED',
      guildMemberAdd: 'ON_MEMBER_JOINED',
      guildMemberRemove: 'ON_MEMBER_LEFT',
      messageReactionAdd: 'ON_REACTION_ADDED',
      voiceStateUpdate: 'ON_VOICE_STATE_CHANGED',
      interactionCreate: 'ON_SLASH_COMMAND',
      ready: 'ON_BOT_READY',
    };

    const expectedDefId = eventMapping[eventType];
    return defId === expectedDefId;
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

    case 'interactionCreate':
      context.interaction = eventData.interaction;
      context.user = eventData.interaction.user;
      context.member = eventData.interaction.member;
      context.channel = eventData.interaction.channel;
      context.guild = eventData.interaction.guild;

      // Add command options
      if (eventData.interaction.options) {
        eventData.interaction.options.data.forEach((opt) => {
          context[opt.name] = opt.value;
        });
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

  // Create context
  const context = createEventContext('interactionCreate', { interaction });

  // Add command options to event node outputs
  if (command.options && command.options.length > 0) {
    command.options.forEach((opt) => {
      const value = interaction.options.get(opt.name)?.value;
      if (value !== undefined) {
        context[opt.name] = value;
      }
    });
  }

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
  const flowData = eventConfig.flowData;

  if (!flowData || !flowData.nodes || flowData.nodes.length === 0) {
    return;
  }

  // Find the appropriate event node
  const eventNode = findEventNode(flowData, eventType);

  if (!eventNode) {
    console.warn(`[Blueprint] No event node found for ${eventType}`);
    return;
  }

  // Create context
  const context = createEventContext(eventType, eventData);

  // Execute the flow
  try {
    await executeBlueprintFlow(eventNode, flowData, context, client);
  } catch (error) {
    console.error(`[Blueprint] Error executing event ${eventType}:`, error);
  }
}

module.exports = {
  executeBlueprintFlow,
  executeBlueprintCommand,
  executeBlueprintEvent,
  findEventNode,
  createEventContext,
  isBlueprintEvent,
};
