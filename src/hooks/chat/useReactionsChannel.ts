
import { useEffect } from 'react';
import { useChannelManager } from './useChannelManager';
import { isMockUser } from '@/utils/mockUsers';

export const useReactionsChannel = (
  currentUserId: string | null,
  selectedUserId: string | null,
  fetchMessages: () => void
) => {
  const { listenToChannel, cleanupChannel, getConversationId } = useChannelManager();

  useEffect(() => {
    if (
      !currentUserId ||
      !selectedUserId ||
      isMockUser(selectedUserId)
    ) {
      return;
    }

    const convId = getConversationId(currentUserId, selectedUserId);
    const channelName = `reactions_${convId}`;
    const path = `message_reactions/${convId}`;

    listenToChannel(channelName, path, (data) => {
      if (data) {
        fetchMessages();
      }
    });

    return () => {
      cleanupChannel(channelName);
    };
  }, [
    currentUserId,
    selectedUserId,
    getConversationId,
    listenToChannel,
    cleanupChannel,
    fetchMessages
  ]);
};
