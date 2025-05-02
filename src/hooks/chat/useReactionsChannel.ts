
import { useEffect, useCallback, useRef } from 'react';
import { useChannelManager } from './useChannelManager';
import { isMockUser } from '@/utils/mockUsers';
import { 
  getConversationId, 
  getReactionsChannelName, 
  getReactionsPath 
} from '@/utils/channelUtils';

export const useReactionsChannel = (
  currentUserId: string | null,
  selectedUserId: string | null,
  onReactionsChanged: () => void
) => {
  const { listenToChannel, cleanupChannel } = useChannelManager();
  const isListeningRef = useRef(false);
  const channelNameRef = useRef<string | null>(null);

  // Handle real-time reaction updates
  const handleRealTimeUpdate = useCallback((data: any) => {
    if (!data) return;
    
    try {
      // For reactions, simply trigger the provided callback
      onReactionsChanged();
    } catch (error) {
      console.error('Error handling reactions update:', error);
    }
  }, [onReactionsChanged]);

  // Main effect for setting up reaction channel
  useEffect(() => {
    // Skip if we don't have both user IDs
    if (!currentUserId || !selectedUserId || isMockUser(selectedUserId)) {
      if (isListeningRef.current) {
        console.log("Missing user IDs or mock user, cleaning up reactions channel");
        isListeningRef.current = false;
        if (channelNameRef.current) {
          cleanupChannel(channelNameRef.current);
          channelNameRef.current = null;
        }
      }
      return;
    }

    // Create unique channel name and path
    const convId = getConversationId(currentUserId, selectedUserId);
    const channelName = getReactionsChannelName(convId);
    const path = getReactionsPath(currentUserId, selectedUserId);
    
    // Store the channel name for cleanup
    channelNameRef.current = channelName;
    
    // Mark that we're now listening
    isListeningRef.current = true;
    console.log(`Setting up reactions channel: ${channelName}`);
    
    // Subscribe
    const cleanup = listenToChannel(channelName, path || '', handleRealTimeUpdate);
    
    // Return cleanup function
    return () => {
      console.log(`Cleaning up reactions channel ${channelName}`);
      isListeningRef.current = false;
      cleanup();
    };
  }, [
    currentUserId,
    selectedUserId,
    listenToChannel,
    cleanupChannel,
    handleRealTimeUpdate
  ]);
};
