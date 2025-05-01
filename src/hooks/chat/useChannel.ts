
import { useRef, useCallback, useEffect, useState } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/client';
import { toast } from 'sonner';
import { useConnection } from '@/contexts/ConnectionContext';

type ChannelStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

/**
 * Hook for subscribing to a Firebase Realtime Database path
 * with proper error handling and reconnection logic
 */
export function useChannel<T = any>(
  channelName: string, 
  path: string | null, 
  enabled: boolean = true,
  processData?: (data: any) => T
) {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<ChannelStatus>('connecting');
  const [error, setError] = useState<Error | null>(null);
  const { isConnected } = useConnection();
  
  const channelRef = useRef<any>(null);
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 3;
  
  const setupChannel = useCallback(() => {
    if (!path || !enabled) {
      setStatus('disconnected');
      return () => {};
    }
    
    try {
      setStatus('connecting');
      
      // Create database reference
      const dbRef = ref(realtimeDb, path);
      
      // Setup the listener
      const listener = onValue(
        dbRef,
        (snapshot) => {
          if (!isMountedRef.current) return;
          
          try {
            const rawData = snapshot.val();
            
            // Process data if processor function is provided
            const processedData = processData ? processData(rawData) : rawData;
            
            setData(processedData);
            setStatus('connected');
            setError(null);
            retryCountRef.current = 0;
          } catch (err) {
            console.error(`Error processing data for channel ${channelName}:`, err);
            setStatus('error');
            setError(err instanceof Error ? err : new Error('Unknown error processing data'));
          }
        },
        (err) => {
          console.error(`Error listening to ${path}:`, err);
          setStatus('error');
          setError(err);
          
          // Check if error has a code property before accessing it
          // Firebase error objects typically have a code property
          const errorCode = err && typeof err === 'object' && 'code' in err ? err.code : '';
          
          if (errorCode === 'PERMISSION_DENIED') {
            toast.error("Permission denied for chat database path");
          }
          
          // Schedule retry if appropriate
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current++;
            const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 10000);
            
            if (retryTimerRef.current) {
              clearTimeout(retryTimerRef.current);
            }
            
            retryTimerRef.current = setTimeout(() => {
              if (isMountedRef.current) {
                cleanupChannel();
                setupChannel();
              }
            }, delay);
          }
        }
      );
      
      // Store the reference for cleanup
      channelRef.current = {
        path,
        ref: dbRef,
        listener
      };
      
      // Return cleanup function
      return () => {
        cleanupChannel();
      };
    } catch (err) {
      console.error(`Error setting up channel ${channelName}:`, err);
      setStatus('error');
      setError(err instanceof Error ? err : new Error('Failed to setup channel'));
      return () => {};
    }
  }, [channelName, path, enabled, processData]);
  
  const cleanupChannel = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    
    if (channelRef.current) {
      try {
        off(channelRef.current.ref);
      } catch (err) {
        console.warn(`Error cleaning up channel ${channelName}:`, err);
      }
      channelRef.current = null;
    }
  }, [channelName]);
  
  // Handle connection changes
  useEffect(() => {
    if (!isConnected && status === 'connected') {
      setStatus('disconnected');
    } else if (isConnected && status === 'disconnected' && enabled && path) {
      // If we were disconnected but now connected, try to reconnect
      cleanupChannel();
      setupChannel();
    }
  }, [isConnected, status, enabled, path, cleanupChannel, setupChannel]);
  
  // Setup/teardown effect
  useEffect(() => {
    const cleanup = setupChannel();
    
    return () => {
      isMountedRef.current = false;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
      cleanup();
    };
  }, [setupChannel]);
  
  // Force reconnect function
  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    cleanupChannel();
    setupChannel();
  }, [cleanupChannel, setupChannel]);
  
  return {
    data,
    status,
    error,
    reconnect
  };
}
