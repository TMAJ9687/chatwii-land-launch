
import { useState, useCallback, useEffect } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, onValue, off, DatabaseReference } from 'firebase/database';
import { toast } from 'sonner';
import { useConnection } from '@/contexts/ConnectionContext';

type ChannelCallback<T> = (data: T | null) => void;

/**
 * Hook for managing a single Firebase Realtime Database channel subscription
 */
export function useChannel<T>(
  path: string | null,
  enabled: boolean = true,
  onError?: (error: Error) => void
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { isConnected } = useConnection();

  // Subscribe to the channel
  useEffect(() => {
    if (!path || !enabled) {
      return;
    }

    setIsLoading(true);
    let dbRef: DatabaseReference;
    
    try {
      dbRef = ref(realtimeDb, path);
      
      const handleData = (snapshot: any) => {
        setData(snapshot.val());
        setIsLoading(false);
        setError(null);
      };
      
      const handleError = (err: Error) => {
        console.error(`Channel error (${path}):`, err);
        setError(err);
        setIsLoading(false);
        if (onError) onError(err);
      };
      
      onValue(dbRef, handleData, handleError);
      
      return () => {
        off(dbRef);
      };
    } catch (err: any) {
      console.error(`Failed to setup channel (${path}):`, err);
      setError(err);
      setIsLoading(false);
      if (onError) onError(err);
      return () => {};
    }
  }, [path, enabled, onError]);

  // Function to manually refresh the channel
  const refresh = useCallback(() => {
    setIsLoading(true);
    // The channel will refresh automatically due to the useEffect dependency
  }, []);

  return { data, isLoading, error, refresh };
}
