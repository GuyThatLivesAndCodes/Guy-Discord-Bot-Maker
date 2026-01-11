/**
 * Node Definitions for UE5 Blueprint-Style Event System
 * Defines all available nodes with their pins and behavior
 */

import { PinTypes } from './pinTypes';

// Node Categories
export const NodeCategory = {
  EVENT: 'event',
  ACTION: 'action',
  PURE: 'pure',
  FLOW_CONTROL: 'flow',
};

// Node Category Colors (for headers)
export const CategoryColors = {
  [NodeCategory.EVENT]: '#e74c3c', // Red
  [NodeCategory.ACTION]: '#3498db', // Blue
  [NodeCategory.PURE]: '#2ecc71', // Green
  [NodeCategory.FLOW_CONTROL]: '#e67e22', // Orange
};

/**
 * Pin Definition Structure:
 * {
 *   id: string,           // Unique ID within the node
 *   label: string,        // Display name
 *   type: PinTypes,       // Data type
 *   optional: boolean,    // Can be left unconnected
 * }
 */

// ============================================================================
// EVENT NODES (Red)
// ============================================================================

export const EventNodes = {
  ON_MESSAGE_CREATED: {
    id: 'event-message-created',
    category: NodeCategory.EVENT,
    label: 'On Message Created',
    description: 'Triggered when a user sends a message',
    icon: '💬',
    execInputs: [],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [],
    dataOutputs: [
      { id: 'message', label: 'Message', type: PinTypes.MESSAGE },
      { id: 'content', label: 'Content', type: PinTypes.STRING },
      { id: 'author', label: 'Author', type: PinTypes.USER },
      { id: 'channel', label: 'Channel', type: PinTypes.CHANNEL },
    ],
    discordEvent: 'messageCreate',
  },

  ON_SLASH_COMMAND: {
    id: 'event-slash-command',
    category: NodeCategory.EVENT,
    label: 'On Slash Command',
    description: 'Triggered when a slash command is used',
    icon: '⚡',
    execInputs: [],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [],
    dataOutputs: [
      { id: 'interaction', label: 'Interaction', type: PinTypes.INTERACTION },
      { id: 'user', label: 'User', type: PinTypes.USER },
      { id: 'channel', label: 'Channel', type: PinTypes.CHANNEL },
    ],
    discordEvent: 'interactionCreate',
    hasCommandOptions: true,
    hasConfig: true,
    defaultConfig: {
      commandName: '',
      commandDescription: 'A slash command',
    },
  },
};

// ============================================================================
// ACTION NODES (Blue)
// ============================================================================

export const ActionNodes = {
  SEND_MESSAGE: {
    id: 'action-send-message',
    category: NodeCategory.ACTION,
    label: 'Send Message',
    description: 'Send a message to a channel',
    icon: '📤',
    execInputs: [{ id: 'exec', label: '' }],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [
      { id: 'channel', label: 'Channel', type: PinTypes.CHANNEL, optional: false },
      { id: 'content', label: 'Content', type: PinTypes.STRING, optional: true },
      { id: 'embed', label: 'Embed', type: PinTypes.EMBED, optional: true },
    ],
    dataOutputs: [
      { id: 'message', label: 'Message', type: PinTypes.MESSAGE },
    ],
  },

  DELETE_MESSAGE: {
    id: 'action-delete-message',
    category: NodeCategory.ACTION,
    label: 'Delete Message',
    description: 'Delete a message',
    icon: '🗑️',
    execInputs: [{ id: 'exec', label: '' }],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [
      { id: 'message', label: 'Message', type: PinTypes.MESSAGE, optional: false },
    ],
    dataOutputs: [],
  },

  REPLY_TO_MESSAGE: {
    id: 'action-reply-message',
    category: NodeCategory.ACTION,
    label: 'Reply to Message',
    description: 'Reply directly to a message',
    icon: '↩️',
    execInputs: [{ id: 'exec', label: '' }],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [
      { id: 'message', label: 'Message', type: PinTypes.MESSAGE, optional: false },
      { id: 'content', label: 'Content', type: PinTypes.STRING, optional: true },
      { id: 'embed', label: 'Embed', type: PinTypes.EMBED, optional: true },
    ],
    dataOutputs: [
      { id: 'reply', label: 'Reply', type: PinTypes.MESSAGE },
    ],
  },

  REPLY_TO_INTERACTION: {
    id: 'action-reply-interaction',
    category: NodeCategory.ACTION,
    label: 'Reply to Interaction',
    description: 'Reply to a slash command or button interaction',
    icon: '💬',
    execInputs: [{ id: 'exec', label: '' }],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [
      { id: 'interaction', label: 'Interaction', type: PinTypes.INTERACTION, optional: false },
      { id: 'content', label: 'Content', type: PinTypes.STRING, optional: true },
      { id: 'embed', label: 'Embed', type: PinTypes.EMBED, optional: true },
      { id: 'ephemeral', label: 'Ephemeral', type: PinTypes.BOOLEAN, optional: true },
    ],
    dataOutputs: [],
  },

  CREATE_EMBED: {
    id: 'action-create-embed',
    category: NodeCategory.ACTION,
    label: 'Create Embed',
    description: 'Create a rich embed object',
    icon: '📋',
    execInputs: [{ id: 'exec', label: '' }],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [
      { id: 'title', label: 'Title', type: PinTypes.STRING, optional: true },
      { id: 'description', label: 'Description', type: PinTypes.STRING, optional: true },
      { id: 'color', label: 'Color', type: PinTypes.STRING, optional: true },
      { id: 'thumbnail', label: 'Thumbnail URL', type: PinTypes.STRING, optional: true },
      { id: 'image', label: 'Image URL', type: PinTypes.STRING, optional: true },
      { id: 'footer', label: 'Footer', type: PinTypes.STRING, optional: true },
    ],
    dataOutputs: [
      { id: 'embed', label: 'Embed', type: PinTypes.EMBED },
    ],
  },
};

// ============================================================================
// PURE NODES (Green)
// ============================================================================

export const PureNodes = {
  // Constants - essential for providing values
  CONSTANT_STRING: {
    id: 'pure-constant-string',
    category: NodeCategory.PURE,
    label: 'String',
    description: 'A text value',
    icon: '📝',
    execInputs: [],
    execOutputs: [],
    dataInputs: [],
    dataOutputs: [
      { id: 'value', label: 'Value', type: PinTypes.STRING },
    ],
    hasConfig: true,
    defaultConfig: { value: '' },
  },

  CONSTANT_BOOLEAN: {
    id: 'pure-constant-boolean',
    category: NodeCategory.PURE,
    label: 'Boolean',
    description: 'A true/false value',
    icon: '✓',
    execInputs: [],
    execOutputs: [],
    dataInputs: [],
    dataOutputs: [
      { id: 'value', label: 'Value', type: PinTypes.BOOLEAN },
    ],
    hasConfig: true,
    defaultConfig: { value: false },
  },

  // Command Options - for slash commands
  OPTION_STRING: {
    id: 'pure-option-string',
    category: NodeCategory.PURE,
    label: 'String Option',
    description: 'A text input option for slash commands',
    icon: '📝',
    execInputs: [],
    execOutputs: [],
    dataInputs: [],
    dataOutputs: [
      { id: 'value', label: 'Value', type: PinTypes.STRING },
    ],
    hasConfig: true,
    defaultConfig: {
      optionName: '',
      description: 'A text option',
      required: false,
    },
    isCommandOption: true,
    optionType: 'STRING',
  },

  OPTION_NUMBER: {
    id: 'pure-option-number',
    category: NodeCategory.PURE,
    label: 'Number Option',
    description: 'A number input option for slash commands',
    icon: '🔢',
    execInputs: [],
    execOutputs: [],
    dataInputs: [],
    dataOutputs: [
      { id: 'value', label: 'Value', type: PinTypes.NUMBER },
    ],
    hasConfig: true,
    defaultConfig: {
      optionName: '',
      description: 'A number option',
      required: false,
    },
    isCommandOption: true,
    optionType: 'NUMBER',
  },

  OPTION_BOOLEAN: {
    id: 'pure-option-boolean',
    category: NodeCategory.PURE,
    label: 'Boolean Option',
    description: 'A true/false option for slash commands',
    icon: '✓',
    execInputs: [],
    execOutputs: [],
    dataInputs: [],
    dataOutputs: [
      { id: 'value', label: 'Value', type: PinTypes.BOOLEAN },
    ],
    hasConfig: true,
    defaultConfig: {
      optionName: '',
      description: 'A true/false option',
      required: false,
    },
    isCommandOption: true,
    optionType: 'BOOLEAN',
  },

  OPTION_USER: {
    id: 'pure-option-user',
    category: NodeCategory.PURE,
    label: 'User Option',
    description: 'A user picker option for slash commands',
    icon: '👤',
    execInputs: [],
    execOutputs: [],
    dataInputs: [],
    dataOutputs: [
      { id: 'value', label: 'Value', type: PinTypes.USER },
    ],
    hasConfig: true,
    defaultConfig: {
      optionName: '',
      description: 'A user option',
      required: false,
    },
    isCommandOption: true,
    optionType: 'USER',
  },

  OPTION_CHANNEL: {
    id: 'pure-option-channel',
    category: NodeCategory.PURE,
    label: 'Channel Option',
    description: 'A channel picker option for slash commands',
    icon: '#',
    execInputs: [],
    execOutputs: [],
    dataInputs: [],
    dataOutputs: [
      { id: 'value', label: 'Value', type: PinTypes.CHANNEL },
    ],
    hasConfig: true,
    defaultConfig: {
      optionName: '',
      description: 'A channel option',
      required: false,
    },
    isCommandOption: true,
    optionType: 'CHANNEL',
  },

  OPTION_ROLE: {
    id: 'pure-option-role',
    category: NodeCategory.PURE,
    label: 'Role Option',
    description: 'A role picker option for slash commands',
    icon: '🎭',
    execInputs: [],
    execOutputs: [],
    dataInputs: [],
    dataOutputs: [
      { id: 'value', label: 'Value', type: PinTypes.ROLE },
    ],
    hasConfig: true,
    defaultConfig: {
      optionName: '',
      description: 'A role option',
      required: false,
    },
    isCommandOption: true,
    optionType: 'ROLE',
  },
};

// ============================================================================
// FLOW CONTROL NODES (Orange)
// ============================================================================

export const FlowControlNodes = {
  // Empty for now - start simple!
};

// ============================================================================
// Combined Node Library
// ============================================================================

export const ALL_NODES = {
  ...EventNodes,
  ...ActionNodes,
  ...PureNodes,
  ...FlowControlNodes,
};

// Helper function to get node definition by ID
export function getNodeDefinition(nodeId) {
  return ALL_NODES[nodeId];
}

// Helper function to get all nodes in a category
export function getNodesByCategory(category) {
  return Object.values(ALL_NODES).filter(node => node.category === category);
}

// Helper function to search nodes
export function searchNodes(query) {
  const lowerQuery = query.toLowerCase();
  return Object.values(ALL_NODES).filter(node =>
    node.label.toLowerCase().includes(lowerQuery) ||
    node.description.toLowerCase().includes(lowerQuery)
  );
}
