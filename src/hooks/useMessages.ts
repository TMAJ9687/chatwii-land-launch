
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageWithMedia } from '@/types/message';
import { toast } from 'sonner';

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
  const [fetchCount, setFetchCount] = useState(0); // Add a counter to track fetch calls

  const fetchMessages = useCallback(async () => {
    // Return early if already loading or if userIds are missing
    if (!selectedUserId || !currentUserId || isLoading) return;
    
    setIsLoading(true);
    const cutoffTime = getCutoffTimestamp(currentUserRole);
    
    // Log with counter to track how many times this gets called
    console.log(`[useMessages] Fetching messages (call #${fetchCount + 1})`, {
      currentUserId,
      selectedUserId,
      cutoffTime,
      timestamp: new Date().toISOString()
    });
    
    setFetchCount(prev => prev + 1);
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          message_media (*)
        `)
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${currentUserId})`)
        .gte('created_at', cutoffTime)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        toast.error("Failed to load messages");
        return;
      }

      const messagesWithMedia = data.map(message => ({
        ...message,
        media: message.message_media?.[0] || null,
      }));
      
      setMessages(messagesWithMedia);
      
      // Mark messages as read after fetching
      if (selectedUserId) {
        await markMessagesAsRead(selectedUserId);
      }
    } catch (err) {
      console.error('Unexpected error fetching messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedUserId, currentUserId, currentUserRole, markMessagesAsRead, isLoading, fetchCount]);

  return {
    messages,
    setMessages,
    fetchMessages,
    isLoading
  };
};
