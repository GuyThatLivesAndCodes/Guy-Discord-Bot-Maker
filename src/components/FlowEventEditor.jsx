import React, { useState, useCallback, useEffect } from 'react';
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
import TriggerNodeComponent from './TriggerNode';
import DataNodeComponent from './DataNode';
import './FlowEventEditor.css';
import { DATA_TYPES } from '../constants/dataTypes';

const nodeTypes = {
  actionNode: ActionNodeComponent,
  triggerNode: TriggerNodeComponent,
  dataNode: DataNodeComponent,
};

// Trigger node (auto-added for commands)
const TRIGGER_NODE = {
  type: 'on-command-ran',
  label: 'On Command Ran',
  icon: '⚡',
  color: '#5865f2',
};

// Data converter nodes
const DATA_NODES = [
  // Static value nodes (constants)
  {
    type: 'static-boolean',
    label: 'Boolean Value',
    icon: '🔘',
    color: '#ed4245',
    inputs: [],
    outputs: [{ id: 'value', type: 'BOOLEAN' }],
    config: { value: true },
    tags: ['constant', 'boolean', 'value', 'static', 'true', 'false'],
  },
  {
    type: 'static-number',
    label: 'Number Value',
    icon: '🔢',
    color: '#00aff4',
    inputs: [],
    outputs: [{ id: 'value', type: 'NUMBER' }],
    config: { value: 0 },
    tags: ['constant', 'number', 'value', 'static', 'integer', 'decimal'],
  },
  {
    type: 'static-string',
    label: 'Text Value',
    icon: '📝',
    color: '#faa61a',
    inputs: [],
    outputs: [{ id: 'value', type: 'STRING' }],
    config: { value: '' },
    tags: ['constant', 'string', 'text', 'value', 'static', 'message'],
  },
  // Discord data extractors
  {
    type: 'get-user-name',
    label: 'Get User Name',
    icon: '👤',
    color: '#f23f43',
    inputs: [{ id: 'user', type: 'USER' }],
    outputs: [{ id: 'name', type: 'STRING' }],
    tags: ['user', 'name', 'username', 'discord', 'member'],
  },
  {
    type: 'get-user-avatar',
    label: 'Get User Avatar',
    icon: '🖼️',
    color: '#f23f43',
    inputs: [{ id: 'user', type: 'USER' }],
    outputs: [{ id: 'url', type: 'STRING' }],
    tags: ['user', 'avatar', 'picture', 'image', 'profile', 'pfp'],
  },
  {
    type: 'get-user-id',
    label: 'Get User ID',
    icon: '🔢',
    color: '#f23f43',
    inputs: [{ id: 'user', type: 'USER' }],
    outputs: [{ id: 'id', type: 'STRING' }],
    tags: ['user', 'id', 'identifier', 'snowflake'],
  },
  {
    type: 'get-channel-name',
    label: 'Get Channel Name',
    icon: '💬',
    color: '#43b581',
    inputs: [{ id: 'channel', type: 'CHANNEL' }],
    outputs: [{ id: 'name', type: 'STRING' }],
    tags: ['channel', 'name', 'discord'],
  },
  {
    type: 'get-channel-id',
    label: 'Get Channel ID',
    icon: '🔢',
    color: '#43b581',
    inputs: [{ id: 'channel', type: 'CHANNEL' }],
    outputs: [{ id: 'id', type: 'STRING' }],
    tags: ['channel', 'id', 'identifier', 'snowflake'],
  },
  {
    type: 'get-guild-name',
    label: 'Get Guild Name',
    icon: '🏰',
    color: '#7289da',
    inputs: [{ id: 'guild', type: 'GUILD' }],
    outputs: [{ id: 'name', type: 'STRING' }],
    tags: ['guild', 'server', 'name', 'discord'],
  },
  // Utility nodes
  {
    type: 'join-strings',
    label: 'Join Strings',
    icon: '🔗',
    color: '#faa61a',
    inputs: [
      { id: 'string1', type: 'STRING' },
      { id: 'string2', type: 'STRING' },
    ],
    outputs: [{ id: 'result', type: 'STRING' }],
    tags: ['string', 'text', 'join', 'combine', 'concatenate', 'merge'],
  },
  {
    type: 'number-to-string',
    label: 'Number → String',
    icon: '🔄',
    color: '#00aff4',
    inputs: [{ id: 'number', type: 'NUMBER' }],
    outputs: [{ id: 'string', type: 'STRING' }],
    tags: ['convert', 'number', 'string', 'text', 'transform'],
  },
  {
    type: 'add-numbers',
    label: 'Add Numbers',
    icon: '➕',
    color: '#00aff4',
    inputs: [
      { id: 'a', type: 'NUMBER' },
      { id: 'b', type: 'NUMBER' },
    ],
    outputs: [{ id: 'result', type: 'NUMBER' }],
    tags: ['math', 'number', 'add', 'plus', 'sum', 'addition', 'calculate'],
  },
  {
    type: 'subtract-numbers',
    label: 'Subtract Numbers',
    icon: '➖',
    color: '#00aff4',
    inputs: [
      { id: 'a', type: 'NUMBER' },
      { id: 'b', type: 'NUMBER' },
    ],
    outputs: [{ id: 'result', type: 'NUMBER' }],
    tags: ['math', 'number', 'subtract', 'minus', 'difference', 'calculate'],
  },
  {
    type: 'multiply-numbers',
    label: 'Multiply Numbers',
    icon: '✖️',
    color: '#00aff4',
    inputs: [
      { id: 'a', type: 'NUMBER' },
      { id: 'b', type: 'NUMBER' },
    ],
    outputs: [{ id: 'result', type: 'NUMBER' }],
    tags: ['math', 'number', 'multiply', 'times', 'product', 'calculate'],
  },
  {
    type: 'divide-numbers',
    label: 'Divide Numbers',
    icon: '➗',
    color: '#00aff4',
    inputs: [
      { id: 'a', type: 'NUMBER' },
      { id: 'b', type: 'NUMBER' },
    ],
    outputs: [{ id: 'result', type: 'NUMBER' }],
    tags: ['math', 'number', 'divide', 'division', 'quotient', 'calculate'],
  },
  {
    type: 'check-has-role',
    label: 'Check Has Role',
    icon: '✅',
    color: '#ed4245',
    inputs: [
      { id: 'user', type: 'USER' },
      { id: 'roleId', type: 'STRING' },
    ],
    outputs: [{ id: 'result', type: 'BOOLEAN' }],
    tags: ['role', 'permission', 'check', 'user', 'has', 'member'],
  },
  {
    type: 'string-length',
    label: 'String Length',
    icon: '📏',
    color: '#faa61a',
    inputs: [{ id: 'string', type: 'STRING' }],
    outputs: [{ id: 'length', type: 'NUMBER' }],
    tags: ['string', 'text', 'length', 'size', 'count', 'measure'],
  },
  {
    type: 'string-contains',
    label: 'String Contains',
    icon: '🔍',
    color: '#ed4245',
    inputs: [
      { id: 'string', type: 'STRING' },
      { id: 'search', type: 'STRING' },
    ],
    outputs: [{ id: 'result', type: 'BOOLEAN' }],
    tags: ['string', 'text', 'contains', 'search', 'find', 'includes', 'check'],
  },
  {
    type: 'string-lowercase',
    label: 'To Lowercase',
    icon: '🔽',
    color: '#faa61a',
    inputs: [{ id: 'string', type: 'STRING' }],
    outputs: [{ id: 'result', type: 'STRING' }],
    tags: ['string', 'text', 'lowercase', 'lower', 'case', 'transform'],
  },
  {
    type: 'string-uppercase',
    label: 'To Uppercase',
    icon: '🔼',
    color: '#faa61a',
    inputs: [{ id: 'string', type: 'STRING' }],
    outputs: [{ id: 'result', type: 'STRING' }],
    tags: ['string', 'text', 'uppercase', 'upper', 'case', 'caps', 'transform'],
  },
  {
    type: 'number-greater-than',
    label: 'Number > (Greater)',
    icon: '▶️',
    color: '#ed4245',
    inputs: [
      { id: 'a', type: 'NUMBER' },
      { id: 'b', type: 'NUMBER' },
    ],
    outputs: [{ id: 'result', type: 'BOOLEAN' }],
    tags: ['number', 'compare', 'greater', 'larger', 'more', 'check', 'condition'],
  },
  {
    type: 'number-less-than',
    label: 'Number < (Less)',
    icon: '◀️',
    color: '#ed4245',
    inputs: [
      { id: 'a', type: 'NUMBER' },
      { id: 'b', type: 'NUMBER' },
    ],
    outputs: [{ id: 'result', type: 'BOOLEAN' }],
    tags: ['number', 'compare', 'less', 'smaller', 'fewer', 'check', 'condition'],
  },
  {
    type: 'number-equals',
    label: 'Number = (Equals)',
    icon: '🟰',
    color: '#ed4245',
    inputs: [
      { id: 'a', type: 'NUMBER' },
      { id: 'b', type: 'NUMBER' },
    ],
    outputs: [{ id: 'result', type: 'BOOLEAN' }],
    tags: ['number', 'compare', 'equals', 'same', 'equal', 'check', 'condition'],
  },
  {
    type: 'compare-strings',
    label: 'Compare Strings',
    icon: '📝',
    color: '#ed4245',
    inputs: [
      { id: 'a', type: 'STRING' },
      { id: 'b', type: 'STRING' },
    ],
    outputs: [{ id: 'result', type: 'BOOLEAN' }],
    tags: ['string', 'text', 'compare', 'equals', 'same', 'check', 'match'],
  },
  {
    type: 'boolean-not',
    label: 'NOT (Invert)',
    icon: '❗',
    color: '#ed4245',
    inputs: [{ id: 'value', type: 'BOOLEAN' }],
    outputs: [{ id: 'result', type: 'BOOLEAN' }],
    tags: ['boolean', 'not', 'invert', 'opposite', 'negate', 'logic'],
  },
  {
    type: 'boolean-and',
    label: 'AND',
    icon: '🔗',
    color: '#ed4245',
    inputs: [
      { id: 'a', type: 'BOOLEAN' },
      { id: 'b', type: 'BOOLEAN' },
    ],
    outputs: [{ id: 'result', type: 'BOOLEAN' }],
    tags: ['boolean', 'and', 'both', 'logic', 'condition', 'check'],
  },
  {
    type: 'boolean-or',
    label: 'OR',
    icon: '🔀',
    color: '#ed4245',
    inputs: [
      { id: 'a', type: 'BOOLEAN' },
      { id: 'b', type: 'BOOLEAN' },
    ],
    outputs: [{ id: 'result', type: 'BOOLEAN' }],
    tags: ['boolean', 'or', 'either', 'logic', 'condition', 'check'],
  },
  {
    type: 'random-number',
    label: 'Random Number',
    icon: '🎲',
    color: '#00aff4',
    inputs: [
      { id: 'min', type: 'NUMBER' },
      { id: 'max', type: 'NUMBER' },
    ],
    outputs: [{ id: 'result', type: 'NUMBER' }],
    tags: ['random', 'number', 'rng', 'dice', 'chance', 'generate'],
  },
  {
    type: 'string-to-number',
    label: 'String → Number',
    icon: '🔄',
    color: '#00aff4',
    inputs: [{ id: 'string', type: 'STRING' }],
    outputs: [{ id: 'number', type: 'NUMBER' }],
    tags: ['convert', 'string', 'number', 'text', 'transform', 'parse'],
  },
  {
    type: 'get-member-count',
    label: 'Get Member Count',
    icon: '👥',
    color: '#00aff4',
    inputs: [{ id: 'guild', type: 'GUILD' }],
    outputs: [{ id: 'count', type: 'NUMBER' }],
    tags: ['guild', 'server', 'members', 'count', 'users', 'size'],
  },
  {
    type: 'get-member-joindate',
    label: 'Get Member Join Date',
    icon: '📅',
    color: '#f23f43',
    inputs: [{ id: 'user', type: 'USER' }],
    outputs: [{ id: 'date', type: 'STRING' }],
    tags: ['user', 'member', 'join', 'date', 'joined', 'timestamp', 'when'],
  },
  {
    type: 'get-user-created',
    label: 'Get Account Created Date',
    icon: '🎂',
    color: '#f23f43',
    inputs: [{ id: 'user', type: 'USER' }],
    outputs: [{ id: 'date', type: 'STRING' }],
    tags: ['user', 'account', 'created', 'date', 'birthday', 'age', 'when'],
  },
  {
    type: 'wait-delay',
    label: 'Wait / Delay',
    icon: '⏳',
    color: '#00aff4',
    inputs: [
      { id: 'flow', type: 'FLOW' },
      { id: 'seconds', type: 'NUMBER', optional: true }
    ],
    outputs: [
      { id: 'flow', type: 'FLOW' },
      { id: 'result', type: 'NUMBER' }
    ],
    tags: ['wait', 'delay', 'pause', 'sleep', 'timeout', 'timer'],
  },
  {
    type: 'format-number',
    label: 'Format Number',
    icon: '🔢',
    color: '#00aff4',
    inputs: [
      { id: 'number', type: 'NUMBER' },
      { id: 'decimals', type: 'NUMBER' },
    ],
    outputs: [{ id: 'formatted', type: 'STRING' }],
    tags: ['number', 'format', 'decimal', 'round', 'precision', 'display'],
  },
  {
    type: 'current-timestamp',
    label: 'Current Timestamp',
    icon: '🕐',
    color: '#00aff4',
    inputs: [],
    outputs: [{ id: 'timestamp', type: 'NUMBER' }],
    tags: ['time', 'now', 'current', 'timestamp', 'unix', 'date'],
  },
  // File operation nodes
  {
    type: 'get-file-name',
    label: 'Get File Name',
    icon: '📄',
    color: '#9b59b6',
    inputs: [{ id: 'file', type: 'ATTACHMENT' }],
    outputs: [{ id: 'name', type: 'STRING' }],
    tags: ['file', 'attachment', 'name', 'filename', 'upload'],
  },
  {
    type: 'get-file-url',
    label: 'Get File URL',
    icon: '🔗',
    color: '#9b59b6',
    inputs: [{ id: 'file', type: 'ATTACHMENT' }],
    outputs: [{ id: 'url', type: 'STRING' }],
    tags: ['file', 'attachment', 'url', 'link', 'download'],
  },
  {
    type: 'get-file-size',
    label: 'Get File Size',
    icon: '📊',
    color: '#9b59b6',
    inputs: [{ id: 'file', type: 'ATTACHMENT' }],
    outputs: [{ id: 'size', type: 'NUMBER' }],
    tags: ['file', 'attachment', 'size', 'bytes', 'length'],
  },
  {
    type: 'read-file-from-url',
    label: 'Read File from URL',
    icon: '🌐',
    color: '#9b59b6',
    inputs: [{ id: 'url', type: 'STRING' }],
    outputs: [{ id: 'content', type: 'STRING' }],
    tags: ['file', 'read', 'url', 'http', 'download', 'fetch', 'web'],
  },
  {
    type: 'read-file-from-server',
    label: 'Read File from Server',
    icon: '💾',
    color: '#9b59b6',
    inputs: [{ id: 'filename', type: 'STRING' }],
    outputs: [{ id: 'file', type: 'ATTACHMENT' }],
    tags: ['file', 'read', 'server', 'storage', 'load', 'disk'],
  },
  {
    type: 'file-to-string',
    label: 'File to String',
    icon: '📄',
    color: '#9b59b6',
    inputs: [{ id: 'file', type: 'ATTACHMENT' }],
    outputs: [{ id: 'content', type: 'STRING' }],
    tags: ['file', 'convert', 'string', 'text', 'read', 'content'],
  },
  {
    type: 'string-to-file',
    label: 'String to File',
    icon: '📝',
    color: '#9b59b6',
    inputs: [
      { id: 'content', type: 'STRING' },
      { id: 'filename', type: 'STRING' },
    ],
    outputs: [{ id: 'file', type: 'ATTACHMENT' }],
    config: { filename: 'file.txt' },
    tags: ['file', 'convert', 'string', 'text', 'create', 'make'],
  },
  {
    type: 'check-file-exists',
    label: 'Check File Exists',
    icon: '🔍',
    color: '#9b59b6',
    inputs: [{ id: 'filename', type: 'STRING' }],
    outputs: [{ id: 'exists', type: 'BOOLEAN' }],
    tags: ['file', 'check', 'exists', 'find', 'search', 'server', 'storage'],
  },
  // Variable nodes - Get
  {
    type: 'get-variable-global',
    label: 'Get Variable (Global)',
    icon: '🌍',
    color: '#e67e22',
    inputs: [{ id: 'key', type: 'STRING' }],
    outputs: [{ id: 'value', type: 'STRING' }],
    tags: ['variable', 'get', 'load', 'global', 'storage', 'data', 'retrieve'],
  },
  {
    type: 'get-variable-server',
    label: 'Get Variable (Server)',
    icon: '🏰',
    color: '#e67e22',
    inputs: [
      { id: 'guild', type: 'GUILD' },
      { id: 'key', type: 'STRING' },
    ],
    outputs: [{ id: 'value', type: 'STRING' }],
    tags: ['variable', 'get', 'load', 'server', 'guild', 'storage', 'data', 'retrieve'],
  },
  {
    type: 'get-variable-user',
    label: 'Get Variable (User)',
    icon: '👤',
    color: '#e67e22',
    inputs: [
      { id: 'user', type: 'USER' },
      { id: 'key', type: 'STRING' },
    ],
    outputs: [{ id: 'value', type: 'STRING' }],
    tags: ['variable', 'get', 'load', 'user', 'member', 'storage', 'data', 'retrieve', 'player'],
  },
];

// Action types available
const ACTION_TYPES = [
  {
    type: 'send-message',
    label: 'Send Message',
    icon: '💬',
    color: '#5865f2',
    defaultData: { content: 'Hello, World!', ephemeral: false },
    inputs: [
      { id: 'flow', type: 'FLOW' },
      { id: 'content', type: 'STRING', optional: true },
      { id: 'file', type: 'ATTACHMENT', optional: true },
    ],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['message', 'send', 'reply', 'respond', 'chat', 'talk', 'image', 'attachment'],
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
      ephemeral: false,
    },
    inputs: [
      { id: 'flow', type: 'FLOW' },
      { id: 'title', type: 'STRING', optional: true },
      { id: 'description', type: 'STRING', optional: true },
      { id: 'author', type: 'STRING', optional: true },
      { id: 'thumbnail', type: 'STRING', optional: true },
      { id: 'image', type: 'STRING', optional: true },
    ],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['embed', 'message', 'rich', 'fancy', 'formatted', 'card'],
  },
  {
    type: 'add-role',
    label: 'Add Role',
    icon: '🎭',
    color: '#faa81a',
    defaultData: { roleId: '' },
    inputs: [{ id: 'flow', type: 'FLOW' }],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['role', 'add', 'give', 'assign', 'permission', 'member'],
  },
  {
    type: 'remove-role',
    label: 'Remove Role',
    icon: '👤',
    color: '#ed4245',
    defaultData: { roleId: '' },
    inputs: [{ id: 'flow', type: 'FLOW' }],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['role', 'remove', 'take', 'revoke', 'permission', 'member'],
  },
  {
    type: 'send-dm',
    label: 'Send DM',
    icon: '✉️',
    color: '#9b59b6',
    defaultData: { content: 'Hello!' },
    inputs: [
      { id: 'flow', type: 'FLOW' },
      { id: 'user', type: 'USER', optional: true },
      { id: 'content', type: 'STRING', optional: true },
    ],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['dm', 'direct', 'message', 'private', 'send', 'whisper', 'pm'],
  },
  {
    type: 'react-emoji',
    label: 'React with Emoji',
    icon: '👍',
    color: '#f39c12',
    defaultData: { emoji: '👍' },
    inputs: [{ id: 'flow', type: 'FLOW' }],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['react', 'reaction', 'emoji', 'emoticon', 'response'],
  },
  // Moderation Actions
  {
    type: 'timeout-member',
    label: 'Timeout Member',
    icon: '⏱️',
    color: '#ed4245',
    defaultData: { duration: 60, reason: '' },
    inputs: [
      { id: 'flow', type: 'FLOW' },
      { id: 'user', type: 'USER', optional: true },
      { id: 'duration', type: 'NUMBER', optional: true },
      { id: 'reason', type: 'STRING', optional: true },
    ],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['timeout', 'mute', 'punish', 'moderate', 'discipline', 'silence', 'ban', 'temp'],
  },
  {
    type: 'kick-member',
    label: 'Kick Member',
    icon: '👢',
    color: '#ed4245',
    defaultData: { reason: '' },
    inputs: [
      { id: 'flow', type: 'FLOW' },
      { id: 'user', type: 'USER', optional: true },
      { id: 'reason', type: 'STRING', optional: true },
    ],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['kick', 'remove', 'punish', 'moderate', 'eject', 'boot'],
  },
  {
    type: 'ban-member',
    label: 'Ban Member',
    icon: '🔨',
    color: '#ed4245',
    defaultData: { deleteMessageDays: 0, reason: '' },
    inputs: [
      { id: 'flow', type: 'FLOW' },
      { id: 'user', type: 'USER', optional: true },
      { id: 'reason', type: 'STRING', optional: true },
    ],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['ban', 'punish', 'moderate', 'permanent', 'remove', 'hammer'],
  },
  {
    type: 'unban-member',
    label: 'Unban Member',
    icon: '🔓',
    color: '#57f287',
    defaultData: { userId: '' },
    inputs: [
      { id: 'flow', type: 'FLOW' },
      { id: 'userId', type: 'STRING', optional: true },
    ],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['unban', 'pardon', 'forgive', 'unblock', 'restore'],
  },
  // Voice Channel Actions
  {
    type: 'join-voice',
    label: 'Join Voice Channel',
    icon: '🔊',
    color: '#9b59b6',
    defaultData: { channelId: '' },
    inputs: [
      { id: 'flow', type: 'FLOW' },
      { id: 'channel', type: 'CHANNEL', optional: true },
    ],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['voice', 'vc', 'join', 'connect', 'audio', 'call'],
  },
  {
    type: 'leave-voice',
    label: 'Leave Voice Channel',
    icon: '🔇',
    color: '#9b59b6',
    defaultData: {},
    inputs: [{ id: 'flow', type: 'FLOW' }],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['voice', 'vc', 'leave', 'disconnect', 'exit', 'audio'],
  },
  {
    type: 'move-member-voice',
    label: 'Move Member to VC',
    icon: '🔀',
    color: '#9b59b6',
    defaultData: { channelId: '' },
    inputs: [
      { id: 'flow', type: 'FLOW' },
      { id: 'user', type: 'USER', optional: true },
      { id: 'channel', type: 'CHANNEL', optional: true },
    ],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['voice', 'vc', 'move', 'transfer', 'relocate', 'channel'],
  },
  {
    type: 'mute-member-voice',
    label: 'Mute Member (Voice)',
    icon: '🔇',
    color: '#ed4245',
    defaultData: {},
    inputs: [
      { id: 'flow', type: 'FLOW' },
      { id: 'user', type: 'USER', optional: true },
    ],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['voice', 'vc', 'mute', 'silence', 'audio', 'moderate'],
  },
  {
    type: 'deafen-member-voice',
    label: 'Deafen Member (Voice)',
    icon: '🔕',
    color: '#ed4245',
    defaultData: {},
    inputs: [
      { id: 'flow', type: 'FLOW' },
      { id: 'user', type: 'USER', optional: true },
    ],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['voice', 'vc', 'deafen', 'deaf', 'audio', 'moderate'],
  },
  {
    type: 'stream-file-voice',
    label: 'Stream File in Voice',
    icon: '🎵',
    color: '#9b59b6',
    defaultData: {},
    inputs: [
      { id: 'flow', type: 'FLOW' },
      { id: 'file', type: 'ATTACHMENT', optional: true },
      { id: 'filename', type: 'STRING', optional: true },
    ],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['voice', 'vc', 'stream', 'play', 'audio', 'video', 'music', 'sound', 'mp3', 'mp4'],
  },
  {
    type: 'stop-voice-stream',
    label: 'Stop Voice Stream',
    icon: '⏹️',
    color: '#ed4245',
    defaultData: {},
    inputs: [{ id: 'flow', type: 'FLOW' }],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['voice', 'vc', 'stop', 'pause', 'audio', 'music'],
  },
  // Message/Channel Actions
  {
    type: 'delete-message',
    label: 'Delete Message',
    icon: '🗑️',
    color: '#ed4245',
    defaultData: {},
    inputs: [{ id: 'flow', type: 'FLOW' }],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['delete', 'remove', 'message', 'clear', 'erase'],
  },
  {
    type: 'pin-message',
    label: 'Pin Message',
    icon: '📌',
    color: '#faa81a',
    defaultData: {},
    inputs: [{ id: 'flow', type: 'FLOW' }],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['pin', 'stick', 'important', 'message', 'highlight'],
  },
  {
    type: 'create-thread',
    label: 'Create Thread',
    icon: '🧵',
    color: '#5865f2',
    defaultData: { name: 'New Thread' },
    inputs: [
      { id: 'flow', type: 'FLOW' },
      { id: 'name', type: 'STRING', optional: true },
    ],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['thread', 'create', 'conversation', 'discussion', 'forum'],
  },
  {
    type: 'branch',
    label: 'Branch',
    icon: '🔀',
    color: '#00aff4',
    defaultData: {},
    inputs: [
      { id: 'flow', type: 'FLOW' },
      { id: 'condition', type: 'BOOLEAN' },
    ],
    outputs: [
      { id: 'true', type: 'FLOW', label: 'True' },
      { id: 'false', type: 'FLOW', label: 'False' },
    ],
    tags: ['branch', 'if', 'condition', 'check', 'conditional', 'split', 'decision'],
  },
  // File operation actions
  {
    type: 'save-file-to-server',
    label: 'Save File to Server',
    icon: '💾',
    color: '#9b59b6',
    defaultData: { filename: 'file.txt' },
    inputs: [
      { id: 'flow', type: 'FLOW' },
      { id: 'filename', type: 'STRING', optional: true },
      { id: 'content', type: 'STRING', optional: true },
    ],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['file', 'save', 'write', 'server', 'storage', 'disk', 'upload'],
  },
  {
    type: 'save-attachment-to-server',
    label: 'Save Attachment to Server',
    icon: '📥',
    color: '#9b59b6',
    defaultData: { filename: '' },
    inputs: [
      { id: 'flow', type: 'FLOW' },
      { id: 'file', type: 'ATTACHMENT' },
      { id: 'filename', type: 'STRING', optional: true },
    ],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['file', 'save', 'download', 'attachment', 'server', 'storage', 'disk'],
  },
  // Variable operation actions
  {
    type: 'set-variable-global',
    label: 'Set Variable (Global)',
    icon: '🌍',
    color: '#e67e22',
    defaultData: { key: '', value: '' },
    inputs: [
      { id: 'flow', type: 'FLOW' },
      { id: 'key', type: 'STRING', optional: true },
      { id: 'value', type: 'STRING', optional: true },
    ],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['variable', 'set', 'save', 'global', 'storage', 'data', 'store', 'write'],
  },
  {
    type: 'set-variable-server',
    label: 'Set Variable (Server)',
    icon: '🏰',
    color: '#e67e22',
    defaultData: { key: '', value: '' },
    inputs: [
      { id: 'flow', type: 'FLOW' },
      { id: 'guild', type: 'GUILD', optional: true },
      { id: 'key', type: 'STRING', optional: true },
      { id: 'value', type: 'STRING', optional: true },
    ],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['variable', 'set', 'save', 'server', 'guild', 'storage', 'data', 'store', 'write'],
  },
  {
    type: 'set-variable-user',
    label: 'Set Variable (User)',
    icon: '👤',
    color: '#e67e22',
    defaultData: { key: '', value: '' },
    inputs: [
      { id: 'flow', type: 'FLOW' },
      { id: 'user', type: 'USER', optional: true },
      { id: 'key', type: 'STRING', optional: true },
      { id: 'value', type: 'STRING', optional: true },
    ],
    outputs: [
      { id: 'flow', type: 'FLOW', label: 'Success' },
      { id: 'fail', type: 'FLOW', label: 'Fail' },
    ],
    tags: ['variable', 'set', 'save', 'user', 'member', 'storage', 'data', 'store', 'write', 'player', 'money', 'balance'],
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
  const [searchTerm, setSearchTerm] = useState('');

  // Filter nodes based on search term
  const filterNodes = (nodes) => {
    if (!searchTerm.trim()) return nodes;

    const term = searchTerm.toLowerCase();
    return nodes.filter(node => {
      // Search in label
      if (node.label.toLowerCase().includes(term)) return true;

      // Search in tags
      if (node.tags && node.tags.some(tag => tag.toLowerCase().includes(term))) return true;

      return false;
    });
  };

  const filteredDataNodes = filterNodes(DATA_NODES);
  const filteredActionNodes = filterNodes(ACTION_TYPES);

  // Auto-add trigger node if it doesn't exist
  useEffect(() => {
    if (nodes.length === 0 || !nodes.find(n => n.type === 'triggerNode')) {
      const baseOutputs = [
        { id: 'flow', type: 'FLOW', label: 'Flow' },
        { id: 'user', type: 'USER', label: 'User' },
        { id: 'channel', type: 'CHANNEL', label: 'Channel' },
        { id: 'guild', type: 'GUILD', label: 'Guild' },
      ];

      // Add command options as outputs
      const optionOutputs = (eventConfig.options || []).map(option => ({
        id: `option-${option.name}`,
        type: option.type,
        label: option.name,
      }));

      const triggerNode = {
        id: 'trigger-node',
        type: 'triggerNode',
        position: { x: 250, y: 50 },
        data: {
          label: TRIGGER_NODE.label,
          icon: TRIGGER_NODE.icon,
          color: TRIGGER_NODE.color,
          outputs: [...baseOutputs, ...optionOutputs],
        },
        draggable: false,
      };
      setNodes([triggerNode, ...nodes]);
    }
  }, []);

  // Update trigger node outputs when command options change
  useEffect(() => {
    const triggerNode = nodes.find(n => n.type === 'triggerNode');
    if (triggerNode) {
      const baseOutputs = [
        { id: 'flow', type: 'FLOW', label: 'Flow' },
        { id: 'user', type: 'USER', label: 'User' },
        { id: 'channel', type: 'CHANNEL', label: 'Channel' },
        { id: 'guild', type: 'GUILD', label: 'Guild' },
      ];

      // Add command options as outputs
      const optionOutputs = (eventConfig.options || []).map(option => ({
        id: `option-${option.name}`,
        type: option.type,
        label: option.name,
      }));

      const newOutputs = [...baseOutputs, ...optionOutputs];

      // Only update if outputs actually changed
      const currentOutputs = triggerNode.data.outputs || [];
      const outputsChanged = JSON.stringify(currentOutputs) !== JSON.stringify(newOutputs);

      if (outputsChanged) {
        setNodes(nodes.map(node =>
          node.id === 'trigger-node'
            ? {
                ...node,
                data: {
                  ...node.data,
                  outputs: newOutputs,
                },
              }
            : node
        ));
      }
    }
  }, [eventConfig.options, nodes, setNodes]);

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

  const getHandleType = useCallback((node, handleId) => {
    // For trigger nodes
    if (node.type === 'triggerNode' && node.data.outputs) {
      const output = node.data.outputs.find(o => o.id === handleId);
      return output?.type || 'FLOW';
    }

    // For data nodes
    if (node.type === 'dataNode') {
      if (node.data.outputs) {
        const output = node.data.outputs.find(o => o.id === handleId);
        if (output) return output.type;
      }
      if (node.data.inputs) {
        const input = node.data.inputs.find(i => i.id === handleId);
        if (input) return input.type;
      }
    }

    // For action nodes
    if (node.type === 'actionNode' && node.data.inputs) {
      const input = node.data.inputs.find(i => i.id === handleId);
      if (input) return input.type;
    }

    // For branch node outputs
    if (node.data.actionType === 'branch' && node.data.outputs) {
      const output = node.data.outputs.find(o => o.id === handleId);
      return output?.type || 'FLOW';
    }

    return 'FLOW';
  }, []);

  const isValidConnection = useCallback((connection, currentNodes, currentEdges) => {
    const sourceNode = currentNodes.find(n => n.id === connection.source);
    const targetNode = currentNodes.find(n => n.id === connection.target);

    if (!sourceNode || !targetNode) {
      return { valid: false, reason: 'Invalid source or target node' };
    }

    // Get source and target handle types
    const sourceType = getHandleType(sourceNode, connection.sourceHandle);
    const targetType = getHandleType(targetNode, connection.targetHandle);

    // Validate type compatibility (FLOW can connect to FLOW, types must match for data connections)
    if (sourceType !== targetType) {
      return {
        valid: false,
        reason: `❌ Type mismatch! Cannot connect ${sourceType} to ${targetType}`
      };
    }

    const targetHandle = connection.targetHandle;

    // Check if this is a non-FLOW input
    if (targetHandle && targetType !== 'FLOW') {
      // Check if there's already a connection to this target handle
      const existingConnection = currentEdges.find(
        e => e.target === connection.target && e.targetHandle === targetHandle
      );

      if (existingConnection) {
        return {
          valid: false,
          reason: '❌ Already connected! Data inputs can only have one connection.'
        };
      }
    }

    return { valid: true };
  }, [getHandleType]);

  const onConnect = useCallback(
    (params) => {
      const validation = isValidConnection(params, nodes, edges);

      if (!validation.valid) {
        setLoopWarning(validation.reason || '❌ Invalid connection!');
        setTimeout(() => setLoopWarning(null), 3000);
        return;
      }

      const sourceNode = nodes.find(n => n.id === params.source);

      // Get the actual type of the source handle
      const handleType = getHandleType(sourceNode, params.sourceHandle);
      const edgeColor = DATA_TYPES[handleType]?.color || DATA_TYPES.FLOW.color;

      const newEdges = addEdge(
        {
          ...params,
          type: 'smoothstep',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
          style: { stroke: edgeColor, strokeWidth: 2 },
        },
        edges
      );

      if (detectLoops(newEdges)) {
        setLoopWarning('⚠️ Loop detected! This connection creates a cycle in your flow.');
        setTimeout(() => setLoopWarning(null), 3000);
      }

      setEdges(newEdges);
    },
    [edges, setEdges, detectLoops, nodes, isValidConnection, getHandleType]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const addDataNode = (dataNodeType) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'dataNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 200 },
      data: {
        nodeType: dataNodeType.type,
        label: dataNodeType.label,
        icon: dataNodeType.icon,
        color: dataNodeType.color,
        inputs: dataNodeType.inputs,
        outputs: dataNodeType.outputs,
        config: dataNodeType.config ? { ...dataNodeType.config } : undefined,
        onUpdate: updateNodeData,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const addActionNode = (actionType) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'actionNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 300 },
      data: {
        actionType: actionType.type,
        label: actionType.label,
        icon: actionType.icon,
        color: actionType.color,
        config: { ...actionType.defaultData },
        inputs: actionType.inputs || [{ id: 'flow', type: 'FLOW' }],
        outputs: actionType.outputs, // Pass outputs for branch node
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
      if (nodeId === 'trigger-node') return; // Can't delete trigger node
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

                <div className="form-group">
                  <label>Command Options</label>
                  <div className="command-options-list">
                    {(eventConfig.options || []).map((option, index) => (
                      <div key={index} className="command-option-item">
                        <input
                          type="text"
                          value={option.name}
                          onChange={(e) => {
                            const newOptions = [...(eventConfig.options || [])];
                            newOptions[index] = { ...option, name: e.target.value };
                            setEventConfig({ ...eventConfig, options: newOptions });
                          }}
                          placeholder="Option name"
                          style={{ flex: 1, marginRight: '8px' }}
                        />
                        <select
                          value={option.type}
                          onChange={(e) => {
                            const newOptions = [...(eventConfig.options || [])];
                            newOptions[index] = { ...option, type: e.target.value };
                            setEventConfig({ ...eventConfig, options: newOptions });
                          }}
                          style={{ marginRight: '8px' }}
                        >
                          <option value="STRING">String</option>
                          <option value="NUMBER">Number</option>
                          <option value="BOOLEAN">Boolean</option>
                          <option value="USER">User</option>
                          <option value="CHANNEL">Channel</option>
                          <option value="ROLE">Role</option>
                          <option value="ATTACHMENT">File</option>
                        </select>
                        <label style={{ marginRight: '8px', fontSize: '12px', display: 'flex', alignItems: 'center' }}>
                          <input
                            type="checkbox"
                            checked={option.required || false}
                            onChange={(e) => {
                              const newOptions = [...(eventConfig.options || [])];
                              newOptions[index] = { ...option, required: e.target.checked };
                              setEventConfig({ ...eventConfig, options: newOptions });
                            }}
                            style={{ marginRight: '4px' }}
                          />
                          Required
                        </label>
                        <button
                          onClick={() => {
                            const newOptions = (eventConfig.options || []).filter((_, i) => i !== index);
                            setEventConfig({ ...eventConfig, options: newOptions });
                          }}
                          style={{
                            background: '#ed4245',
                            color: 'white',
                            border: 'none',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newOptions = [
                          ...(eventConfig.options || []),
                          { name: '', type: 'STRING', required: false, description: '' }
                        ];
                        setEventConfig({ ...eventConfig, options: newOptions });
                      }}
                      style={{
                        background: '#5865f2',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        width: '100%',
                        marginTop: '8px',
                      }}
                    >
                      + Add Option
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="node-search">
            <input
              type="text"
              placeholder="🔍 Search nodes... (try 'user', 'message', 'math', etc.)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="clear-search">×</button>
            )}
          </div>

          <div className="data-types-legend">
            <h4>Data Types</h4>
            {Object.entries(DATA_TYPES).map(([key, value]) => (
              <div key={key} className="data-type-item">
                <div className="data-type-dot" style={{ background: value.color }}></div>
                <span>{value.label}</span>
              </div>
            ))}
          </div>

          <div className="actions-palette">
            <h4>Data Nodes {searchTerm && `(${filteredDataNodes.length})`}</h4>
            <p className="palette-description">Convert data types</p>
            <div className="action-type-list">
              {filteredDataNodes.map((dataNode) => (
                <button
                  key={dataNode.type}
                  className="action-type-button"
                  style={{ borderLeft: `4px solid ${dataNode.color}` }}
                  onClick={() => addDataNode(dataNode)}
                >
                  <span className="action-icon">{dataNode.icon}</span>
                  <span>{dataNode.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="actions-palette">
            <h4>Action Nodes {searchTerm && `(${filteredActionNodes.length})`}</h4>
            <p className="palette-description">Execute actions</p>
            <div className="action-type-list">
              {filteredActionNodes.map((actionType) => (
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
            <span>🔗 Connect colored handles by type</span>
            <span>🗑️ Select node and press Delete</span>
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
