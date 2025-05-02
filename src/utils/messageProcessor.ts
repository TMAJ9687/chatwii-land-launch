
import { MessageWithMedia, MessageMedia, MessageReaction } from '@/types/message';
import { formatTimestamp, getTimestampValue } from '@/utils/timeUtils';

/**
 * Process raw message data from various sources into consistent MessageWithMedia objects
 */
export const processRawMessage = (msg: any): MessageWithMedia => {
  // Handle timestamps
  const createdAt = formatTimestamp(msg.created_at);
  const updatedAt = formatTimestamp(msg.updated_at || msg.created_at);
  const deletedAt = msg.deleted_at ? formatTimestamp(msg.deleted_at) : null;
  
  // Process media if present
  let media: MessageMedia | null = null;
  if (msg.media) {
    media = {
      id: msg.media.id || `media-${msg.id}`,
      message_id: msg.media.message_id || msg.id,
      user_id: msg.media.user_id || msg.sender_id,
      file_url: msg.media.file_url,
      media_type: msg.media.media_type || 'image',
      created_at: formatTimestamp(msg.media.created_at || msg.created_at)
    };
  }
  
  // Process reactions if present
  const reactions: MessageReaction[] = Array.isArray(msg.reactions) 
    ? msg.reactions.map((reaction: any) => ({
        id: reaction.id || `reaction-${Date.now()}-${Math.random()}`,
        message_id: reaction.message_id || msg.id,
        user_id: reaction.user_id,
        emoji: reaction.emoji,
        created_at: formatTimestamp(reaction.created_at || new Date())
      }))
    : [];
  
  // Create the final message object
  return {
    id: msg.id,
    content: msg.content || '',
    sender_id: msg.sender_id,
    receiver_id: msg.receiver_id,
    is_read: msg.is_read || false,
    created_at: createdAt,
    updated_at: updatedAt,
    deleted_at: deletedAt,
    translated_content: msg.translated_content || null,
    language_code: msg.language_code || null,
    reply_to: msg.reply_to || null,
    media,
    reactions,
    participants: msg.participants || [msg.sender_id, msg.receiver_id]
  };
};

/**
 * Sort messages by timestamp
 */
export const sortMessagesByTimestamp = (messages: MessageWithMedia[]): MessageWithMedia[] => {
  return [...messages].sort((a, b) => {
    const timeA = getTimestampValue(a.created_at);
    const timeB = getTimestampValue(b.created_at);
    return timeA - timeB;
  });
};

/**
 * Merges two arrays of messages, removing duplicates and preserving order
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

  // Convert map back to array and sort
  return sortMessagesByTimestamp(Array.from(messageMap.values()));
};

/**
 * Insert a temporary message into the messages array
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
  return sortMessagesByTimestamp([...messages, tempMessage]);
};
