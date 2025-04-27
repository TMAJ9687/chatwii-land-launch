
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
      const completeMessages: MessageWithMedia[] = mockMessages.map(msg => ({
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
    
    const cutoffTime = getCutoffTimestamp(currentUserRole);
    
    try {
      // Query for messages between the two users
      const messagesData = await queryDocuments('messages', [
        { field: 'deleted_at', operator: '==', value: null },
        { field: 'participants', operator: 'array-contains', value: currentUserId }
      ], 'created_at', 'asc');
      
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
          // Initialize reactions as an empty array if it doesn't exist
          reactions: [],
          participants: message.participants
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
      
      setMessages(messagesWithMedia);
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
      
      // Implement retry logic
      if (retryCount < maxRetries) {
        retryTimeoutRef.current = setTimeout(() => {
          fetchMessages(retryCount + 1);
        }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
        return;
      }
      
      toast.error("Failed to load messages");
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
