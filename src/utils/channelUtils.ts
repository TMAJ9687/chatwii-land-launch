
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
 * Creates a consistent conversation ID from two user IDs
 * @param userId1 First user ID
 * @param userId2 Second user ID
 * @returns Alphabetically sorted IDs joined with underscore
 */
export const getConversationId = (
  userId1: string | null | undefined,
  userId2: string | null | undefined
): string | null => {
  if (!userId1 || !userId2) {
    console.log('Missing user IDs, skipping channel setup');
    return null;
  }
  
  // Sort user IDs alphabetically for consistency
  const sortedIds = [userId1, userId2].sort();
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
 * Generate consistent database paths for different channels
 */
export const getMessageChannelPath = (conversationId: string | null): string => {
  return conversationId ? `messages/${conversationId}` : 'messages/unknown';
};

export const getReactionsChannelPath = (conversationId: string | null): string => {
  return conversationId ? `reactions/${conversationId}` : 'reactions/unknown';
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
  
  if (path.includes('/')) {
    const parts = path.split('/');
    if (parts.length >= 2) {
      const conversationId = parts[1];
      // Check if userId is included in the conversation ID
      return conversationId.includes(userId);
    }
  }
  
  return false;
};
