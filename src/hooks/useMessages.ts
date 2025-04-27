
import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
      setMessages(getMockVipMessages(currentUserId));
      setIsLoading(false);
      setError(null);
      return;
    }
    
    isFetchingRef.current = true;
    setIsLoading(true);
    lastFetchTimeRef.current = now;
    
    const cutoffTime = getCutoffTimestamp(currentUserRole);
    
    try {
      // Query for messages between the two users
      const messagesQuery = query(
        collection(db, 'messages'),
        where('deleted_at', '==', null),
        where('participants', 'array-contains', currentUserId),
        orderBy('created_at', 'asc')
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const messagesData: MessageWithMedia[] = [];
      
      for (const doc of messagesSnapshot.docs) {
        const messageData = doc.data();
        
        // Check if this message is between the two users
        if ((messageData.sender_id === currentUserId && messageData.receiver_id === selectedUserId) || 
            (messageData.sender_id === selectedUserId && messageData.receiver_id === currentUserId)) {
              
          // Check if the message was created after the cutoff time
          if (messageData.created_at >= cutoffTime) {
            const message: MessageWithMedia = {
              id: doc.id,
              content: messageData.content || '',
              sender_id: messageData.sender_id,
              receiver_id: messageData.receiver_id,
              is_read: messageData.is_read || false,
              created_at: messageData.created_at,
              updated_at: messageData.updated_at,
              deleted_at: messageData.deleted_at,
              translated_content: messageData.translated_content,
              language_code: messageData.language_code,
              reply_to: messageData.reply_to,
              media: null,
              reactions: []
            };
            
            messagesData.push(message);
          }
        }
      }
      
      // Get media for each message
      const mediaPromises = messagesData.map(async message => {
        const mediaQuery = query(
          collection(db, 'message_media'),
          where('message_id', '==', message.id)
        );
        
        const mediaSnapshot = await getDocs(mediaQuery);
        if (!mediaSnapshot.empty) {
          const mediaDoc = mediaSnapshot.docs[0];
          message.media = {
            id: mediaDoc.id,
            ...mediaDoc.data()
          } as MessageWithMedia['media'];
        }
        
        // Get reactions for the message
        const reactionsQuery = query(
          collection(db, 'message_reactions'),
          where('message_id', '==', message.id)
        );
        
        const reactionsSnapshot = await getDocs(reactionsQuery);
        message.reactions = reactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MessageWithMedia['reactions'];
        
        return message;
      });
      
      const messagesWithMedia = await Promise.all(mediaPromises);
      
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
