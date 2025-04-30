
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

// Message channel helpers
export const getMessageChannelName = (conversationId: string): string => {
  return `messages_${conversationId}`;
};

export const getMessageChannelPath = (conversationId: string): string => {
  return `messages/${conversationId}`;
};

// Reactions channel helpers
export const getReactionsChannelName = (conversationId: string): string => {
  return `reactions_${conversationId}`;
};

export const getReactionsChannelPath = (conversationId: string): string => {
  return `message_reactions/${conversationId}`;
};

// Typing status channel helpers
export const getTypingChannelName = (conversationId: string): string => {
  return `typing_${conversationId}`;
};

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

  // Match the security rules using contains() - Firebase RTDB method
  const userIdStr = String(userId);
  const containsUserId = conversationId.includes(userIdStr);
  
  return {
    allowed: containsUserId,
    details: `ConversationId: ${conversationId}, UserId: ${userIdStr}, Contains: ${containsUserId}`
  };
};

// User ID storage
export const storeCurrentUserId = (userId: string | null) => {
  if (userId) {
    console.log('Storing current user ID in localStorage:', userId);
    localStorage.setItem('userId', userId);
  } else {
    console.log('Clearing current user ID from localStorage');
    localStorage.removeItem('userId');
  }
};

export const getCurrentUserId = (): string | null => {
  const userId = localStorage.getItem('userId');
  console.log('Retrieved current user ID from localStorage:', userId);
  return userId;
};
