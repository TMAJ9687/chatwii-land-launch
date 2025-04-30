
import { useRef, useCallback } from 'react';
import { ref, onValue, off, DatabaseReference } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/client';
import { getConversationId } from '@/utils/channelUtils';
import { syncService } from '@/services/syncService';

// Type for channel registry
interface ChannelRegistry {
  [key: string]: {
    reference: DatabaseReference;
    lastAccessed: number;
    isActive: boolean;
    callback: (data: any) => void;
    setupCount: number; // Track number of setup attempts
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
  
  // Cleanup on unmount
  useCallback(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Logging utility
  const log = useCallback((message: string, ...args: any[]) => {
    if (debugMode.current) {
      console.log(`[ChannelManager] ${message}`, ...args);
    }
  }, []);
  
  // Generate a consistent conversation ID regardless of user order
  const getConversationIdInternal = useCallback((user1Id: string, user2Id: string): string => {
    return getConversationId(user1Id, user2Id);
  }, []);
  
  // Listen to a specific path with proper cleanup handling
  const listenToChannel = useCallback((channelName: string, path: string, callback: (data: any) => void) => {
    if (!isMountedRef.current) {
      log(`Component unmounted, skipping channel setup: ${channelName}`);
      return () => {};
    }
    
    // Check if channel already exists and is active
    if (channelsRef.current[channelName]?.isActive) {
      log(`Channel ${channelName} already active, updating timestamp and callback`);
      channelsRef.current[channelName].lastAccessed = Date.now();
      channelsRef.current[channelName].callback = callback;
      return () => cleanupChannel(channelName);
    }
    
    log(`Setting up channel: ${channelName} at path: ${path}`);
    
    try {
      // Create a reference to the database location
      const dbRef = ref(realtimeDb, path);
      
      // Setup the listener
      onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        if (isMountedRef.current && channelsRef.current[channelName]) {
          log(`Received data on channel ${channelName}`);
          callback(data);
        }
      }, (error) => {
        console.error(`Error on channel ${channelName}:`, error);
      });
      
      // Register the channel
      channelsRef.current[channelName] = {
        reference: dbRef,
        lastAccessed: Date.now(),
        isActive: true,
        callback,
        setupCount: (channelsRef.current[channelName]?.setupCount || 0) + 1
      };
      
      // Extract conversation ID from channel name (if possible)
      const match = channelName.match(/_([^_]+)$/);
      if (match && match[1] && match[1].includes('_')) {
        const possibleConversationId = match[1];
        // Try to sync this conversation data
        if (possibleConversationId.includes('_')) {
          syncService.queueSync(possibleConversationId.split('_')[0], possibleConversationId.split('_')[1])
            .catch(err => console.error('Error queuing sync for conversation:', err));
        }
      }
      
      // Return cleanup function
      return () => cleanupChannel(channelName);
    } catch (error) {
      console.error(`Error setting up channel ${channelName}:`, error);
      return () => {};
    }
  }, [log]);
  
  // Clean up a specific channel
  const cleanupChannel = useCallback((channelName: string, force: boolean = false) => {
    const channel = channelsRef.current[channelName];
    if (!channel) {
      return;
    }
    
    // If not forced, check if it was recently accessed
    if (!force && Date.now() - channel.lastAccessed < 1000) {
      log(`Skipping cleanup for recently accessed channel: ${channelName}`);
      return;
    }
    
    log(`Cleaning up channel: ${channelName}`);
    
    try {
      // Remove the listener
      off(channel.reference);
      
      // Mark as inactive
      channel.isActive = false;
      
      // Remove from registry after a delay to prevent rapid setup/teardown cycles
      setTimeout(() => {
        if (!channelsRef.current[channelName]?.isActive) {
          delete channelsRef.current[channelName];
        }
      }, 5000);
    } catch (error) {
      console.error(`Error cleaning up channel ${channelName}:`, error);
    }
  }, [log]);
  
  // Clean up all channels
  const cleanupAllChannels = useCallback((force: boolean = false) => {
    log(`Cleaning up all channels, forced: ${force}`);
    
    Object.keys(channelsRef.current).forEach(channelName => {
      cleanupChannel(channelName, force);
    });
  }, [cleanupChannel, log]);
  
  return {
    listenToChannel,
    cleanupChannel,
    cleanupAllChannels,
    getConversationId: getConversationIdInternal,
  };
};
