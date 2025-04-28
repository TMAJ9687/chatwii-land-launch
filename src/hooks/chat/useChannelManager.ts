
import { useRef, useCallback, useEffect } from 'react';
import { ref, onValue, off, DatabaseReference } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/client';

// Type for channel registry
interface ChannelRegistry {
  [key: string]: DatabaseReference;
}

/**
 * Hook for centralized management of Firebase realtime database channels
 * Handles proper registration and cleanup of all listeners
 */
export const useChannelManager = () => {
  // Reference to all active channels
  const channelsRef = useRef<ChannelRegistry>({});
  // Track component mounted state to prevent updates after unmount
  const isMountedRef = useRef(true);
  
  // Generate a consistent conversation ID regardless of user order
  const getConversationId = (user1Id: string, user2Id: string): string => {
    return [user1Id, user2Id].sort().join('_');
  };
  
  // Listen to a specific path with proper cleanup handling
  const listenToChannel = useCallback((channelName: string, path: string, callback: (data: any) => void) => {
    if (!isMountedRef.current) return () => {};
    
    // Clean up existing channel if it exists
    cleanupChannel(channelName);
    
    try {
      const channelRef = ref(realtimeDb, path);
      channelsRef.current[channelName] = channelRef;
      
      // Set up listener
      onValue(channelRef, (snapshot) => {
        if (isMountedRef.current) {
          const data = snapshot.val();
          callback(data);
        }
      });
      
      // Return cleanup function
      return () => cleanupChannel(channelName);
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
  
  // Clean up all channels
  const cleanupAllChannels = useCallback(() => {
    Object.keys(channelsRef.current).forEach(cleanupChannel);
  }, [cleanupChannel]);
  
  // Clean up all channels on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      cleanupAllChannels();
    };
  }, [cleanupAllChannels]);
  
  return {
    listenToChannel,
    cleanupChannel,
    cleanupAllChannels,
    getConversationId
  };
};
