
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

  const fetchMessages = useCallback(async () => {
    if (!selectedUserId || !currentUserId) return;
    
    const cutoffTime = getCutoffTimestamp(currentUserRole);

    console.log('Fetching initial messages...', {
      currentUserId,
      selectedUserId,
      cutoffTime,
      role: currentUserRole,
      timestamp: new Date().toISOString()
    });
    
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
    
    if (selectedUserId) {
      await markMessagesAsRead(selectedUserId);
    }
  }, [selectedUserId, currentUserId, currentUserRole, markMessagesAsRead]);

  return {
    messages,
    setMessages,
    fetchMessages
  };
};
