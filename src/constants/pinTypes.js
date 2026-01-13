/**
 * Pin Type System for UE5 Blueprint-Style Event System
 * Defines all pin types with colors and validation rules
 */

export const PinTypes = {
  // Execution flow
  EXEC: 'EXEC',

  // Primitive types
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  BOOLEAN: 'BOOLEAN',

  // Discord types
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

  // Collection types
  ARRAY: 'ARRAY',

  // Special types
  ANY: 'ANY', // Can connect to anything (use sparingly)
};

export const PinColors = {
  [PinTypes.EXEC]: '#FFFFFF',
  [PinTypes.STRING]: '#faa61a',
  [PinTypes.NUMBER]: '#00D8FF',
  [PinTypes.BOOLEAN]: '#f23f43',
  [PinTypes.USER]: '#5865f2',
  [PinTypes.MEMBER]: '#5865f2',
  [PinTypes.CHANNEL]: '#9b59b6',
  [PinTypes.GUILD]: '#2ecc71',
  [PinTypes.ROLE]: '#f1c40f',
  [PinTypes.MESSAGE]: '#fee75c',
  [PinTypes.EMBED]: '#95a5a6',
  [PinTypes.ATTACHMENT]: '#a0826d',
  [PinTypes.INTERACTION]: '#3498db',
  [PinTypes.VOICE_CONNECTION]: '#e74c3c',
  [PinTypes.ARRAY]: '#16a085',
  [PinTypes.ANY]: '#ecf0f1',
};

export const PinLabels = {
  [PinTypes.EXEC]: 'Exec',
  [PinTypes.STRING]: 'String',
  [PinTypes.NUMBER]: 'Number',
  [PinTypes.BOOLEAN]: 'Boolean',
  [PinTypes.USER]: 'User',
  [PinTypes.MEMBER]: 'Member',
  [PinTypes.CHANNEL]: 'Channel',
  [PinTypes.GUILD]: 'Guild',
  [PinTypes.ROLE]: 'Role',
  [PinTypes.MESSAGE]: 'Message',
  [PinTypes.EMBED]: 'Embed',
  [PinTypes.ATTACHMENT]: 'Attachment',
  [PinTypes.INTERACTION]: 'Interaction',
  [PinTypes.VOICE_CONNECTION]: 'Voice Connection',
  [PinTypes.ARRAY]: 'Array',
  [PinTypes.ANY]: 'Any',
};

/**
 * Check if two pin types are compatible for connection
 */
export function arePinTypesCompatible(sourceType, targetType) {
  // Exact match
  if (sourceType === targetType) return true;

  // ANY can connect to anything
  if (sourceType === PinTypes.ANY || targetType === PinTypes.ANY) return true;

  // User and Member are compatible (Member is User + guild info)
  if (
    (sourceType === PinTypes.USER && targetType === PinTypes.MEMBER) ||
    (sourceType === PinTypes.MEMBER && targetType === PinTypes.USER)
  ) {
    return true;
  }

  // NUMBER can connect to STRING (auto-conversion)
  if (sourceType === PinTypes.NUMBER && targetType === PinTypes.STRING) return true;

  // BOOLEAN can connect to STRING (auto-conversion)
  if (sourceType === PinTypes.BOOLEAN && targetType === PinTypes.STRING) return true;

  return false;
}

/**
 * Get the display color for a pin type
 */
export function getPinColor(pinType) {
  return PinColors[pinType] || PinColors[PinTypes.ANY];
}

/**
 * Get the display label for a pin type
 */
export function getPinLabel(pinType) {
  return PinLabels[pinType] || pinType;
}
