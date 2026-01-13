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

  ON_MESSAGE_UPDATED: {
    id: 'event-message-updated',
    category: NodeCategory.EVENT,
    label: 'On Message Updated',
    description: 'Triggered when a message is edited',
    icon: '✏️',
    execInputs: [],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [],
    dataOutputs: [
      { id: 'oldMessage', label: 'Old Message', type: PinTypes.MESSAGE },
      { id: 'newMessage', label: 'New Message', type: PinTypes.MESSAGE },
      { id: 'channel', label: 'Channel', type: PinTypes.CHANNEL },
    ],
    discordEvent: 'messageUpdate',
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
    ],
    discordEvent: 'messageDelete',
  },

  ON_VOICE_JOIN: {
    id: 'event-voice-join',
    category: NodeCategory.EVENT,
    label: 'On Voice Join',
    description: 'Triggered when someone joins a voice channel',
    icon: '🔊',
    execInputs: [],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [],
    dataOutputs: [
      { id: 'member', label: 'Member', type: PinTypes.MEMBER },
      { id: 'channel', label: 'Channel', type: PinTypes.CHANNEL },
      { id: 'guild', label: 'Guild', type: PinTypes.GUILD },
    ],
    discordEvent: 'voiceStateUpdate',
  },

  ON_VOICE_LEAVE: {
    id: 'event-voice-leave',
    category: NodeCategory.EVENT,
    label: 'On Voice Leave',
    description: 'Triggered when someone leaves a voice channel',
    icon: '🔇',
    execInputs: [],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [],
    dataOutputs: [
      { id: 'member', label: 'Member', type: PinTypes.MEMBER },
      { id: 'channel', label: 'Channel', type: PinTypes.CHANNEL },
      { id: 'guild', label: 'Guild', type: PinTypes.GUILD },
    ],
    discordEvent: 'voiceStateUpdate',
  },

  ON_AUDIO_START: {
    id: 'event-audio-start',
    category: NodeCategory.EVENT,
    label: 'On Audio Start',
    description: 'Triggered when audio playback starts',
    icon: '▶️',
    execInputs: [],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [],
    dataOutputs: [
      { id: 'guild', label: 'Guild', type: PinTypes.GUILD },
    ],
  },

  ON_AUDIO_END: {
    id: 'event-audio-end',
    category: NodeCategory.EVENT,
    label: 'On Audio End',
    description: 'Triggered when audio playback ends',
    icon: '⏹️',
    execInputs: [],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [],
    dataOutputs: [
      { id: 'guild', label: 'Guild', type: PinTypes.GUILD },
    ],
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

  SET_PRESENCE: {
    id: 'action-set-presence',
    category: NodeCategory.ACTION,
    label: 'Set Bot Presence',
    description: 'Set the bot\'s status and activity',
    icon: '🎮',
    execInputs: [{ id: 'exec', label: '' }],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [
      { id: 'activityType', label: 'Activity Type', type: PinTypes.STRING, optional: true },
      { id: 'activityName', label: 'Activity Name', type: PinTypes.STRING, optional: true },
      { id: 'status', label: 'Status', type: PinTypes.STRING, optional: true },
      { id: 'url', label: 'Stream URL', type: PinTypes.STRING, optional: true },
    ],
    dataOutputs: [],
  },

  JOIN_VOICE_CHANNEL: {
    id: 'action-join-voice',
    category: NodeCategory.ACTION,
    label: 'Join Voice Channel',
    description: 'Make the bot join a voice channel',
    icon: '🎤',
    execInputs: [{ id: 'exec', label: '' }],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [
      { id: 'channel', label: 'Voice Channel', type: PinTypes.CHANNEL, optional: false },
    ],
    dataOutputs: [],
  },

  LEAVE_VOICE_CHANNEL: {
    id: 'action-leave-voice',
    category: NodeCategory.ACTION,
    label: 'Leave Voice Channel',
    description: 'Make the bot leave a voice channel',
    icon: '🚪',
    execInputs: [{ id: 'exec', label: '' }],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [
      { id: 'guild', label: 'Guild', type: PinTypes.GUILD, optional: false },
    ],
    dataOutputs: [],
  },

  PLAY_SOUND: {
    id: 'action-play-sound',
    category: NodeCategory.ACTION,
    label: 'Play Sound In VC',
    description: 'Play an audio file in a voice channel',
    icon: '🔊',
    execInputs: [{ id: 'exec', label: '' }],
    execOutputs: [
      { id: 'exec', label: '' },
      { id: 'onStart', label: 'On Start' },
      { id: 'onEnd', label: 'On End' },
    ],
    dataInputs: [
      { id: 'channel', label: 'Voice Channel', type: PinTypes.CHANNEL, optional: false },
      { id: 'filePath', label: 'File Path', type: PinTypes.STRING, optional: false },
      { id: 'volume', label: 'Volume', type: PinTypes.NUMBER, optional: true },
    ],
    dataOutputs: [],
  },

  STOP_SOUND: {
    id: 'action-stop-sound',
    category: NodeCategory.ACTION,
    label: 'Stop Sound In VC',
    description: 'Stop audio playback in a voice channel',
    icon: '⏹️',
    execInputs: [{ id: 'exec', label: '' }],
    execOutputs: [{ id: 'exec', label: '' }],
    dataInputs: [
      { id: 'guild', label: 'Guild', type: PinTypes.GUILD, optional: false },
    ],
    dataOutputs: [],
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

  OPTION_ATTACHMENT: {
    id: 'pure-option-attachment',
    category: NodeCategory.PURE,
    label: 'Attachment Option',
    description: 'A file upload option for slash commands',
    icon: '📎',
    execInputs: [],
    execOutputs: [],
    dataInputs: [],
    dataOutputs: [
      { id: 'value', label: 'Value', type: PinTypes.ATTACHMENT },
    ],
    hasConfig: true,
    defaultConfig: {
      optionName: '',
      description: 'A file attachment',
      required: false,
    },
    isCommandOption: true,
    optionType: 'ATTACHMENT',
  },

  // ============================================================================
  // STRING OPERATIONS
  // ============================================================================

  STRING_JOIN: {
    id: 'pure-string-join',
    category: NodeCategory.PURE,
    label: 'Join Strings',
    description: 'Concatenate multiple strings together',
    icon: '🔗',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'string1', label: 'String 1', type: PinTypes.STRING, optional: true },
      { id: 'string2', label: 'String 2', type: PinTypes.STRING, optional: true },
    ],
    dataOutputs: [
      { id: 'result', label: 'Result', type: PinTypes.STRING },
    ],
    supportsDynamicInputs: true,
  },

  STRING_EQUALS: {
    id: 'pure-string-equals',
    category: NodeCategory.PURE,
    label: 'Text Equals',
    description: 'Check if two strings are equal',
    icon: '=',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'a', label: 'Text A', type: PinTypes.STRING, optional: false },
      { id: 'b', label: 'Text B', type: PinTypes.STRING, optional: false },
      { id: 'caseSensitive', label: 'Case Sensitive', type: PinTypes.BOOLEAN, optional: true },
    ],
    dataOutputs: [
      { id: 'result', label: 'Result', type: PinTypes.BOOLEAN },
    ],
  },

  STRING_CONTAINS: {
    id: 'pure-string-contains',
    category: NodeCategory.PURE,
    label: 'Text Contains',
    description: 'Check if text contains substring',
    icon: '🔍',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'text', label: 'Text', type: PinTypes.STRING, optional: false },
      { id: 'search', label: 'Search For', type: PinTypes.STRING, optional: false },
      { id: 'caseSensitive', label: 'Case Sensitive', type: PinTypes.BOOLEAN, optional: true },
    ],
    dataOutputs: [
      { id: 'result', label: 'Result', type: PinTypes.BOOLEAN },
    ],
  },

  // ============================================================================
  // MATH OPERATIONS
  // ============================================================================

  MATH_ADD: {
    id: 'pure-math-add',
    category: NodeCategory.PURE,
    label: 'Add',
    description: 'Add two numbers',
    icon: '+',
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

  MATH_SUBTRACT: {
    id: 'pure-math-subtract',
    category: NodeCategory.PURE,
    label: 'Subtract',
    description: 'Subtract B from A',
    icon: '−',
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

  MATH_MULTIPLY: {
    id: 'pure-math-multiply',
    category: NodeCategory.PURE,
    label: 'Multiply',
    description: 'Multiply two numbers',
    icon: '×',
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

  MATH_DIVIDE: {
    id: 'pure-math-divide',
    category: NodeCategory.PURE,
    label: 'Divide',
    description: 'Divide A by B',
    icon: '÷',
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
    id: 'pure-random-number',
    category: NodeCategory.PURE,
    label: 'Random Number',
    description: 'Generate a random number between min and max',
    icon: '🎲',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'min', label: 'Min', type: PinTypes.NUMBER, optional: true },
      { id: 'max', label: 'Max', type: PinTypes.NUMBER, optional: true },
    ],
    dataOutputs: [
      { id: 'result', label: 'Result', type: PinTypes.NUMBER },
    ],
  },

  // ============================================================================
  // FILE & ATTACHMENT OPERATIONS
  // ============================================================================

  GET_ATTACHMENT_URL: {
    id: 'pure-get-attachment-url',
    category: NodeCategory.PURE,
    label: 'Get Attachment URL',
    description: 'Extract the download URL from an attachment',
    icon: '🔗',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'attachment', label: 'Attachment', type: PinTypes.ATTACHMENT, optional: false },
    ],
    dataOutputs: [
      { id: 'url', label: 'URL', type: PinTypes.STRING },
    ],
  },

  GET_ATTACHMENT_NAME: {
    id: 'pure-get-attachment-name',
    category: NodeCategory.PURE,
    label: 'Get Attachment Name',
    description: 'Extract the filename from an attachment',
    icon: '📝',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'attachment', label: 'Attachment', type: PinTypes.ATTACHMENT, optional: false },
    ],
    dataOutputs: [
      { id: 'name', label: 'Name', type: PinTypes.STRING },
    ],
  },

  FIND_FILES: {
    id: 'pure-find-files',
    category: NodeCategory.PURE,
    label: 'Find Files',
    description: 'Find files in a directory on the server',
    icon: '🔍',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'directory', label: 'Directory', type: PinTypes.STRING, optional: false },
      { id: 'pattern', label: 'Pattern', type: PinTypes.STRING, optional: true },
      { id: 'index', label: 'Index', type: PinTypes.NUMBER, optional: true },
    ],
    dataOutputs: [
      { id: 'path', label: 'File Path', type: PinTypes.STRING },
      { id: 'count', label: 'Count', type: PinTypes.NUMBER },
    ],
    hasConfig: true,
    defaultConfig: {
      directory: './audio',
      pattern: '*.mp3',
      index: 0,
    },
  },

  // ============================================================================
  // COMPARISON OPERATIONS
  // ============================================================================

  COMPARE_EQUAL: {
    id: 'pure-compare-equal',
    category: NodeCategory.PURE,
    label: 'Equal (==)',
    description: 'Check if A equals B',
    icon: '==',
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

  COMPARE_NOT_EQUAL: {
    id: 'pure-compare-not-equal',
    category: NodeCategory.PURE,
    label: 'Not Equal (!=)',
    description: 'Check if A does not equal B',
    icon: '≠',
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

  COMPARE_GREATER: {
    id: 'pure-compare-greater',
    category: NodeCategory.PURE,
    label: 'Greater Than (>)',
    description: 'Check if A is greater than B',
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

  COMPARE_LESS: {
    id: 'pure-compare-less',
    category: NodeCategory.PURE,
    label: 'Less Than (<)',
    description: 'Check if A is less than B',
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

  COMPARE_GREATER_EQUAL: {
    id: 'pure-compare-greater-equal',
    category: NodeCategory.PURE,
    label: 'Greater or Equal (>=)',
    description: 'Check if A is greater than or equal to B',
    icon: '≥',
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

  COMPARE_LESS_EQUAL: {
    id: 'pure-compare-less-equal',
    category: NodeCategory.PURE,
    label: 'Less or Equal (<=)',
    description: 'Check if A is less than or equal to B',
    icon: '≤',
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

  // ============================================================================
  // DISCORD CHECKS
  // ============================================================================

  CHECK_PERMISSION: {
    id: 'pure-check-permission',
    category: NodeCategory.PURE,
    label: 'Check Permission',
    description: 'Check if member has a permission',
    icon: '🔒',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'member', label: 'Member', type: PinTypes.MEMBER, optional: false },
      { id: 'permission', label: 'Permission', type: PinTypes.STRING, optional: false },
    ],
    dataOutputs: [
      { id: 'result', label: 'Has Permission', type: PinTypes.BOOLEAN },
    ],
  },

  CHECK_ROLE: {
    id: 'pure-check-role',
    category: NodeCategory.PURE,
    label: 'Check Role',
    description: 'Check if member has a role',
    icon: '🎭',
    execInputs: [],
    execOutputs: [],
    dataInputs: [
      { id: 'member', label: 'Member', type: PinTypes.MEMBER, optional: false },
      { id: 'roleId', label: 'Role ID', type: PinTypes.STRING, optional: false },
    ],
    dataOutputs: [
      { id: 'result', label: 'Has Role', type: PinTypes.BOOLEAN },
    ],
  },
};

// ============================================================================
// FLOW CONTROL NODES (Orange)
// ============================================================================

export const FlowControlNodes = {
  BRANCH: {
    id: 'flow-branch',
    category: NodeCategory.FLOW,
    label: 'Branch',
    description: 'Execute different paths based on a condition',
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

  SWITCH: {
    id: 'flow-switch',
    category: NodeCategory.FLOW,
    label: 'Switch',
    description: 'Execute different paths based on a number value',
    icon: '🔢',
    execInputs: [{ id: 'exec', label: '' }],
    execOutputs: [
      { id: '0', label: '0' },
      { id: '1', label: '1' },
      { id: '2', label: '2' },
      { id: '3', label: '3' },
      { id: '4', label: '4' },
      { id: 'default', label: 'Default' },
    ],
    dataInputs: [
      { id: 'value', label: 'Value', type: PinTypes.NUMBER, optional: false },
    ],
    dataOutputs: [],
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
  // First try direct lookup (for old key-based IDs like 'REPLY_TO_MESSAGE')
  if (ALL_NODES[nodeId]) {
    return ALL_NODES[nodeId];
  }

  // Then search by actual id field (for new IDs like 'action-reply-message')
  return Object.values(ALL_NODES).find(node => node.id === nodeId);
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
