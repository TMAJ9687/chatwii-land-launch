
import { MessageWithMedia } from '@/types/message';

/**
 * Sort messages by date in ascending order (oldest first)
 */
export function sortMessagesByDate(messages: MessageWithMedia[]): MessageWithMedia[] {
  return [...messages].sort((a, b) => {
    const dateA = getMessageTimestamp(a.created_at);
    const dateB = getMessageTimestamp(b.created_at);
    return dateA - dateB;
  });
}

/**
 * Get a numeric timestamp value from various date formats
 */
export function getMessageTimestamp(timestamp: any): number {
  if (!timestamp) return 0;
  
  if (timestamp instanceof Date) {
    return timestamp.getTime();
  } 
  
  if (typeof timestamp === 'object' && 'seconds' in timestamp) {
    return timestamp.seconds * 1000;
  }
  
  if (typeof timestamp === 'string') {
    return new Date(timestamp).getTime();
  }
  
  return 0;
}

/**
 * Check if two messages are the same
 */
export function areMessagesEqual(msg1: MessageWithMedia, msg2: MessageWithMedia): boolean {
  return msg1.id === msg2.id && 
    msg1.content === msg2.content &&
    msg1.is_read === msg2.is_read &&
    (msg1.updated_at === msg2.updated_at);
}

/**
 * Create a unique key for a message based on its content and timestamp
 */
export function createMessageKey(message: MessageWithMedia): string {
  // Use ID plus update time to make a unique key
  const updateTime = message.updated_at || message.created_at;
  return `${message.id}-${updateTime}`;
}

/**
 * Merge two message arrays, prioritizing newest versions
 * and maintaining order
 */
export function mergeMessages(
  currentMessages: MessageWithMedia[],
  newMessages: MessageWithMedia[]
): MessageWithMedia[] {
  if (!newMessages || newMessages.length === 0) return currentMessages;
  if (!currentMessages || currentMessages.length === 0) return [...newMessages];
  
  // Create a map of existing messages by ID
  const messageMap = new Map<string, MessageWithMedia>();
  
  // Add all current messages to map
  currentMessages.forEach(msg => {
    messageMap.set(msg.id, msg);
  });
  
  // Add or update with new messages
  newMessages.forEach(msg => {
    // If message doesn't exist or is newer, update it
    const existing = messageMap.get(msg.id);
    if (!existing || getMessageTimestamp(msg.updated_at || msg.created_at) >= 
        getMessageTimestamp(existing.updated_at || existing.created_at)) {
      messageMap.set(msg.id, msg);
    }
  });
  
  // Convert back to array and sort
  return sortMessagesByDate(Array.from(messageMap.values()));
}
