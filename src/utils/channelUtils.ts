
/**
 * Utilities for working with channel IDs and paths in Firebase Realtime Database
 */

/**
 * Creates a consistent conversation ID from two user IDs
 * Always sorts the IDs to ensure consistency regardless of order
 */
export const getConversationId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

/**
 * Generate a channel name for realtime messaging
 */
export const getMessageChannelName = (conversationId: string): string => {
  return `messages_${conversationId}`;
};

/**
 * Generate a channel name for typing indicators
 */
export const getTypingChannelName = (conversationId: string): string => {
  return `typing_${conversationId}`;
};

/**
 * Generate a channel name for reactions
 */
export const getReactionsChannelName = (conversationId: string): string => {
  return `reactions_${conversationId}`;
};

/**
 * Get database path for messages in a conversation
 */
export const getMessagesPath = (conversationId: string): string => {
  return `messages/${conversationId}`;
};

/**
 * Get database path for typing indicators in a conversation
 */
export const getTypingPath = (conversationId: string): string => {
  return `typing/${conversationId}`;
};

/**
 * Get database path for message reactions in a conversation
 */
export const getReactionsPath = (conversationId: string): string => {
  return `message_reactions/${conversationId}`;
};
