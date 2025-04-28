
import { useState, useEffect, useCallback, useRef } from 'react';
import { Timestamp } from 'firebase/firestore';
import { queryDocuments } from '@/lib/firebase';
import { MessageWithMedia } from '@/types/message';
import { toast } from 'sonner';
import { getMockVipMessages, isMockUser } from '@/utils/mockUsers';

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
    if (!selectedUserId || !currentUserId || isFetchingRef.current) return;
    
    // Check if enough time has passed since last fetch
    const now = Date.now();
    if (now - lastFetchTimeRef.current < FETCH_COOLDOWN) {
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

      setMessages(completeMessages);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    isFetchingRef.current = true;
    setIsLoading(true);
    lastFetchTimeRef.current = Date.now();
    
    try {
      // Try to use a simpler query first that doesn't require complex indexing
      let messagesData;
      
      try {
        // First attempt: Use a simpler query that doesn't require the complex index
        messagesData = await queryDocuments('messages', [
          { field: 'sender_id', operator: '==', value: currentUserId },
          { field: 'receiver_id', operator: '==', value: selectedUserId }
        ], 'created_at', 'asc');
        
        // Then fetch messages in the other direction
        const reverseMessages = await queryDocuments('messages', [
          { field: 'sender_id', operator: '==', value: selectedUserId },
          { field: 'receiver_id', operator: '==', value: currentUserId }
        ], 'created_at', 'asc');
        
        // Combine both sets of messages
        messagesData = [...messagesData, ...reverseMessages];
        
      } catch (indexError) {
        console.warn("Simple query approach failed, trying alternative query", indexError);
        
        // Fallback to query that might need an index - this will help users know they need to create the index
        messagesData = await queryDocuments('messages', [
          { field: 'deleted_at', operator: '==', value: null },
          { field: 'participants', operator: 'array-contains', value: currentUserId }
        ], 'created_at', 'asc');
      }
      
      // Filter messages between current user and selected user
      const filteredMessages = messagesData.filter(msg => {
        if (typeof msg !== 'object' || !msg) return false;
        
        // Safely access properties
        const senderId = msg?.sender_id;
        const receiverId = msg?.receiver_id;
        
        if (!senderId || !receiverId) return false;
        
        return (senderId === currentUserId && receiverId === selectedUserId) || 
               (senderId === selectedUserId && receiverId === currentUserId);
      });
      
      // Format messages to match MessageWithMedia type
      const formattedMessages: MessageWithMedia[] = [];
      
      for (const message of filteredMessages) {
        if (typeof message !== 'object' || !message) continue;
        
        // Convert Firebase timestamp to ISO string if it exists
        let createdAt = message.created_at;
        if (createdAt && typeof createdAt !== 'string') {
          if (createdAt instanceof Timestamp || (createdAt as any).seconds) {
            createdAt = new Date((createdAt as any).seconds * 1000).toISOString();
          }
        }
        
        const messageWithMedia: MessageWithMedia = {
          id: String(message.id || ''),  // Ensure ID is a string
          content: message.content || '',
          sender_id: message.sender_id || '',
          receiver_id: message.receiver_id || '',
          is_read: message.is_read || false,
          created_at: createdAt || new Date().toISOString(),
          updated_at: message.updated_at,
          deleted_at: message.deleted_at,
          translated_content: message.translated_content,
          language_code: message.language_code,
          reply_to: message.reply_to,
          media: null,
          // Initialize reactions as an empty array
          reactions: [],
          participants: message.participants || [message.sender_id, message.receiver_id]
        };
        
        formattedMessages.push(messageWithMedia);
      }
      
      // Get media for each message
      const messagesWithMedia = await Promise.all(
        formattedMessages.map(async (message) => {
          // Fetch media for this message
          const mediaRecords = await queryDocuments('message_media', [
            { field: 'message_id', operator: '==', value: message.id }
          ]);
          
          if (mediaRecords.length > 0 && typeof mediaRecords[0] === 'object' && mediaRecords[0]) {
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
          
          // Fetch reactions for this message
          const reactionRecords = await queryDocuments('message_reactions', [
            { field: 'message_id', operator: '==', value: message.id }
          ]);
          
          // Ensure reaction records are valid before mapping
          if (Array.isArray(reactionRecords)) {
            message.reactions = reactionRecords
              .filter(reaction => typeof reaction === 'object' && reaction)
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
      
      // Sort messages by creation date
      const sortedMessages = messagesWithMedia.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateA - dateB;
      });
      
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
