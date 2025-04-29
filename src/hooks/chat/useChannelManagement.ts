
import { useRef, useCallback, useEffect } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, onValue, off } from 'firebase/database';

export const useChannelManagement = () => {
  const channelsRef = useRef<Record<string, any>>({});
  const isMountedRef = useRef(true);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Clean up all channels when component unmounts
      Object.entries(channelsRef.current).forEach(([name, channel]) => {
        if (channel) {
          console.log(`Auto cleaning up channel on unmount: ${name}`);
          try {
            off(channel);
          } catch (e) {
            console.error(`Error removing channel ${name}:`, e);
          }
        }
      });
      channelsRef.current = {};
    };
  }, []);

  // Setup a channel with auto-cleanup
  const setupChannel = useCallback((channelName: string, path: string, onData: (data: any) => void) => {
    if (!isMountedRef.current) return () => {};
    
    // Clean up existing channel if it exists
    if (channelsRef.current[channelName]) {
      try {
        off(channelsRef.current[channelName]);
      } catch (e) {
        console.error(`Error removing existing channel ${channelName}:`, e);
      }
    }
    
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
        if (channelsRef.current[channelName]) {
          try {
            off(channelsRef.current[channelName]);
            delete channelsRef.current[channelName];
          } catch (e) {
            console.error(`Error removing channel ${channelName}:`, e);
          }
        }
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
  
  return {
    setupChannel,
    cleanupChannel
  };
};
