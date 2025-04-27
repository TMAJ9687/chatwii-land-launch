
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useChannelManagement } from './useChannelManagement';
import { isMockUser } from '@/utils/mockUsers';

export const useReactionsChannel = (
  currentUserId: string | null,
  selectedUserId: string | null,
  fetchMessages: () => void
) => {
  const { registerChannel } = useChannelManagement();

  const setupReactionsChannel = useCallback(() => {
    if (!currentUserId || !selectedUserId) return null;

    const channel = supabase
      .channel('message-reactions')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'message_reactions'
        },
        async (payload) => {
          // Type safety: check if payload.new exists and has a user_id property
          const payloadData = payload.new as Record<string, any> | undefined;
          
          // Skip mock user updates
          if (payloadData && isMockUser(payloadData.user_id as string)) return;
          
          // Only refresh messages when reactions change
          if (selectedUserId) {
            fetchMessages();
          }
        }
      )
      .subscribe((status) => {
        console.log('Reactions channel status:', status);
      });

    return registerChannel('reactionsChannel', channel);
  }, [currentUserId, selectedUserId, fetchMessages, registerChannel]);

  return { setupReactionsChannel };
};
