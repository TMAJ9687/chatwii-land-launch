
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
  const lastFetchedUserIdRef = useRef<string | null>(null);

  const resetState = useCallback(() => {
    setMessages([]);
    setError(null);
    isFetchingRef.current = false;
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const fetchMessages = useCallback(async (retryCount = 0) => {
    // Return early if already loading or if userIds are missing
    if (
      !selectedUserId || 
      !currentUserId || 
      isFetchingRef.current ||
      selectedUserId === lastFetchedUserIdRef.current
    ) {
      return;
    }
    
    // Set state to prevent concurrent fetches
    isFetchingRef.current = true;
    lastFetchedUserIdRef.current = selectedUserId;
    setIsLoading(true);
    
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

      setMessages(completeMessages);
      setIsLoading(false);
      isFetchingRef.current = false;
      setError(null);
      return;
    }
    
    try {
      // Simplified query approach with batch processing
      const messages = await fetchAllMessages(currentUserId, selectedUserId);
      
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
          isFetchingRef.current = false; // Reset fetching state to allow retry
          fetchMessages(retryCount + 1);
        }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
      } else {
        isFetchingRef.current = false; // Reset on max retries
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        isFetchingRef.current = false; // Reset after a small delay to prevent rapid re-fetching
      }, 500);
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
    
    // Combine and filter valid messages
    const allMessages = [...fromUser1, ...fromUser2].filter(msg => msg && typeof msg === 'object');
    
    if (allMessages.length === 0) {
      return [];
    }
    
    // Get message IDs for batch queries
    const messageIds = allMessages.map(msg => msg.id).filter(Boolean);
    
    // Make batch queries for media and reactions
    const [mediaRecords, reactionRecords] = await Promise.all([
      queryDocuments('message_media', [
        { field: 'message_id', operator: 'in', value: messageIds }
      ]),
      queryDocuments('message_reactions', [
        { field: 'message_id', operator: 'in', value: messageIds }
      ])
    ]);
    
    // Create lookup maps
    const mediaByMessageId = mediaRecords.reduce((acc, media) => {
      if (media && media.message_id) {
        acc[media.message_id] = media;
      }
      return acc;
    }, {} as Record<string, any>);
    
    const reactionsByMessageId = reactionRecords.reduce((acc, reaction) => {
      if (reaction && reaction.message_id) {
        if (!acc[reaction.message_id]) {
          acc[reaction.message_id] = [];
        }
        acc[reaction.message_id].push(reaction);
      }
      return acc;
    }, {} as Record<string, any[]>);
    
    // Process all messages
    const processedMessages = allMessages.map(message => {
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
        media: mediaByMessageId[message.id] || null,
        reactions: reactionsByMessageId[message.id] || [],
        participants: message.participants || [message.sender_id, message.receiver_id].filter(Boolean)
      };
    });
    
    // Sort by creation date
    return processedMessages.sort((a, b) => {
      const dateA = getTimestampValue(a.created_at);
      const dateB = getTimestampValue(b.created_at);
      return dateA - dateB;
    });
  };

  // Clean up any pending retries when component unmounts or dependencies change
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [selectedUserId, currentUserId]);

  // Reset state and trigger fetch when selecting a new user
  useEffect(() => {
    if (selectedUserId !== lastFetchedUserIdRef.current) {
      resetState();
      fetchMessages();
    }
  }, [selectedUserId, resetState, fetchMessages]);

  return {
    messages,
    setMessages,
    fetchMessages,
    isLoading,
    error,
    resetState
  };
};
