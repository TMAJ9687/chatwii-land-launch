

/**
 * Utility functions for managing Firebase Realtime Database channels
 */

/**
 * Generate a consistent conversation ID regardless of user order
 * @param user1Id First user ID
 * @param user2Id Second user ID
 * @returns Normalized conversation ID string
 */
export const getConversationId = (user1Id: string, user2Id: string): string => {
  if (!user1Id || !user2Id) {
    console.error("Invalid user IDs for conversation:", user1Id, user2Id);
    // Return a fallback that won't match any messages
    return "invalid_conversation";
  }
  
  // Ensure both IDs are strings
  const id1 = String(user1Id).trim();
  const id2 = String(user2Id).trim();
  
  // Log the original IDs for debugging
  console.log(`Creating conversation ID from: "${id1}" and "${id2}"`);
  
  // Create sorted ID to ensure consistency
  const sortedIds = [id1, id2].sort();
  const conversationId = sortedIds.join('_');
  
  // Log the final conversation ID
  console.log(`Generated conversation ID: "${conversationId}"`);
  
  return conversationId;
};

/**
 * Generate a channel name for messages in a conversation
 * @param conversationId The conversation ID
 * @returns Channel name for messages
 */
export const getMessageChannelName = (conversationId: string): string => {
  return `messages_${conversationId}`;
};

/**
 * Generate a Firebase path for messages in a conversation
 * @param conversationId The conversation ID
 * @returns Firebase path for messages
 */
export const getMessageChannelPath = (conversationId: string): string => {
  return `messages/${conversationId}`;
};

/**
 * Generate a channel name for reactions in a conversation
 * @param conversationId The conversation ID
 * @returns Channel name for reactions
 */
export const getReactionsChannelName = (conversationId: string): string => {
  return `reactions_${conversationId}`;
};

/**
 * Generate a Firebase path for reactions in a conversation
 * @param conversationId The conversation ID
 * @returns Firebase path for reactions
 */
export const getReactionsChannelPath = (conversationId: string): string => {
  return `message_reactions/${conversationId}`;
};

/**
 * Generate a channel name for typing status in a conversation
 * @param conversationId The conversation ID
 * @returns Channel name for typing status
 */
export const getTypingChannelName = (conversationId: string): string => {
  return `typing_${conversationId}`;
};

/**
 * Generate a Firebase path for typing status in a conversation
 * @param conversationId The conversation ID
 * @returns Firebase path for typing status
 */
export const getTypingChannelPath = (conversationId: string): string => {
  return `typing_status/${conversationId}`;
};

/**
 * Normalize a Firebase snapshot value
 * @param snapshot Firebase snapshot value
 * @returns Normalized data object or null
 */
export const normalizeSnapshotValue = (snapshot: any): any => {
  if (!snapshot || !snapshot.val) return null;
  return snapshot.val();
};

/**
 * Debug function to verify if a user ID is part of a conversation ID
 * Helps troubleshoot Realtime Database security rules
 */
export const debugConversationAccess = (
  conversationId: string,
  userId: string
): { allowed: boolean; details: string } => {
  if (!conversationId || !userId) {
    return { 
      allowed: false,
      details: `Invalid params: conversationId=${conversationId}, userId=${userId}`
    };
  }

  const parts = conversationId.split('_');
  const userIdStr = String(userId);
  const containsUserId = conversationId.includes(userIdStr);
  const indexOfUserId = parts.indexOf(userIdStr);
  
  return {
    allowed: indexOfUserId !== -1,
    details: `ConversationId: ${conversationId}, UserId: ${userIdStr}, IndexOf: ${indexOfUserId}, Contains: ${containsUserId}`
  };
};
