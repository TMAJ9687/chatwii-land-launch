
import { useEffect, useRef } from 'react';
import { firebaseListener } from '@/services/FirebaseListenerService';

/**
 * A hook to easily use the FirebaseListenerService in components
 */
export const useFirebaseListener = (
  path: string | null,
  callback: (data: any) => void,
  onError?: (error: Error) => void,
  enabled: boolean = true,
  owner: string = 'unknown'
) => {
  const listenerIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Clean up on unmount
    return () => {
      if (listenerIdRef.current) {
        firebaseListener.removeListener(listenerIdRef.current);
        listenerIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Clean up previous listener if path changes
    if (listenerIdRef.current) {
      firebaseListener.removeListener(listenerIdRef.current);
      listenerIdRef.current = null;
    }

    // Only set up a new listener if enabled and path exists
    if (enabled && path) {
      listenerIdRef.current = firebaseListener.addListener(
        path,
        callback,
        onError,
        owner
      );
    }

    // Clean up on unmount or when dependencies change
    return () => {
      if (listenerIdRef.current) {
        firebaseListener.removeListener(listenerIdRef.current);
        listenerIdRef.current = null;
      }
    };
  }, [path, enabled, owner]);

  return {
    isListening: !!listenerIdRef.current,
    stopListening: () => {
      if (listenerIdRef.current) {
        firebaseListener.removeListener(listenerIdRef.current);
        listenerIdRef.current = null;
      }
    },
    startListening: () => {
      if (!listenerIdRef.current && path) {
        listenerIdRef.current = firebaseListener.addListener(
          path,
          callback,
          onError,
          owner
        );
      }
    }
  };
};
