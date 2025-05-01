
/**
 * Simplified utilities for generating consistent Firebase Realtime Database paths
 */

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
 * Check if path is valid for access control
 */
export const isValidPath = (path: string | null): boolean => {
  if (!path) return false;
  return !path.includes('undefined') && !path.includes('null') && path.split('/').length >= 2;
};
