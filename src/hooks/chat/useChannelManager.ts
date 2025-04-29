
import { useRef, useCallback, useEffect } from 'react';
import { ref, onValue, off, DatabaseReference } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/client';

// Type for channel registry
interface ChannelRegistry {
  [key: string]: DatabaseReference;
}

export const useChannelManager = () => {
  const channelsRef = useRef<ChannelRegistry>({});
  const isMountedRef = useRef(true);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cleanupAllChannels(true);
    };
  }, []);

  // Hash userId pair for consistent conversation IDs
  const getConversationId = useCallback((userId1: string, userId2: string) => {
    return [userId1, userId2].sort().join('_');
  }, []);
  
  // Setup a channel with auto-cleanup
  const listenToChannel = useCallback((channelName: string, path: string, onData: (data: any) => void) => {
    if (!isMountedRef.current) return () => {};
    
    // Clean up existing channel if it exists
    cleanupChannel(channelName);
    
    try {
      const channelRef = ref(realtimeDb, path);
      
      onValue(channelRef, (snapshot) => {
        if (!isMountedRef.current) return;
        const data = snapshot.val();
        onData(data);
      }, (error) => {
        console.error(`Error in channel ${channelName}:`, error);
      });
      
      // Store the reference for later cleanup
      channelsRef.current[channelName] = channelRef;
      
      // Return cleanup function
      return () => {
        cleanupChannel(channelName);
      };
    } catch (error) {
      console.error(`Error setting up channel ${channelName}:`, error);
      return () => {};
    }
  }, []);
  
  // Clean up a specific channel
  const cleanupChannel = useCallback((channelName: string) => {
    if (channelsRef.current[channelName]) {
      try {
        off(channelsRef.current[channelName]);
        delete channelsRef.current[channelName];
      } catch (error) {
        console.error(`Error cleaning up channel ${channelName}:`, error);
      }
    }
  }, []);
  
  // Clean up all channels (forced or only if component unmounted)
  const cleanupAllChannels = useCallback((force: boolean = false) => {
    if (!isMountedRef.current && !force) return;
    
    Object.keys(channelsRef.current).forEach(channelName => {
      cleanupChannel(channelName);
    });
  }, [cleanupChannel]);
  
  return {
    listenToChannel,
    cleanupChannel,
    cleanupAllChannels,
    getConversationId
  };
};
