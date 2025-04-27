
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useChannelManagement } from './useChannelManagement';
import { MessageWithMedia } from '@/types/message';
import { isMockUser } from '@/utils/mockUsers';

type MessageChannelType = ReturnType<typeof supabase.channel> | null;

export const useMessageChannel = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<MessageWithMedia[]>>
) => {
  const { registerChannel } = useChannelManagement();

  const setupMessageChannel = useCallback((): MessageChannelType => {
    if (!currentUserId || !selectedUserId) return null;

    const channelName = `private-messages-${currentUserId}-${selectedUserId}`;
    
    // For message between the current user and selected user
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `(sender_id=eq.${currentUserId} AND receiver_id=eq.${selectedUserId}) OR (sender_id=eq.${selectedUserId} AND receiver_id=eq.${currentUserId})`,
        },
        async (payload) => {
          // Skip mock user updates
          if (isMockUser(payload.new.sender_id as string)) return;
          
          // Fetch the full message with media
          const { data, error } = await supabase
            .from('messages')
            .select(`
              *,
              message_media(*),
              message_reactions(*)
            `)
            .eq('id', payload.new.id)
            .maybeSingle();
            
          if (error || !data) {
            console.error('Error fetching new message details:', error);
            return;
          }
          
          const newMessage: MessageWithMedia = {
            ...data,
            media: data.message_media?.[0] || null,
            reactions: data.message_reactions || []
          };
          
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `(sender_id=eq.${currentUserId} AND receiver_id=eq.${selectedUserId}) OR (sender_id=eq.${selectedUserId} AND receiver_id=eq.${currentUserId})`,
        },
        (payload) => {
          // Skip mock user updates
          if (isMockUser(payload.new.sender_id as string)) return;
          
          setMessages(prev => 
            prev.map(msg => 
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            )
          );
        }
      )
      .subscribe((status) => {
        console.log(`Message channel status: ${status} for channel ${channelName}`);
      });

    return registerChannel(channelName, channel);
  }, [currentUserId, selectedUserId, setMessages, registerChannel]);

  return { setupMessageChannel };
};
