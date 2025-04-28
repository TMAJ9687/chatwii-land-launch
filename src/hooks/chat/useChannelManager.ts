
import { useRef, useCallback, useEffect } from 'react';
import { ref, onValue, off, DatabaseReference } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/client';
import { debounce } from 'lodash';

// Type for channel registry
interface ChannelRegistry {
  [key: string]: {
    reference: DatabaseReference;
    lastAccessed: number;
    isActive: boolean;
  };
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
  // Track debug mode
  const debugMode = useRef(false);
  
  // Logging utility
  const log = useCallback((message: string, ...args: any[]) => {
    if (debugMode.current) {
      console.log(`[ChannelManager] ${message}`, ...args);
    }
  }, []);
  
  // Generate a consistent conversation ID regardless of user order
  const getConversationId = (user1Id: string, user2Id: string): string => {
    return [user1Id, user2Id].sort().join('_');
  };
  
  // Listen to a specific path with proper cleanup handling
  const listenToChannel = useCallback((channelName: string, path: string, callback: (data: any) => void) => {
    if (!isMountedRef.current) {
      log(`Component unmounted, skipping channel setup: ${channelName}`);
      return () => {};
    }
    
    // Check if channel already exists and is active
    if (channelsRef.current[channelName]?.isActive) {
      log(`Channel ${channelName} already active, updating timestamp`);
      channelsRef.current[channelName].lastAccessed = Date.now();
      return () => cleanupChannel(channelName);
    }
    
    // Clean up existing channel if it exists but isn't active
    if (channelsRef.current[channelName]) {
      log(`Channel ${channelName} exists but inactive, cleaning up first`);
      cleanupChannel(channelName);
    }
    
    try {
      log(`Setting up new channel: ${channelName} for path: ${path}`);
      const channelRef = ref(realtimeDb, path);
      
      channelsRef.current[channelName] = {
        reference: channelRef,
        lastAccessed: Date.now(),
        isActive: true
      };
      
      // Set up listener with error handling
      let errorRetryCount = 0;
      const maxRetries = 3;
      
      const setupListener = () => {
        try {
          onValue(channelRef, (snapshot) => {
            if (!isMountedRef.current) {
              log(`Component unmounted during callback, cleaning up: ${channelName}`);
              cleanupChannel(channelName);
              return;
            }
            
            if (!channelsRef.current[channelName]?.isActive) {
              log(`Channel ${channelName} no longer active, ignoring update`);
              return;
            }
            
            channelsRef.current[channelName].lastAccessed = Date.now();
            const data = snapshot.val();
            callback(data);
          }, (error) => {
            log(`Error in channel ${channelName}:`, error);
            
            // Retry logic for temporary errors
            if (errorRetryCount < maxRetries) {
              errorRetryCount++;
              log(`Retrying channel ${channelName} (${errorRetryCount}/${maxRetries})`);
              
              // Clean up failed listener
              if (channelsRef.current[channelName]) {
                try {
                  off(channelsRef.current[channelName].reference);
                } catch (e) {
                  // Ignore cleanup errors
                }
              }
              
              // Try again after delay
              setTimeout(setupListener, 1000);
            } else {
              // Too many errors, give up
              log(`Too many errors for channel ${channelName}, giving up`);
              cleanupChannel(channelName);
            }
          });
        } catch (error) {
          log(`Error setting up listener for ${channelName}:`, error);
          // Mark as inactive on setup error
          if (channelsRef.current[channelName]) {
            channelsRef.current[channelName].isActive = false;
          }
        }
      };
      
      setupListener();
      
      // Return cleanup function
      return () => cleanupChannel(channelName);
    } catch (error) {
      log(`Error setting up channel ${channelName}:`, error);
      return () => {};
    }
  }, [log]);
  
  // Clean up a specific channel
  const cleanupChannel = useCallback((channelName: string) => {
    if (channelsRef.current[channelName]) {
      try {
        log(`Cleaning up channel: ${channelName}`);
        off(channelsRef.current[channelName].reference);
        channelsRef.current[channelName].isActive = false;
      } catch (error) {
        log(`Error cleaning up channel ${channelName}:`, error);
      }
    }
  }, [log]);
  
  // Clean up all channels with force option
  const cleanupAllChannels = useCallback((force: boolean = false) => {
    log(`Cleaning up all channels (${Object.keys(channelsRef.current).length} total)`);
    
    Object.keys(channelsRef.current).forEach(channelName => {
      try {
        log(`Cleaning up channel: ${channelName}`);
        off(channelsRef.current[channelName].reference);
        channelsRef.current[channelName].isActive = false;
        
        // Only fully remove if force is true
        if (force) {
          delete channelsRef.current[channelName];
        }
      } catch (error) {
        log(`Error cleaning up channel ${channelName}:`, error);
      }
    });
    
    // If force cleanup, clear the entire registry
    if (force) {
      channelsRef.current = {};
    }
  }, [log]);
  
  // Activate/deactivate debug mode
  const setDebugMode = useCallback((enable: boolean) => {
    debugMode.current = enable;
    log(`Debug mode ${enable ? 'enabled' : 'disabled'}`);
  }, [log]);
  
  // Clean up all channels on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    // Cleanup old inactive channels every 5 minutes
    const cleanupInterval = setInterval(() => {
      if (!isMountedRef.current) return;
      
      const now = Date.now();
      const oldChannels = Object.keys(channelsRef.current).filter(
        name => !channelsRef.current[name].isActive && 
        (now - channelsRef.current[name].lastAccessed) > 5 * 60 * 1000
      );
      
      if (oldChannels.length > 0) {
        log(`Removing ${oldChannels.length} old inactive channels`);
        oldChannels.forEach(name => {
          delete channelsRef.current[name];
        });
      }
    }, 5 * 60 * 1000);
    
    return () => {
      isMountedRef.current = false;
      clearInterval(cleanupInterval);
      cleanupAllChannels(true); // Force cleanup on unmount
    };
  }, [cleanupAllChannels, log]);
  
  return {
    listenToChannel,
    cleanupChannel,
    cleanupAllChannels,
    getConversationId,
    setDebugMode
  };
};
