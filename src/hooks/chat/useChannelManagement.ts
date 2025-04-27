
import { useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export const useChannelManagement = () => {
  const channelsRef = useRef<Record<string, any>>({});
  
  const cleanupChannels = useCallback(() => {
    Object.entries(channelsRef.current).forEach(([name, channel]) => {
      if (channel) {
        console.log(`Cleaning up channel: ${name}`);
        supabase.removeChannel(channel);
        delete channelsRef.current[name];
      }
    });
  }, []);

  const removeChannel = useCallback((channelName: string) => {
    if (channelsRef.current[channelName]) {
      supabase.removeChannel(channelsRef.current[channelName]);
      delete channelsRef.current[channelName];
    }
  }, []);

  const registerChannel = useCallback((channelName: string, channel: any) => {
    // Clean up existing channel if it exists
    if (channelsRef.current[channelName]) {
      supabase.removeChannel(channelsRef.current[channelName]);
    }
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
