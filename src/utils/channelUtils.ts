
/**
 * Utilities for chat channel management
 */

// Store or fetch the current user ID from localStorage
export const storeCurrentUserId = (userId: string | null) => {
  if (userId) {
    console.log('Storing current user ID in localStorage:', userId);
    localStorage.setItem('currentUserId', userId);
  } else {
    console.log('Removing current user ID from localStorage');
    localStorage.removeItem('currentUserId');
  }
};

export const getCurrentUserId = (): string | null => {
  const userId = localStorage.getItem('currentUserId');
  return userId;
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
    console.log('Missing user IDs, skipping channel setup');
    return null;
  }
  
  // Sort user IDs alphabetically for consistency
  return [userId1, userId2].sort();
};

/**
 * Creates a consistent conversation ID from two user IDs
 * @param userId1 First user ID
 * @param userId2 Second user ID
 * @returns Alphabetically sorted IDs joined with underscore
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
 * Generate consistent channel names for different purposes
 */
export const getMessageChannelName = (conversationId: string | null): string => {
  return conversationId ? `messages_${conversationId}` : 'messages_unknown';
};

export const getReactionsChannelName = (conversationId: string | null): string => {
  return conversationId ? `reactions_${conversationId}` : 'reactions_unknown';
};

/**
 * Generate consistent database paths for different channels using the new nested structure
 */
export const getMessageChannelPath = (conversationId: string | null): string => {
  if (!conversationId) return 'messages/unknown';
  const parts = conversationId.split('_');
  if (parts.length !== 2) return 'messages/unknown';
  return `messages/${parts[0]}/${parts[1]}`;
};

export const getReactionsChannelPath = (conversationId: string | null): string => {
  if (!conversationId) return 'message_reactions/unknown';
  const parts = conversationId.split('_');
  if (parts.length !== 2) return 'message_reactions/unknown';
  return `message_reactions/${parts[0]}/${parts[1]}`;
};

export const getTypingStatusPath = (conversationId: string | null): string => {
  if (!conversationId) return 'typing_status/unknown';
  const parts = conversationId.split('_');
  if (parts.length !== 2) return 'typing_status/unknown';
  return `typing_status/${parts[0]}/${parts[1]}`;
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
  
  // For the new nested structure, check if userId matches either uid1 or uid2
  const pathParts = path.split('/');
  if (pathParts.length >= 3) {
    const uid1 = pathParts[1];
    const uid2 = pathParts[2];
    return userId === uid1 || userId === uid2;
  }
  
  return false;
};
