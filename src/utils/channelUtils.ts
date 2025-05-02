
/**
 * Utilities for chat channels and message paths
 */

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
