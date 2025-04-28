
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
    // Convert Firebase Timestamp to milliseconds
    return timestamp.toMillis();
  } else if (timestamp instanceof Date) {
    // Convert Date to milliseconds
    return timestamp.getTime();
  } else if (typeof timestamp === 'string') {
    // Parse string date to milliseconds
    return new Date(timestamp).getTime();
  }
  
  return 0;
};

const getCutoffTimestamp = (role: string) => {
  const now = new Date();
  let hoursAgo = 1;
  if (role === 'vip' || role === 'admin') {
    hoursAgo = 10;
  }
  now.setHours(now.getHours() - hoursAgo);
  return Timestamp.fromDate(now);
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
  const lastFetchTimeRef = useRef<number>(0);
  const FETCH_COOLDOWN = 2000; // 2 seconds cooldown between fetches
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
    // Return early if already loading, if userIds are missing, or if fetch is in progress
    if (!selectedUserId || !currentUserId || isFetchingRef.current) {
      console.log('Skipping fetch: missing IDs or fetch in progress', {
        selectedUserId,
        currentUserId,
        isFetching: isFetchingRef.current
      });
      return;
    }
    
    // Check if enough time has passed since last fetch
    const now = Date.now();
    if (now - lastFetchTimeRef.current < FETCH_COOLDOWN) {
      console.log('Skipping fetch: cooldown period', {
        timeSinceLastFetch: now - lastFetchTimeRef.current,
        cooldown: FETCH_COOLDOWN
      });
      return;
    }
    
    // Special handling for mock VIP user
    if (isMockUser(selectedUserId)) {
      const mockMessages = getMockVipMessages(currentUserId);
      
      // Ensure mock messages have the correct format for TypeScript
      // First, create a proper type that matches exactly what getMockVipMessages returns
      // so we can properly map it to MessageWithMedia
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
      
      // Map the mock messages to the correct type with string IDs
      const completeMessages: MessageWithMedia[] = (mockMessages as MockMessage[]).map(msg => ({
        ...msg,
        id: String(msg.id || ''),  // Ensure ID is a string
        reactions: msg.reactions || []  // Ensure reactions array exists
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
    lastFetchTimeRef.current = Date.now();
    
    try {
      // Use a single simple query approach that doesn't require complex indexing
      const fromCurrentUser = await queryDocuments('messages', [
        { field: 'sender_id', operator: '==', value: currentUserId },
        { field: 'receiver_id', operator: '==', value: selectedUserId }
      ]);
      
      console.log('Messages from current user:', fromCurrentUser.length);
      
      const fromSelectedUser = await queryDocuments('messages', [
        { field: 'sender_id', operator: '==', value: selectedUserId },
        { field: 'receiver_id', operator: '==', value: currentUserId }
      ]);
      
      console.log('Messages from selected user:', fromSelectedUser.length);
      
      // Combine both sets of messages
      const allMessages = [...fromCurrentUser, ...fromSelectedUser];
      
      console.log('Combined raw messages:', allMessages.length);
      
      // Format messages to match MessageWithMedia type
      const formattedMessages: MessageWithMedia[] = [];
      
      for (const message of allMessages) {
        if (!message || typeof message !== 'object') {
          console.warn('Invalid message object skipped:', message);
          continue;
        }
        
        console.log('Processing message:', message.id);
        
        // Convert Firebase timestamp to ISO string if it exists
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
          console.warn('Message missing created_at, using current time:', message.id);
        }
        
        const messageWithMedia: MessageWithMedia = {
          id: String(message.id || ''),  // Ensure ID is a string
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
        
        formattedMessages.push(messageWithMedia);
      }
      
      console.log('Messages formatted:', formattedMessages.length);
      
      // Get media for each message
      const messagesWithMedia = await Promise.all(
        formattedMessages.map(async (message) => {
          console.log('Fetching media for message:', message.id);
          
          // Fetch media for this message
          const mediaRecords = await queryDocuments('message_media', [
            { field: 'message_id', operator: '==', value: message.id }
          ]);
          
          if (mediaRecords.length > 0) {
            console.log('Media found for message:', message.id);
            const mediaRecord = mediaRecords[0];
            if (mediaRecord && typeof mediaRecord === 'object') {
              message.media = {
                id: mediaRecord.id || '',
                message_id: mediaRecord.message_id || '',
                user_id: mediaRecord.user_id || '',
                file_url: mediaRecord.file_url || '',
                media_type: mediaRecord.media_type as 'image' | 'voice' | 'video' || 'image',
                created_at: mediaRecord.created_at || new Date().toISOString()
              };
            }
          }
          
          // Fetch reactions for this message
          const reactionRecords = await queryDocuments('message_reactions', [
            { field: 'message_id', operator: '==', value: message.id }
          ]);
          
          // Ensure reaction records are valid before mapping
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
          
          return message;
        })
      );
      
      // Sort messages by creation date using our helper function
      const sortedMessages = messagesWithMedia.sort((a, b) => {
        const dateA = getTimestampValue(a.created_at);
        const dateB = getTimestampValue(b.created_at);
        return dateA - dateB;
      });
      
      console.log('Final sorted messages:', sortedMessages.length);
      setMessages(sortedMessages);
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
      
      // Show more helpful error message for index errors
      if (err.message?.includes('index')) {
        toast.error("Firebase index required. Please check console for details.");
        console.info("To fix this error, create the required index in Firebase. Follow the link in the console error message.");
      } else {
        toast.error("Failed to load messages");
      }
      
      // Implement retry logic
      if (retryCount < maxRetries) {
        retryTimeoutRef.current = setTimeout(() => {
          console.log(`Retrying fetch messages (attempt ${retryCount + 1})`);
          fetchMessages(retryCount + 1);
        }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
        return;
      }
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [selectedUserId, currentUserId, currentUserRole, markMessagesAsRead]);

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
