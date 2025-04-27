
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageWithMedia } from '@/types/message';
import { useChannelManagement } from './useChannelManagement';
import { isMockUser } from '@/utils/mockUsers';

export const useMessageChannel = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<MessageWithMedia[]>>
) => {
  const { registerChannel } = useChannelManagement();

  const setupMessageChannel = useCallback(() => {
    if (!currentUserId) return null;

    const channel = supabase
      .channel('all-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(receiver_id.eq.${currentUserId},sender_id.eq.${currentUserId})`,
        },
        async (payload) => {
          const payloadNew = payload.new as Record<string, any>;
          
          // Skip if sender or receiver is a mock user
          if (payloadNew && (
              isMockUser(payloadNew.sender_id as string) || 
              isMockUser(payloadNew.receiver_id as string))) {
            return;
          }
          
          if (selectedUserId && payloadNew && 
             ((payloadNew.sender_id === currentUserId && payloadNew.receiver_id === selectedUserId) ||
              (payloadNew.sender_id === selectedUserId && payloadNew.receiver_id === currentUserId))) {
            
            const newMessage = payloadNew as MessageWithMedia;
            
            setMessages(current => {
              const exists = current.some(msg =>
                (msg.id === newMessage.id) ||
                (msg.content === newMessage.content &&
                  msg.sender_id === newMessage.sender_id &&
                  Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 1000)
              );
              
              if (!exists) {
                return [...current, { ...newMessage, media: null, reactions: [] }];
              }
              return current;
            });
            
            try {
              const { data: mediaData } = await supabase
                .from('message_media')
                .select('*')
                .eq('message_id', newMessage.id);
                
              if (mediaData?.length) {
                setMessages(current =>
                  current.map(msg =>
                    msg.id === newMessage.id
                      ? { ...msg, media: mediaData[0] }
                      : msg
                  )
                );
              }

              // Also fetch reactions
              const { data: reactionsData } = await supabase
                .from('message_reactions')
                .select('*')
                .eq('message_id', newMessage.id);
                
              if (reactionsData?.length) {
                setMessages(current =>
                  current.map(msg =>
                    msg.id === newMessage.id
                      ? { ...msg, reactions: reactionsData }
                      : msg
                  )
                );
              }
            } catch (error) {
              console.error('Error fetching media or reactions for message:', error);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `or(receiver_id.eq.${currentUserId},sender_id.eq.${currentUserId})`,
        },
        (payload) => {
          if (selectedUserId) {
            setMessages(current =>
              current.map(msg =>
                msg.id === payload.new.id
                  ? { ...msg, ...payload.new }
                  : msg
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Message channel status:', status);
      });

    return registerChannel('messageChannel', channel);
  }, [currentUserId, selectedUserId, setMessages, registerChannel]);

  return { setupMessageChannel };
};
