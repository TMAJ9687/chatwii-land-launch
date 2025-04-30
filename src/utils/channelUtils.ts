// channelUtils.ts

/**
 * Utility functions related to conversations.
 */

/**
 * Generate a consistent conversation ID regardless of user order.
 * This ID can be used as a field in Firestore documents for querying.
 * @param user1Id First user ID
 * @param user2Id Second user ID
 * @returns Normalized conversation ID string (e.g., "userAId_userBId")
 */
export const getConversationId = (user1Id: string, user2Id: string): string => {
  // Handles null/undefined cases defensively
  if (!user1Id || !user2Id) {
    console.warn("getConversationId called with invalid user IDs", user1Id, user2Id);
    // Return a predictable invalid ID or throw an error, depending on desired handling
    return 'invalid_conversation_id';
  }
  return [user1Id, user2Id].sort().join('_');
};

// Removed: getMessageChannelName (Used for RTDB listener management)
// Removed: getMessageChannelPath (Used for RTDB paths)
// Removed: getReactionsChannelName (Used for RTDB listener management)
// Removed: getReactionsChannelPath (Used for RTDB paths)
// Removed: getTypingChannelName (Used for RTDB listener management)
// Removed: getTypingChannelPath (Used for RTDB paths)
// Removed: normalizeSnapshotValue (Used for RTDB snapshots)