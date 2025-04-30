
import { MessageWithMedia } from "@/types/message";

/**
 * Merges two arrays of messages, removing duplicates and preserving order
 * @param currentMessages Current messages in state
 * @param newMessages New messages to merge
 * @returns Merged array of messages
 */
export const mergeMessages = (
  currentMessages: MessageWithMedia[],
  newMessages: MessageWithMedia[]
): MessageWithMedia[] => {
  if (!newMessages || newMessages.length === 0) return currentMessages;
  if (!currentMessages || currentMessages.length === 0) return [...newMessages];

  // Create a map for fast lookup
  const messageMap = new Map<string, MessageWithMedia>();

  // Add all current messages to the map
  currentMessages.forEach(msg => {
    if (msg && msg.id) {
      messageMap.set(msg.id, msg);
    }
  });

  // Add or replace with new messages
  newMessages.forEach(msg => {
    if (msg && msg.id) {
      messageMap.set(msg.id, msg);
    }
  });

  // Convert map back to array and sort by creation date
  const mergedMessages = Array.from(messageMap.values()).sort((a, b) => {
    const dateA = a.created_at
      ? typeof a.created_at === 'string'
        ? new Date(a.created_at).getTime()
        : a.created_at instanceof Date
        ? a.created_at.getTime()
        : 0
      : 0;
    
    const dateB = b.created_at
      ? typeof b.created_at === 'string'
        ? new Date(b.created_at).getTime()
        : b.created_at instanceof Date
        ? b.created_at.getTime()
        : 0
      : 0;
    
    return dateA - dateB;
  });

  return mergedMessages;
};

/**
 * Insert a temporary message into the messages array
 * @param messages Current messages
 * @param tempMessage Temporary message to insert
 * @returns Updated messages array with temporary message
 */
export const insertTemporaryMessage = (
  messages: MessageWithMedia[],
  tempMessage: MessageWithMedia
): MessageWithMedia[] => {
  // First check if message with this ID already exists
  if (messages.some(msg => msg.id === tempMessage.id)) {
    return messages;
  }
  
  // Add new message and sort
  const updatedMessages = [...messages, tempMessage];
  
  // Sort by creation date
  return updatedMessages.sort((a, b) => {
    const dateA = a.created_at
      ? typeof a.created_at === 'string'
        ? new Date(a.created_at).getTime()
        : a.created_at instanceof Date
        ? a.created_at.getTime()
        : 0
      : 0;
    
    const dateB = b.created_at
      ? typeof b.created_at === 'string'
        ? new Date(b.created_at).getTime()
        : b.created_at instanceof Date
        ? b.created_at.getTime()
        : 0
      : 0;
    
    return dateA - dateB;
  });
};
