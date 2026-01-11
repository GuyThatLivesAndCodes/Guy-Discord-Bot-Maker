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
    execInputs: [], // Events have no exec inputs
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [],
    dataOutputs: [
      { id: 'message', label: 'Message', type: PinTypes.MESSAGE },
      { id: 'content', label: 'Content', type: PinTypes.STRING },
      { id: 'author', label: 'Author', type: PinTypes.USER },
      { id: 'member', label: 'Member', type: PinTypes.MEMBER },
      { id: 'channel', label: 'Channel', type: PinTypes.CHANNEL },
      { id: 'guild', label: 'Guild', type: PinTypes.GUILD },
    ],
    discordEvent: 'messageCreate',
  },

  ON_MESSAGE_DELETED: {
    id: 'event-message-deleted',
    category: NodeCategory.EVENT,
    label: 'On Message Deleted',
    description: 'Triggered when a message is deleted',
    icon: '🗑️',
    execInputs: [],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [],
    dataOutputs: [
      { id: 'message', label: 'Message', type: PinTypes.MESSAGE },
      { id: 'channel', label: 'Channel', type: PinTypes.CHANNEL },
      { id: 'guild', label: 'Guild', type: PinTypes.GUILD },
    ],
    discordEvent: 'messageDelete',
  },

  ON_MEMBER_JOINED: {
    id: 'event-member-joined',
    category: NodeCategory.EVENT,
    label: 'On Member Joined',
    description: 'Triggered when a user joins the server',
    icon: '👋',
    execInputs: [],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [],
    dataOutputs: [
      { id: 'member', label: 'Member', type: PinTypes.MEMBER },
      { id: 'user', label: 'User', type: PinTypes.USER },
      { id: 'guild', label: 'Guild', type: PinTypes.GUILD },
    ],
    discordEvent: 'guildMemberAdd',
  },

  ON_MEMBER_LEFT: {
    id: 'event-member-left',
    category: NodeCategory.EVENT,
    label: 'On Member Left',
    description: 'Triggered when a user leaves the server',
    icon: '👋',
    execInputs: [],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [],
    dataOutputs: [
      { id: 'member', label: 'Member', type: PinTypes.MEMBER },
      { id: 'user', label: 'User', type: PinTypes.USER },
      { id: 'guild', label: 'Guild', type: PinTypes.GUILD },
    ],
    discordEvent: 'guildMemberRemove',
  },

  ON_REACTION_ADDED: {
    id: 'event-reaction-added',
    category: NodeCategory.EVENT,
    label: 'On Reaction Added',
    description: 'Triggered when a user adds a reaction',
    icon: '😀',
    execInputs: [],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [],
    dataOutputs: [
      { id: 'reaction', label: 'Reaction', type: PinTypes.ANY },
      { id: 'user', label: 'User', type: PinTypes.USER },
      { id: 'message', label: 'Message', type: PinTypes.MESSAGE },
      { id: 'emoji', label: 'Emoji', type: PinTypes.STRING },
    ],
    discordEvent: 'messageReactionAdd',
  },

  ON_VOICE_STATE_CHANGED: {
    id: 'event-voice-state-changed',
    category: NodeCategory.EVENT,
    label: 'On Voice State Changed',
    description: 'Triggered when user joins/leaves/moves voice channel',
    icon: '🎤',
    execInputs: [],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [],
    dataOutputs: [
      { id: 'member', label: 'Member', type: PinTypes.MEMBER },
      { id: 'oldChannel', label: 'Old Channel', type: PinTypes.CHANNEL },
      { id: 'newChannel', label: 'New Channel', type: PinTypes.CHANNEL },
      { id: 'guild', label: 'Guild', type: PinTypes.GUILD },
    ],
    discordEvent: 'voiceStateUpdate',
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
      { id: 'member', label: 'Member', type: PinTypes.MEMBER },
      { id: 'channel', label: 'Channel', type: PinTypes.CHANNEL },
      { id: 'guild', label: 'Guild', type: PinTypes.GUILD },
      // Command options will be added dynamically
    ],
    discordEvent: 'interactionCreate',
    hasCommandOptions: true,
  },

  ON_BOT_READY: {
    id: 'event-bot-ready',
    category: NodeCategory.EVENT,
    label: 'On Bot Ready',
    description: 'Triggered when the bot starts up',
    icon: '🤖',
    execInputs: [],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [],
    dataOutputs: [
      { id: 'client', label: 'Client', type: PinTypes.ANY },
    ],
    discordEvent: 'ready',
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
      { id: 'files', label: 'Files', type: PinTypes.ARRAY, optional: true },
    ],
    dataOutputs: [
      { id: 'message', label: 'Message', type: PinTypes.MESSAGE },
    ],
  },

  REPLY_TO_MESSAGE: {
    id: 'action-reply-message',
    category: NodeCategory.ACTION,
    label: 'Reply to Message',
    description: 'Reply to a specific message',
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

  EDIT_MESSAGE: {
    id: 'action-edit-message',
    category: NodeCategory.ACTION,
    label: 'Edit Message',
    description: 'Edit an existing message',
    icon: '✏️',
    execInputs: [{ id: 'exec', label: '' }],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [
      { id: 'message', label: 'Message', type: PinTypes.MESSAGE, optional: false },
      { id: 'content', label: 'Content', type: PinTypes.STRING, optional: true },
      { id: 'embed', label: 'Embed', type: PinTypes.EMBED, optional: true },
    ],
    dataOutputs: [],
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

  ADD_REACTION: {
    id: 'action-add-reaction',
    category: NodeCategory.ACTION,
    label: 'Add Reaction',
    description: 'React to a message with an emoji',
    icon: '👍',
    execInputs: [{ id: 'exec', label: '' }],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [
      { id: 'message', label: 'Message', type: PinTypes.MESSAGE, optional: false },
      { id: 'emoji', label: 'Emoji', type: PinTypes.STRING, optional: false },
    ],
    dataOutputs: [],
  },

  ADD_ROLE: {
    id: 'action-add-role',
    category: NodeCategory.ACTION,
    label: 'Add Role',
    description: 'Give a role to a member',
    icon: '➕',
    execInputs: [{ id: 'exec', label: '' }],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [
      { id: 'member', label: 'Member', type: PinTypes.MEMBER, optional: false },
      { id: 'role', label: 'Role', type: PinTypes.ROLE, optional: false },
    ],
    dataOutputs: [],
  },

  REMOVE_ROLE: {
    id: 'action-remove-role',
    category: NodeCategory.ACTION,
    label: 'Remove Role',
    description: 'Remove a role from a member',
    icon: '➖',
    execInputs: [{ id: 'exec', label: '' }],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [
      { id: 'member', label: 'Member', type: PinTypes.MEMBER, optional: false },
      { id: 'role', label: 'Role', type: PinTypes.ROLE, optional: false },
    ],
    dataOutputs: [],
  },

  KICK_MEMBER: {
    id: 'action-kick-member',
    category: NodeCategory.ACTION,
    label: 'Kick Member',
    description: 'Kick a member from the server',
    icon: '👢',
    execInputs: [{ id: 'exec', label: '' }],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [
      { id: 'member', label: 'Member', type: PinTypes.MEMBER, optional: false },
      { id: 'reason', label: 'Reason', type: PinTypes.STRING, optional: true },
    ],
    dataOutputs: [],
  },

  BAN_MEMBER: {
    id: 'action-ban-member',
    category: NodeCategory.ACTION,
    label: 'Ban Member',
    description: 'Ban a member from the server',
    icon: '🔨',
    execInputs: [{ id: 'exec', label: '' }],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [
      { id: 'member', label: 'Member', type: PinTypes.MEMBER, optional: false },
      { id: 'reason', label: 'Reason', type: PinTypes.STRING, optional: true },
      { id: 'deleteMessageDays', label: 'Delete Message Days', type: PinTypes.NUMBER, optional: true },
    ],
    dataOutputs: [],
  },

  TIMEOUT_MEMBER: {
    id: 'action-timeout-member',
    category: NodeCategory.ACTION,
    label: 'Timeout Member',
    description: 'Timeout a member for a duration',
    icon: '⏰',
    execInputs: [{ id: 'exec', label: '' }],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [
      { id: 'member', label: 'Member', type: PinTypes.MEMBER, optional: false },
      { id: 'duration', label: 'Duration (seconds)', type: PinTypes.NUMBER, optional: false },
      { id: 'reason', label: 'Reason', type: PinTypes.STRING, optional: true },
    ],
    dataOutputs: [],
  },

  SEND_DM: {
    id: 'action-send-dm',
    category: NodeCategory.ACTION,
    label: 'Send DM',
    description: 'Send a direct message to a user',
    icon: '✉️',
    execInputs: [{ id: 'exec', label: '' }],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [
      { id: 'user', label: 'User', type: PinTypes.USER, optional: false },
      { id: 'content', label: 'Content', type: PinTypes.STRING, optional: true },
      { id: 'embed', label: 'Embed', type: PinTypes.EMBED, optional: true },
    ],
    dataOutputs: [
      { id: 'message', label: 'Message', type: PinTypes.MESSAGE },
    ],
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
  // String Operations
  JOIN_STRINGS: {
    id: 'pure-join-strings',
    category: NodeCategory.PURE,
    label: 'Join Strings',
    description: 'Concatenate multiple strings',
    icon: '🔗',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'a', label: 'String A', type: PinTypes.STRING, optional: false },
      { id: 'b', label: 'String B', type: PinTypes.STRING, optional: false },
      { id: 'separator', label: 'Separator', type: PinTypes.STRING, optional: true },
    ],
    dataOutputs: [
      { id: 'result', label: 'Result', type: PinTypes.STRING },
    ],
  },

  STRING_CONTAINS: {
    id: 'pure-string-contains',
    category: NodeCategory.PURE,
    label: 'String Contains',
    description: 'Check if string contains substring',
    icon: '🔍',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'string', label: 'String', type: PinTypes.STRING, optional: false },
      { id: 'substring', label: 'Substring', type: PinTypes.STRING, optional: false },
    ],
    dataOutputs: [
      { id: 'result', label: 'Result', type: PinTypes.BOOLEAN },
    ],
  },

  STRING_UPPERCASE: {
    id: 'pure-string-uppercase',
    category: NodeCategory.PURE,
    label: 'String Uppercase',
    description: 'Convert string to uppercase',
    icon: '🔠',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'string', label: 'String', type: PinTypes.STRING, optional: false },
    ],
    dataOutputs: [
      { id: 'result', label: 'Result', type: PinTypes.STRING },
    ],
  },

  STRING_LOWERCASE: {
    id: 'pure-string-lowercase',
    category: NodeCategory.PURE,
    label: 'String Lowercase',
    description: 'Convert string to lowercase',
    icon: '🔡',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'string', label: 'String', type: PinTypes.STRING, optional: false },
    ],
    dataOutputs: [
      { id: 'result', label: 'Result', type: PinTypes.STRING },
    ],
  },

  // Math Operations
  ADD_NUMBERS: {
    id: 'pure-add',
    category: NodeCategory.PURE,
    label: 'Add',
    description: 'Add two numbers',
    icon: '➕',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'a', label: 'A', type: PinTypes.NUMBER, optional: false },
      { id: 'b', label: 'B', type: PinTypes.NUMBER, optional: false },
    ],
    dataOutputs: [
      { id: 'result', label: 'Result', type: PinTypes.NUMBER },
    ],
  },

  SUBTRACT_NUMBERS: {
    id: 'pure-subtract',
    category: NodeCategory.PURE,
    label: 'Subtract',
    description: 'Subtract two numbers',
    icon: '➖',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'a', label: 'A', type: PinTypes.NUMBER, optional: false },
      { id: 'b', label: 'B', type: PinTypes.NUMBER, optional: false },
    ],
    dataOutputs: [
      { id: 'result', label: 'Result', type: PinTypes.NUMBER },
    ],
  },

  MULTIPLY_NUMBERS: {
    id: 'pure-multiply',
    category: NodeCategory.PURE,
    label: 'Multiply',
    description: 'Multiply two numbers',
    icon: '✖️',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'a', label: 'A', type: PinTypes.NUMBER, optional: false },
      { id: 'b', label: 'B', type: PinTypes.NUMBER, optional: false },
    ],
    dataOutputs: [
      { id: 'result', label: 'Result', type: PinTypes.NUMBER },
    ],
  },

  DIVIDE_NUMBERS: {
    id: 'pure-divide',
    category: NodeCategory.PURE,
    label: 'Divide',
    description: 'Divide two numbers',
    icon: '➗',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'a', label: 'A', type: PinTypes.NUMBER, optional: false },
      { id: 'b', label: 'B', type: PinTypes.NUMBER, optional: false },
    ],
    dataOutputs: [
      { id: 'result', label: 'Result', type: PinTypes.NUMBER },
    ],
  },

  RANDOM_NUMBER: {
    id: 'pure-random',
    category: NodeCategory.PURE,
    label: 'Random Number',
    description: 'Generate random number between min and max',
    icon: '🎲',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'min', label: 'Min', type: PinTypes.NUMBER, optional: false },
      { id: 'max', label: 'Max', type: PinTypes.NUMBER, optional: false },
    ],
    dataOutputs: [
      { id: 'result', label: 'Result', type: PinTypes.NUMBER },
    ],
  },

  // Comparison
  EQUALS: {
    id: 'pure-equals',
    category: NodeCategory.PURE,
    label: 'Equals',
    description: 'Check if A equals B',
    icon: '=',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'a', label: 'A', type: PinTypes.ANY, optional: false },
      { id: 'b', label: 'B', type: PinTypes.ANY, optional: false },
    ],
    dataOutputs: [
      { id: 'result', label: 'Result', type: PinTypes.BOOLEAN },
    ],
  },

  GREATER_THAN: {
    id: 'pure-greater',
    category: NodeCategory.PURE,
    label: 'Greater Than',
    description: 'Check if A > B',
    icon: '>',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'a', label: 'A', type: PinTypes.NUMBER, optional: false },
      { id: 'b', label: 'B', type: PinTypes.NUMBER, optional: false },
    ],
    dataOutputs: [
      { id: 'result', label: 'Result', type: PinTypes.BOOLEAN },
    ],
  },

  LESS_THAN: {
    id: 'pure-less',
    category: NodeCategory.PURE,
    label: 'Less Than',
    description: 'Check if A < B',
    icon: '<',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'a', label: 'A', type: PinTypes.NUMBER, optional: false },
      { id: 'b', label: 'B', type: PinTypes.NUMBER, optional: false },
    ],
    dataOutputs: [
      { id: 'result', label: 'Result', type: PinTypes.BOOLEAN },
    ],
  },

  // Boolean Logic
  AND: {
    id: 'pure-and',
    category: NodeCategory.PURE,
    label: 'AND',
    description: 'Logical AND',
    icon: '∧',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'a', label: 'A', type: PinTypes.BOOLEAN, optional: false },
      { id: 'b', label: 'B', type: PinTypes.BOOLEAN, optional: false },
    ],
    dataOutputs: [
      { id: 'result', label: 'Result', type: PinTypes.BOOLEAN },
    ],
  },

  OR: {
    id: 'pure-or',
    category: NodeCategory.PURE,
    label: 'OR',
    description: 'Logical OR',
    icon: '∨',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'a', label: 'A', type: PinTypes.BOOLEAN, optional: false },
      { id: 'b', label: 'B', type: PinTypes.BOOLEAN, optional: false },
    ],
    dataOutputs: [
      { id: 'result', label: 'Result', type: PinTypes.BOOLEAN },
    ],
  },

  NOT: {
    id: 'pure-not',
    category: NodeCategory.PURE,
    label: 'NOT',
    description: 'Logical NOT',
    icon: '¬',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'value', label: 'Value', type: PinTypes.BOOLEAN, optional: false },
    ],
    dataOutputs: [
      { id: 'result', label: 'Result', type: PinTypes.BOOLEAN },
    ],
  },

  // Discord Data Extraction
  GET_USER_NAME: {
    id: 'pure-get-user-name',
    category: NodeCategory.PURE,
    label: 'Get User Name',
    description: 'Extract username from user',
    icon: '👤',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'user', label: 'User', type: PinTypes.USER, optional: false },
    ],
    dataOutputs: [
      { id: 'username', label: 'Username', type: PinTypes.STRING },
    ],
  },

  GET_USER_ID: {
    id: 'pure-get-user-id',
    category: NodeCategory.PURE,
    label: 'Get User ID',
    description: 'Extract ID from user',
    icon: '🆔',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'user', label: 'User', type: PinTypes.USER, optional: false },
    ],
    dataOutputs: [
      { id: 'id', label: 'ID', type: PinTypes.STRING },
    ],
  },

  GET_CHANNEL_NAME: {
    id: 'pure-get-channel-name',
    category: NodeCategory.PURE,
    label: 'Get Channel Name',
    description: 'Extract channel name',
    icon: '#',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'channel', label: 'Channel', type: PinTypes.CHANNEL, optional: false },
    ],
    dataOutputs: [
      { id: 'name', label: 'Name', type: PinTypes.STRING },
    ],
  },

  GET_GUILD_NAME: {
    id: 'pure-get-guild-name',
    category: NodeCategory.PURE,
    label: 'Get Guild Name',
    description: 'Extract guild/server name',
    icon: '🏛️',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'guild', label: 'Guild', type: PinTypes.GUILD, optional: false },
    ],
    dataOutputs: [
      { id: 'name', label: 'Name', type: PinTypes.STRING },
    ],
  },

  GET_GUILD_MEMBER_COUNT: {
    id: 'pure-get-member-count',
    category: NodeCategory.PURE,
    label: 'Get Member Count',
    description: 'Get total member count',
    icon: '👥',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'guild', label: 'Guild', type: PinTypes.GUILD, optional: false },
    ],
    dataOutputs: [
      { id: 'count', label: 'Count', type: PinTypes.NUMBER },
    ],
  },

  HAS_ROLE: {
    id: 'pure-has-role',
    category: NodeCategory.PURE,
    label: 'Has Role',
    description: 'Check if member has a specific role',
    icon: '✅',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'member', label: 'Member', type: PinTypes.MEMBER, optional: false },
      { id: 'role', label: 'Role', type: PinTypes.ROLE, optional: false },
    ],
    dataOutputs: [
      { id: 'hasRole', label: 'Has Role', type: PinTypes.BOOLEAN },
    ],
  },

  // Type Conversion
  TO_STRING: {
    id: 'pure-to-string',
    category: NodeCategory.PURE,
    label: 'To String',
    description: 'Convert value to string',
    icon: '📝',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'value', label: 'Value', type: PinTypes.ANY, optional: false },
    ],
    dataOutputs: [
      { id: 'string', label: 'String', type: PinTypes.STRING },
    ],
  },

  TO_NUMBER: {
    id: 'pure-to-number',
    category: NodeCategory.PURE,
    label: 'To Number',
    description: 'Convert value to number',
    icon: '🔢',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'value', label: 'Value', type: PinTypes.ANY, optional: false },
    ],
    dataOutputs: [
      { id: 'number', label: 'Number', type: PinTypes.NUMBER },
    ],
  },

  // Constants
  CONSTANT_STRING: {
    id: 'pure-constant-string',
    category: NodeCategory.PURE,
    label: 'String Constant',
    description: 'A constant string value',
    icon: '📌',
    execInputs: [],
    execOutputs: [],
    dataInputs: [],
    dataOutputs: [
      { id: 'value', label: 'Value', type: PinTypes.STRING },
    ],
    hasConfig: true,
    defaultConfig: { value: '' },
  },

  CONSTANT_NUMBER: {
    id: 'pure-constant-number',
    category: NodeCategory.PURE,
    label: 'Number Constant',
    description: 'A constant number value',
    icon: '🔢',
    execInputs: [],
    execOutputs: [],
    dataInputs: [],
    dataOutputs: [
      { id: 'value', label: 'Value', type: PinTypes.NUMBER },
    ],
    hasConfig: true,
    defaultConfig: { value: 0 },
  },

  CONSTANT_BOOLEAN: {
    id: 'pure-constant-boolean',
    category: NodeCategory.PURE,
    label: 'Boolean Constant',
    description: 'A constant boolean value',
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
};

// ============================================================================
// FLOW CONTROL NODES (Orange)
// ============================================================================

export const FlowControlNodes = {
  BRANCH: {
    id: 'flow-branch',
    category: NodeCategory.FLOW_CONTROL,
    label: 'Branch',
    description: 'Conditional execution (if/else)',
    icon: '🔀',
    execInputs: [{ id: 'exec', label: '' }],
    execOutputs: [
      { id: 'true', label: 'True' },
      { id: 'false', label: 'False' },
    ],
    dataInputs: [
      { id: 'condition', label: 'Condition', type: PinTypes.BOOLEAN, optional: false },
    ],
    dataOutputs: [],
  },

  DELAY: {
    id: 'flow-delay',
    category: NodeCategory.FLOW_CONTROL,
    label: 'Delay',
    description: 'Wait for a duration before continuing',
    icon: '⏱️',
    execInputs: [{ id: 'exec', label: '' }],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [
      { id: 'duration', label: 'Duration (seconds)', type: PinTypes.NUMBER, optional: false },
    ],
    dataOutputs: [],
  },

  SEQUENCE: {
    id: 'flow-sequence',
    category: NodeCategory.FLOW_CONTROL,
    label: 'Sequence',
    description: 'Execute multiple paths in order',
    icon: '📝',
    execInputs: [{ id: 'exec', label: '' }],
    execOutputs: [
      { id: 'then1', label: 'Then 1' },
      { id: 'then2', label: 'Then 2' },
      { id: 'then3', label: 'Then 3' },
    ],
    dataInputs: [],
    dataOutputs: [],
  },

  FOR_EACH: {
    id: 'flow-foreach',
    category: NodeCategory.FLOW_CONTROL,
    label: 'For Each',
    description: 'Iterate over array elements',
    icon: '🔄',
    execInputs: [{ id: 'exec', label: '' }],
    execOutputs: [
      { id: 'loopBody', label: 'Loop Body' },
      { id: 'completed', label: 'Completed' },
    ],
    dataInputs: [
      { id: 'array', label: 'Array', type: PinTypes.ARRAY, optional: false },
    ],
    dataOutputs: [
      { id: 'element', label: 'Element', type: PinTypes.ANY },
      { id: 'index', label: 'Index', type: PinTypes.NUMBER },
    ],
  },
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
