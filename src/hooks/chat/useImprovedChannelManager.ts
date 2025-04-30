
import { useRef, useCallback, useEffect } from 'react';
import { ref, onValue, off, get } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/client';
import { toast } from 'sonner';

/**
 * Improved hook for centralized management of Firebase realtime database channels
 * with better error handling and debugging capabilities
 */
export const useImprovedChannelManager = (debug = false) => {
  const channelsRef = useRef<Record<string, any>>({});
  const isMountedRef = useRef(true);
  
  // Debug logging utility
  const log = useCallback((message: string, ...args: any[]) => {
    if (debug) {
      console.log(`[ChannelManager] ${message}`, ...args);
    }
  }, [debug]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      // Clean up all channels when component unmounts
      Object.entries(channelsRef.current).forEach(([path, _]) => {
        try {
          log(`Cleaning up channel on unmount: ${path}`);
          off(ref(realtimeDb, path));
        } catch (e) {
          console.error(`Error cleaning up channel ${path}:`, e);
        }
      });
      
      channelsRef.current = {};
    };
  }, [log]);
  
  // Test if a path is accessible before listening to avoid permission errors
  const testPath = useCallback(async (path: string): Promise<boolean> => {
    try {
      log(`Testing access to path: ${path}`);
      const dataRef = ref(realtimeDb, path);
      await get(dataRef);
      log(`Path ${path} is accessible`);
      return true;
    } catch (error) {
      console.error(`Path ${path} is not accessible:`, error);
      return false;
    }
  }, [log]);
  
  // Listen to a specific path with error handling
  const listenToPath = useCallback((
    path: string, 
    callback: (data: any) => void,
    onError?: (error: Error) => void
  ) => {
    if (!isMountedRef.current) return () => {};
    
    log(`Setting up listener for path: ${path}`);
    
    const dataRef = ref(realtimeDb, path);
    
    try {
      // Register the channel before setting up the listener
      channelsRef.current[path] = true;
      
      const unsubscribe = onValue(dataRef, 
        (snapshot) => {
          if (!isMountedRef.current) return;
          
          const data = snapshot.val();
          log(`Received data from ${path}: ${data ? 'has data' : 'empty'}`);
          callback(data);
        }, 
        (error) => {
          log(`Error listening to ${path}:`, error);
          
          if (onError) {
            onError(error);
          } else {
            // Default error handler
            console.error(`Firebase channel error (${path}):`, error);
            toast.error(`Connection error: ${error.message}`);
          }
          
          // Call callback with null to handle the error state in the component
          if (isMountedRef.current) {
            callback(null);
          }
          
          // Clean up to prevent further errors
          if (channelsRef.current[path]) {
            delete channelsRef.current[path];
          }
        }
      );
      
      // Return a cleanup function
      return () => {
        log(`Removing listener for path: ${path}`);
        
        try {
          unsubscribe();
        } catch (e) {
          console.error(`Error removing listener for ${path}:`, e);
        }
        
        if (channelsRef.current[path]) {
          delete channelsRef.current[path];
        }
      };
    } catch (error) {
      console.error(`Failed to set up listener for ${path}:`, error);
      
      // Clean up if we failed to set up
      if (channelsRef.current[path]) {
        delete channelsRef.current[path];
      }
      
      // Return a no-op cleanup function
      return () => {};
    }
  }, [log]);
  
  return {
    listenToPath,
    testPath,
    activeChannelCount: Object.keys(channelsRef.current).length
  };
};
