
/**
 * Utilities for chat channels and message paths
 */

// Store current user ID in localStorage for convenience
export const storeCurrentUserId = (userId: string | null): void => {
  if (userId) {
    localStorage.setItem('userId', userId);
  } else {
    localStorage.removeItem('userId');
  }
};

// Get a consistent conversation ID for two users
export const getConversationId = (userId1: string | null, userId2: string | null): string | null => {
  if (!userId1 || !userId2) return null;
  return [userId1, userId2].sort().join('_');
};

// Get the path for messages between two users
export const getMessagesPath = (userId1: string | null, userId2: string | null): string | null => {
  const conversationId = getConversationId(userId1, userId2);
  if (!conversationId) return null;
  return `messages/${conversationId}`;
};

// Get the path for reactions to a message
export const getReactionsPath = (userId1: string | null, userId2: string | null): string | null => {
  const conversationId = getConversationId(userId1, userId2);
  if (!conversationId) return null;
  return `reactions/${conversationId}`;
};

// Get the path for typing status between two users
export const getTypingStatusPath = (userId1: string | null, userId2: string | null): string | null => {
  const conversationId = getConversationId(userId1, userId2);
  if (!conversationId) return null;
  return `typing_status/${conversationId}`;
};

// Generate a channel name for reactions based on conversation ID
export const getReactionsChannelName = (conversationId: string | null): string => {
  if (!conversationId) return 'reactions_null';
  return `reactions_${conversationId}`;
};

// Debug function to test database access rules
export const debugConversationAccess = (path: string, userId: string | null): string => {
  if (!userId) return `No access to ${path}: user not authenticated`;
  return `User ${userId} has access to ${path}`;
};
