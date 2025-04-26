
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
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
  return now.toISOString();
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
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          message_media (*),
          message_reactions (*)
        `)
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${currentUserId})`)
        .is('deleted_at', null) // Only fetch messages that aren't deleted
        .gte('created_at', cutoffTime)
        .order('created_at', { ascending: true });

      if (error) {
        setError(`Failed to load messages: ${error.message}`);
        console.error('Error fetching messages:', error);
        
        // Implement retry logic
        if (retryCount < maxRetries) {
          retryTimeoutRef.current = setTimeout(() => {
            fetchMessages(retryCount + 1);
          }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
          return;
        }
        
        toast.error("Failed to load messages");
        return;
      }

      const messagesWithMedia = data.map(message => ({
        ...message,
        media: message.message_media?.[0] || null,
        reactions: message.message_reactions || []
      }));
      
      setMessages(messagesWithMedia);
      setError(null);
      
      // Mark messages as read after fetching
      if (selectedUserId) {
        await markMessagesAsRead(selectedUserId).catch(err => {
          console.error('Error marking messages as read:', err);
        });
      }
    } catch (err: any) {
      console.error('Unexpected error fetching messages:', err);
      setError(`Unexpected error: ${err.message || 'Unknown error'}`);
      
      // Implement retry logic for unexpected errors
      if (retryCount < maxRetries) {
        retryTimeoutRef.current = setTimeout(() => {
          fetchMessages(retryCount + 1);
        }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
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
