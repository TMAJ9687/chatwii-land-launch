
import { useEffect } from 'react';
import { useChannelManager } from './useChannelManager';
import { isMockUser } from '@/utils/mockUsers';
import { 
  getConversationId, 
  getReactionsChannelName, 
  getReactionsChannelPath 
} from '@/utils/channelUtils';

export const useReactionsChannel = (
  currentUserId: string | null,
  selectedUserId: string | null,
  fetchMessages: () => void
) => {
  const { listenToChannel, cleanupChannel } = useChannelManager();

  useEffect(() => {
    if (
      !currentUserId ||
      !selectedUserId ||
      isMockUser(selectedUserId)
    ) {
      return;
    }

    const convId = getConversationId(currentUserId, selectedUserId);
    const channelName = getReactionsChannelName(convId);
    const path = getReactionsChannelPath(convId);

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
    listenToChannel,
    cleanupChannel,
    fetchMessages
  ]);
};
