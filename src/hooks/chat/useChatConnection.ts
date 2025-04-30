
import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, onValue } from 'firebase/database';

/**
 * Hook to monitor and manage Firebase Realtime Database connection
 * @param enabled Whether connection monitoring should be active
 * @returns Connection state and reconnect function
 */
export const useChatConnection = (enabled: boolean = true) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastConnectionTime, setLastConnectionTime] = useState<number | null>(null);
  const connectionListenerRef = useRef<() => void | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Set up connection monitoring
  useEffect(() => {
    if (!enabled) return;
    
    try {
      const connectedRef = ref(realtimeDb, '.info/connected');
      
      const onConnection = onValue(connectedRef, (snap) => {
        const connected = snap.val() === true;
        console.log(`Firebase Realtime Database connection status: ${connected ? 'connected' : 'disconnected'}`);
        
        setIsConnected(connected);
        if (connected) {
          setLastConnectionTime(Date.now());
        }
      });
      
      connectionListenerRef.current = onConnection;
      
      // Clean up on unmount
      return () => {
        if (connectionListenerRef.current) {
          connectionListenerRef.current();
          connectionListenerRef.current = null;
        }
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };
    } catch (err) {
      console.error('Error setting up connection monitoring:', err);
      return () => {};
    }
  }, [enabled]);
  
  // Reconnect function
  const reconnect = useCallback(() => {
    console.log('Attempting to reconnect to Firebase Realtime Database');
    
    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    try {
      // Reestablish the connection listener
      if (connectionListenerRef.current) {
        connectionListenerRef.current();
      }
      
      const connectedRef = ref(realtimeDb, '.info/connected');
      
      const onConnection = onValue(connectedRef, (snap) => {
        const connected = snap.val() === true;
        console.log(`Firebase Realtime Database connection status: ${connected ? 'connected' : 'disconnected'}`);
        
        setIsConnected(connected);
        if (connected) {
          setLastConnectionTime(Date.now());
        }
      });
      
      connectionListenerRef.current = onConnection;
    } catch (err) {
      console.error('Error during reconnection:', err);
      
      // Schedule a retry
      reconnectTimeoutRef.current = setTimeout(reconnect, 5000);
    }
  }, []);
  
  return {
    isConnected,
    lastConnectionTime,
    reconnect
  };
};
