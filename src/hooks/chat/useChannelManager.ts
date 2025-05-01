import { useCallback, useRef } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/client';

/**
 * Hook for managing Firebase Realtime Database channel subscriptions
 */
export const useChannelManager = () => {
  // Keep track of active listeners
  const listenersRef = useRef<Record<string, { path: string, cleanup: () => void }>>({});
  
  /**
   * Start listening to a specific channel
   */
  const listenToChannel = useCallback((channelName: string, path: string, callback: (data: any) => void) => {
    // Clean up any existing listener for this channel
    if (listenersRef.current[channelName]) {
      listenersRef.current[channelName].cleanup();
    }
    
    console.log(`Setting up channel listener for ${channelName} at path ${path}`);
    
    // Set up new listener
    const dbRef = ref(realtimeDb, path);
    
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      callback(data);
    }, (error) => {
      console.error(`Error listening to channel ${channelName}:`, error);
      callback(null);
    });
    
    // Store the listener
    listenersRef.current[channelName] = {
      path,
      cleanup: () => {
        console.log(`Cleaning up channel listener for ${channelName}`);
        off(dbRef);
      }
    };
    
    // Return cleanup function
    return () => {
      if (listenersRef.current[channelName]) {
        listenersRef.current[channelName].cleanup();
        delete listenersRef.current[channelName];
      }
    };
  }, []);
  
  /**
   * Clean up a specific channel listener
   */
  const cleanupChannel = useCallback((channelName: string) => {
    if (listenersRef.current[channelName]) {
      listenersRef.current[channelName].cleanup();
      delete listenersRef.current[channelName];
      return true;
    }
    return false;
  }, []);
  
  /**
   * Clean up all channel listeners
   */
  const cleanupAllChannels = useCallback(() => {
    Object.keys(listenersRef.current).forEach(channelName => {
      listenersRef.current[channelName].cleanup();
    });
    listenersRef.current = {};
  }, []);
  
  return {
    listenToChannel,
    cleanupChannel,
    cleanupAllChannels
  };
};
