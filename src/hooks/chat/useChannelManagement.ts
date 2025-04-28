
import { useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
            supabase.removeChannel(channel);
          } catch (e) {
            console.error(`Error removing channel ${name}:`, e);
          }
        }
      });
      channelsRef.current = {};
    };
  }, []);
  
  const cleanupChannels = useCallback(() => {
    if (!isMountedRef.current) return;
    
    Object.entries(channelsRef.current).forEach(([name, channel]) => {
      if (channel) {
        console.log(`Cleaning up channel: ${name}`);
        try {
          supabase.removeChannel(channel);
        } catch (e) {
          console.error(`Error removing channel ${name}:`, e);
        }
        delete channelsRef.current[name];
      }
    });
  }, []);

  const removeChannel = useCallback((channelName: string) => {
    if (!isMountedRef.current) return;
    
    if (channelsRef.current[channelName]) {
      console.log(`Removing specific channel: ${channelName}`);
      try {
        supabase.removeChannel(channelsRef.current[channelName]);
      } catch (e) {
        console.error(`Error removing channel ${channelName}:`, e);
      }
      delete channelsRef.current[channelName];
    }
  }, []);

  const registerChannel = useCallback((channelName: string, channel: any) => {
    if (!isMountedRef.current) return channel;
    
    // Clean up existing channel if it exists
    if (channelsRef.current[channelName]) {
      console.log(`Replacing existing channel: ${channelName}`);
      try {
        supabase.removeChannel(channelsRef.current[channelName]);
      } catch (e) {
        console.error(`Error removing existing channel ${channelName}:`, e);
      }
    }
    
    console.log(`Registering new channel: ${channelName}`);
    channelsRef.current[channelName] = channel;
    return channel;
  }, []);

  return {
    channelsRef,
    cleanupChannels,
    removeChannel,
    registerChannel
  };
};
