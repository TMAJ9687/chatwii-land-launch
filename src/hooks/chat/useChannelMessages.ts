
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useChannel } from './useChannel';
import { getMessagesPath } from '@/utils/channelPath';
import { MessageWithMedia } from '@/types/message';
import { isMockUser } from '@/utils/mockUsers';
import { getMockVipMessages } from '@/utils/mockUsers';
import { Timestamp } from 'firebase/firestore';

/**
 * Helper function to handle Firebase Timestamp conversion
 */
const formatTimestamp = (timestamp: string | Date | Timestamp | null | undefined): string => {
  if (!timestamp) return new Date().toISOString();
  
  // Handle Firebase Timestamp objects
  if (typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  
  // Handle Date objects
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  
  // Handle string timestamps
  return String(timestamp);
};

/**
 * Hook for fetching and subscribing to messages between two users
 */
export const useChannelMessages = (
  currentUserId: string | null,
  selectedUserId: string | null
) => {
  const [messages, setMessages] = useState<MessageWithMedia[]>([]);
  
  // Handle mock users separately
  const isMockUserSelected = useMemo(() => 
    selectedUserId ? isMockUser(selectedUserId) : false, 
    [selectedUserId]
  );
  
  // Determine path for real-time database
  const messagesPath = useMemo(() => {
    if (isMockUserSelected || !currentUserId || !selectedUserId) return null;
    return getMessagesPath(currentUserId, selectedUserId);
  }, [currentUserId, selectedUserId, isMockUserSelected]);
  
  // Process raw message data from Firebase
  const processMessages = useCallback((data: any): MessageWithMedia[] => {
    if (!data) return [];
    
    try {
      const messageArray = Object.values(data);
      return messageArray
        .filter((msg: any) => msg && typeof msg === 'object' && msg.id)
        .map((msg: any) => ({
          id: msg.id,
          content: msg.content || '',
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          is_read: msg.is_read || false,
          created_at: formatTimestamp(msg.created_at),
          media: msg.media || null,
          // Ensure all required properties from MessageWithMedia are included
          reactions: msg.reactions || [],
          updated_at: formatTimestamp(msg.updated_at),
          deleted_at: msg.deleted_at ? formatTimestamp(msg.deleted_at) : null,
          translated_content: msg.translated_content || null,
          language_code: msg.language_code || null,
          reply_to: msg.reply_to || null
        } as MessageWithMedia))
        .sort((a: MessageWithMedia, b: MessageWithMedia) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateA - dateB;
        });
    } catch (err) {
      console.error("Error processing messages:", err);
      return [];
    }
  }, []);
  
  // Use our channel hook to listen for messages
  const { 
    data: channelData, 
    status: channelStatus, 
    error: channelError,
    reconnect
  } = useChannel<MessageWithMedia[]>(
    'messages',
    messagesPath,
    !isMockUserSelected && !!currentUserId && !!selectedUserId,
    processMessages
  );
  
  // Update messages state when channel data changes
  useEffect(() => {
    if (channelData) {
      setMessages(channelData);
    } else if (isMockUserSelected && currentUserId) {
      // Handle mock user data
      const mockMessages = getMockVipMessages(currentUserId);
      // Ensure mock messages have all required properties
      const processedMockMessages = (mockMessages as any[]).map(msg => ({
        ...msg,
        reactions: msg.reactions || [],
        updated_at: msg.updated_at || msg.created_at,
        deleted_at: msg.deleted_at || null,
        translated_content: msg.translated_content || null,
        language_code: msg.language_code || null,
        reply_to: msg.reply_to || null
      })) as MessageWithMedia[];
      setMessages(processedMockMessages);
    } else {
      setMessages([]);
    }
  }, [channelData, isMockUserSelected, currentUserId]);
  
  // Mark messages as read
  const markMessagesAsRead = useCallback(async () => {
    // In a real implementation, this would update the messages in Firebase
    console.log('Marking messages as read');
    // For now, we're just returning a resolved promise
    return Promise.resolve();
  }, []);
  
  return {
    messages,
    setMessages,
    isLoading: channelStatus === 'connecting',
    error: channelError,
    reconnect,
    markMessagesAsRead
  };
};
