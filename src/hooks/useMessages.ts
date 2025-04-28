
import { useState, useEffect, useCallback, useRef } from 'react';
import { Timestamp } from 'firebase/firestore';
import { queryDocuments } from '@/lib/firebase';
import { MessageWithMedia } from '@/types/message';
import { toast } from 'sonner';
import { getMockVipMessages, isMockUser } from '@/utils/mockUsers';

// Helper function to convert any timestamp format to a numeric value for comparison
const getTimestampValue = (timestamp: string | Date | Timestamp | undefined): number => {
  if (!timestamp) return 0;
  
  if (timestamp instanceof Timestamp) {
    return timestamp.toMillis();
  } else if (timestamp instanceof Date) {
    return timestamp.getTime();
  } else if (typeof timestamp === 'string') {
    return new Date(timestamp).getTime();
  }
  
  return 0;
};

export const useMessages = (
  currentUserId: string | null,
  selectedUserId: string | null,
  currentUserRole: string,
  markMessagesAsRead: (userId: string) => Promise<void>
) => {
  const [messages, setMessages] = useState<MessageWithMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const maxRetries = 3;
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetState = useCallback(() => {
    setMessages([]);
    setError(null);
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const fetchMessages = useCallback(async (retryCount = 0) => {
    // Return early if already loading or if userIds are missing
    if (!selectedUserId || !currentUserId || isFetchingRef.current) {
      console.log('Skipping fetch: missing IDs or fetch in progress', {
        selectedUserId,
        currentUserId,
        isFetching: isFetchingRef.current
      });
      return;
    }
    
    // Special handling for mock VIP user
    if (isMockUser(selectedUserId)) {
      const mockMessages = getMockVipMessages(currentUserId);
      
      interface MockMessage {
        id: number;
        content: string;
        sender_id: string;
        receiver_id: string;
        is_read: boolean;
        created_at: string;
        media: any; 
        reactions?: any[];
      }
      
      const completeMessages: MessageWithMedia[] = (mockMessages as MockMessage[]).map(msg => ({
        ...msg,
        id: String(msg.id || ''),
        reactions: msg.reactions || []
      }));

      console.log('Setting mock messages:', completeMessages);
      setMessages(completeMessages);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    console.log('Fetching messages between users:', {currentUserId, selectedUserId});
    isFetchingRef.current = true;
    setIsLoading(true);
    
    try {
      // Simplified query approach
      const messages = await fetchAllMessages(currentUserId, selectedUserId);
      
      console.log('Final fetched messages:', messages.length);
      setMessages(messages);
      setError(null);
      
      // Mark messages as read after fetching
      if (selectedUserId) {
        await markMessagesAsRead(selectedUserId).catch(err => {
          console.error('Error marking messages as read:', err);
        });
      }
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(`Failed to load messages: ${err.message || 'Unknown error'}`);
      
      if (err.message?.includes('index')) {
        toast.error("Firebase index required. Please check console for details.");
      } else {
        toast.error("Failed to load messages");
      }
      
      // Implement retry logic
      if (retryCount < maxRetries) {
        retryTimeoutRef.current = setTimeout(() => {
          console.log(`Retrying fetch messages (attempt ${retryCount + 1})`);
          fetchMessages(retryCount + 1);
        }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
      }
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [selectedUserId, currentUserId, markMessagesAsRead]);

  // Helper function to fetch and process all messages between two users
  const fetchAllMessages = async (userId1: string, userId2: string): Promise<MessageWithMedia[]> => {
    // Fetch both directions at once
    const [fromUser1, fromUser2] = await Promise.all([
      queryDocuments('messages', [
        { field: 'sender_id', operator: '==', value: userId1 },
        { field: 'receiver_id', operator: '==', value: userId2 }
      ]),
      queryDocuments('messages', [
        { field: 'sender_id', operator: '==', value: userId2 },
        { field: 'receiver_id', operator: '==', value: userId1 }
      ])
    ]);
    
    console.log(`Messages from ${userId1}: ${fromUser1.length}, from ${userId2}: ${fromUser2.length}`);
    
    // Combine and process messages
    const allMessages = [...fromUser1, ...fromUser2].filter(msg => msg && typeof msg === 'object');
    const processedMessages = await processMessages(allMessages);
    
    // Sort by creation date
    return processedMessages.sort((a, b) => {
      const dateA = getTimestampValue(a.created_at);
      const dateB = getTimestampValue(b.created_at);
      return dateA - dateB;
    });
  };

  // Process raw message data into proper MessageWithMedia format
  const processMessages = async (rawMessages: any[]): Promise<MessageWithMedia[]> => {
    const formattedMessages = rawMessages.map(message => {
      let createdAt = message.created_at;
      if (createdAt) {
        if (createdAt instanceof Timestamp) {
          createdAt = new Date(createdAt.toMillis()).toISOString();
        } else if (typeof createdAt === 'object' && 'seconds' in createdAt) {
          createdAt = new Date((createdAt as any).seconds * 1000).toISOString();
        } else if (createdAt instanceof Date) {
          createdAt = createdAt.toISOString();
        }
      } else {
        createdAt = new Date().toISOString();
      }
      
      return {
        id: String(message.id || ''),
        content: message.content || '',
        sender_id: message.sender_id || '',
        receiver_id: message.receiver_id || '',
        is_read: Boolean(message.is_read),
        created_at: createdAt,
        updated_at: message.updated_at,
        deleted_at: message.deleted_at,
        translated_content: message.translated_content,
        language_code: message.language_code,
        reply_to: message.reply_to,
        media: null,
        reactions: [],
        participants: message.participants || [message.sender_id, message.receiver_id].filter(Boolean)
      };
    });
    
    // Get media and reactions in batches
    const messagesWithMedia = await Promise.all(
      formattedMessages.map(async (message) => {
        try {
          const mediaRecords = await queryDocuments('message_media', [
            { field: 'message_id', operator: '==', value: message.id }
          ]);
          
          if (mediaRecords.length > 0) {
            const mediaRecord = mediaRecords[0];
            message.media = {
              id: mediaRecord.id || '',
              message_id: mediaRecord.message_id || '',
              user_id: mediaRecord.user_id || '',
              file_url: mediaRecord.file_url || '',
              media_type: mediaRecord.media_type as 'image' | 'voice' | 'video' || 'image',
              created_at: mediaRecord.created_at || new Date().toISOString()
            };
          }
          
          const reactionRecords = await queryDocuments('message_reactions', [
            { field: 'message_id', operator: '==', value: message.id }
          ]);
          
          if (Array.isArray(reactionRecords)) {
            message.reactions = reactionRecords
              .filter(reaction => reaction && typeof reaction === 'object')
              .map(reaction => ({
                id: reaction.id || '',
                message_id: reaction.message_id || '',
                user_id: reaction.user_id || '',
                emoji: reaction.emoji || '',
                created_at: reaction.created_at || new Date().toISOString()
              }));
          }
        } catch (e) {
          console.error(`Error processing message ${message.id}:`, e);
        }
        
        return message;
      })
    );
    
    return messagesWithMedia;
  };

  // Clean up any pending retries when component unmounts or dependencies change
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [selectedUserId, currentUserId]);

  // Reset state when selecting a new user
  useEffect(() => {
    resetState();
  }, [selectedUserId, resetState]);

  return {
    messages,
    setMessages,
    fetchMessages,
    isLoading,
    error,
    resetState
  };
};
