
import { useCallback, useEffect, useState } from 'react';
import { useChannelManager } from './useChannelManager';
import { isMockUser } from '@/utils/mockUsers';

export const useReactionsChannel = (
  currentUserId: string | null,
  selectedUserId: string | null,
  fetchMessages: () => void
) => {
  const [isListening, setIsListening] = useState(false);
  const { listenToChannel, cleanupChannel, getConversationId } = useChannelManager();
  
  // Setup reactions listener
  const setupReactionsListener = useCallback(() => {
    if (!currentUserId || !selectedUserId || isMockUser(selectedUserId)) {
      return;
    }
    
    setIsListening(true);
    
    // Generate a consistent conversation ID
    const conversationId = getConversationId(currentUserId, selectedUserId);
    const channelName = `reactions_${conversationId}`;
    const path = `message_reactions/${conversationId}`;
    
    // Set up channel listener with proper cleanup
    listenToChannel(channelName, path, (data) => {
      // Only refetch if there's actual data
      if (data) {
        fetchMessages();
      }
    });
    
    // Return cleanup function
    return () => {
      cleanupChannel(channelName);
      setIsListening(false);
    };
  }, [currentUserId, selectedUserId, listenToChannel, cleanupChannel, getConversationId, fetchMessages]);

  // Clean up the reactions listener
  const cleanupReactionListener = useCallback(() => {
    if (currentUserId && selectedUserId) {
      const conversationId = getConversationId(currentUserId, selectedUserId);
      cleanupChannel(`reactions_${conversationId}`);
    }
    setIsListening(false);
  }, [currentUserId, selectedUserId, cleanupChannel, getConversationId]);

  // Set up and clean up the reactions channel on user selection change
  useEffect(() => {
    if (currentUserId && selectedUserId && !isMockUser(selectedUserId) && !isListening) {
      const cleanup = setupReactionsListener();
      return cleanup;
    }
    
    return () => cleanupReactionListener();
  }, [currentUserId, selectedUserId, isListening, setupReactionsListener, cleanupReactionListener]);

  return { setupReactionsListener, cleanupReactionListener, isListening };
};
