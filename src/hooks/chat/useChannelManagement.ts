
import { useCallback, useRef } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/client';

/**
 * Hook for channel management operations with Firebase Realtime Database
 */
export const useChannelManagement = () => {
  // Active channels tracking
  const channelsRef = useRef<Record<string, { ref: any, unsubscribe: () => void }>>({});
  
  /**
   * Register a channel and return cleanup function
   */
  const registerChannel = useCallback((channelName: string, dbRef: any) => {
    // Clean up existing registration if exists
    if (channelsRef.current[channelName]) {
      channelsRef.current[channelName].unsubscribe();
    }
    
    // Create new registration
    channelsRef.current[channelName] = {
      ref: dbRef,
      unsubscribe: () => {
        try {
          off(dbRef);
        } catch (e) {
          console.warn(`Error unsubscribing from ${channelName}:`, e);
        }
      }
    };
    
    return () => {
      if (channelsRef.current[channelName]) {
        channelsRef.current[channelName].unsubscribe();
        delete channelsRef.current[channelName];
      }
    };
  }, []);
  
  /**
   * Unregister a specific channel
   */
  const unregisterChannel = useCallback((channelName: string) => {
    if (channelsRef.current[channelName]) {
      channelsRef.current[channelName].unsubscribe();
      delete channelsRef.current[channelName];
    }
  }, []);
  
  /**
   * Clean up all registered channels
   */
  const cleanupAllChannels = useCallback(() => {
    Object.keys(channelsRef.current).forEach(channelName => {
      try {
        channelsRef.current[channelName].unsubscribe();
      } catch (e) {
        console.warn(`Error cleaning up channel ${channelName}:`, e);
      }
    });
    channelsRef.current = {};
  }, []);
  
  return {
    registerChannel,
    unregisterChannel,
    cleanupAllChannels,
    getActiveChannels: () => Object.keys(channelsRef.current)
  };
};
