
/**
 * Comprehensive utilities for chat channel management
 */

// Store or fetch the current user ID from localStorage
export const storeCurrentUserId = (userId: string | null) => {
  if (userId) {
    localStorage.setItem('currentUserId', userId);
  } else {
    localStorage.removeItem('currentUserId');
  }
};

export const getCurrentUserId = (): string | null => {
  return localStorage.getItem('currentUserId');
};

/**
 * Gets sorted user IDs for consistent path generation
 * @param userId1 First user ID
 * @param userId2 Second user ID
 * @returns Array of sorted user IDs or null if any ID is missing
 */
export const getSortedUserIds = (
  userId1: string | null | undefined,
  userId2: string | null | undefined
): string[] | null => {
  if (!userId1 || !userId2) {
    return null;
  }
  
  // Sort user IDs alphabetically for consistency
  return [userId1, userId2].sort();
};

/**
 * Creates a consistent conversation ID from two user IDs
 * @param userId1 First user ID
 * @param userId2 Second user ID
 * @returns Conversation ID or null if any ID is missing
 */
export const getConversationId = (
  userId1: string | null | undefined,
  userId2: string | null | undefined
): string | null => {
  const sortedIds = getSortedUserIds(userId1, userId2);
  if (!sortedIds) return null;
  return `${sortedIds[0]}_${sortedIds[1]}`;
};

/**
 * Generate database path for messages between two users
 */
export const getMessagesPath = (userId1: string | null, userId2: string | null): string | null => {
  const sortedIds = getSortedUserIds(userId1, userId2);
  if (!sortedIds) return null;
  return `messages/${sortedIds[0]}/${sortedIds[1]}`;
};

/**
 * Generate database path for message reactions between two users
 */
export const getReactionsPath = (userId1: string | null, userId2: string | null): string | null => {
  const sortedIds = getSortedUserIds(userId1, userId2);
  if (!sortedIds) return null;
  return `message_reactions/${sortedIds[0]}/${sortedIds[1]}`;
};

/**
 * Generate database path for typing status between two users
 */
export const getTypingStatusPath = (userId1: string | null, userId2: string | null): string | null => {
  const sortedIds = getSortedUserIds(userId1, userId2);
  if (!sortedIds) return null;
  return `typing_status/${sortedIds[0]}/${sortedIds[1]}`;
};

/**
 * Generate database path for user presence
 */
export const getUserPresencePath = (userId: string | null): string | null => {
  if (!userId) return null;
  return `presence/${userId}`;
};

/**
 * Generate consistent channel names for different purposes
 */
export const getMessageChannelName = (conversationId: string | null): string => {
  return conversationId ? `messages_${conversationId}` : 'messages_unknown';
};

export const getReactionsChannelName = (conversationId: string | null): string => {
  return conversationId ? `reactions_${conversationId}` : 'reactions_unknown';
};

/**
 * Generate channel paths from conversation ID for Firebase Realtime Database
 */
export const getMessageChannelPath = (conversationId: string | null): string | null => {
  if (!conversationId) return null;
  return `messages/${conversationId}`;
};

export const getReactionsChannelPath = (conversationId: string | null): string | null => {
  if (!conversationId) return null;
  return `reactions/${conversationId}`;
};

/**
 * Check if path is valid for access control
 */
export const isValidPath = (path: string | null): boolean => {
  if (!path) return false;
  return !path.includes('undefined') && !path.includes('null') && path.split('/').length >= 2;
};

/**
 * Validate a conversation ID format
 */
export const isValidConversationId = (conversationId: string | null): boolean => {
  if (!conversationId) return false;
  const parts = conversationId.split('_');
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
};

/**
 * Debug function to check conversation access
 */
export const debugConversationAccess = (path: string, userId: string | null): boolean => {
  if (!userId) return false;
  
  if (path.startsWith('presence')) {
    // All authenticated users can read presence data
    return true;
  }
  
  // For the nested structure, check if userId matches either uid1 or uid2
  const pathParts = path.split('/');
  if (pathParts.length >= 3) {
    const uid1 = pathParts[1];
    const uid2 = pathParts[2];
    return userId === uid1 || userId === uid2;
  }
  
  return false;
};
