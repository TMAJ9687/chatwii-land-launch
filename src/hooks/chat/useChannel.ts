
import { useRef, useCallback, useEffect, useState } from 'react';
import { firebaseListeners } from '@/services/FirebaseListenerService';
import { toast } from 'sonner';
import { useConnection } from '@/contexts/ConnectionContext';

type ChannelStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

interface UseChannelOptions {
  /** Whether to show toast notifications for errors */
  showToasts?: boolean;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Base delay for retry (will be multiplied by 2^retry) */
  baseRetryDelay?: number;
}

const DEFAULT_OPTIONS: UseChannelOptions = {
  showToasts: true,
  maxRetries: 3,
  baseRetryDelay: 1000
};

/**
 * Hook for subscribing to a Firebase Realtime Database path
 * with proper error handling and reconnection logic
 */
export function useChannel<T = any>(
  channelName: string, 
  path: string | null, 
  enabled: boolean = true,
  processData?: (data: any) => T,
  options?: UseChannelOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<ChannelStatus>('connecting');
  const [error, setError] = useState<Error | null>(null);
  const { isConnected } = useConnection();
  
  // Merge provided options with defaults
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  const lastPathRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const channelKey = `${channelName}-${path || 'none'}`;
  
  const setupChannel = useCallback(() => {
    if (!path || !enabled) {
      setStatus('disconnected');
      return () => {};
    }
    
    // Don't resubscribe to the same path needlessly
    if (path === lastPathRef.current && status !== 'error') {
      return () => {};
    }
    
    lastPathRef.current = path;
    
    try {
      setStatus('connecting');
      
      // Create the listener with our service
      const unsubscribe = firebaseListeners.subscribe(
        channelKey,
        path,
        (rawData) => {
          if (!isMountedRef.current) return;
          
          try {
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
            
            if (mergedOptions.showToasts) {
              toast.error(`Error processing data for ${channelName}`);
            }
          }
        },
        (err) => {
          console.error(`Error listening to ${path}:`, err);
          setStatus('error');
          setError(err);
          
          // Check if error has a code property before accessing it
          const errorCode = err && typeof err === 'object' && 'code' in err ? err.code : '';
          
          if (errorCode === 'PERMISSION_DENIED' && mergedOptions.showToasts) {
            toast.error("Permission denied for chat database path");
          }
          
          // Schedule retry if appropriate
          if (retryCountRef.current < (mergedOptions.maxRetries || 3)) {
            retryCountRef.current++;
            const delay = Math.min(
              (mergedOptions.baseRetryDelay || 1000) * Math.pow(2, retryCountRef.current - 1), 
              10000
            );
            
            if (retryTimerRef.current) {
              clearTimeout(retryTimerRef.current);
            }
            
            retryTimerRef.current = setTimeout(() => {
              if (isMountedRef.current) {
                console.log(`Retrying channel ${channelName} (attempt ${retryCountRef.current})`);
                firebaseListeners.unsubscribe(channelKey);
                setupChannel();
              }
            }, delay);
          }
        }
      );
      
      // Return cleanup function
      return () => {
        unsubscribe();
      };
    } catch (err) {
      console.error(`Error setting up channel ${channelName}:`, err);
      setStatus('error');
      setError(err instanceof Error ? err : new Error('Failed to setup channel'));
      return () => {};
    }
  }, [channelName, path, enabled, processData, channelKey, status, mergedOptions]);
  
  // Handle connection changes
  useEffect(() => {
    if (!isConnected && status === 'connected') {
      setStatus('disconnected');
    } else if (isConnected && status === 'disconnected' && enabled && path) {
      // If we were disconnected but now connected, try to reconnect
      firebaseListeners.unsubscribe(channelKey);
      setupChannel();
    }
  }, [isConnected, status, enabled, path, channelKey, setupChannel]);
  
  // Setup/teardown effect
  useEffect(() => {
    const cleanup = setupChannel();
    
    return () => {
      isMountedRef.current = false;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
      cleanup();
      firebaseListeners.unsubscribe(channelKey);
    };
  }, [setupChannel, channelKey]);
  
  // Force reconnect function
  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    firebaseListeners.unsubscribe(channelKey);
    setupChannel();
  }, [channelKey, setupChannel]);
  
  return {
    data,
    status,
    error,
    reconnect
  };
}
