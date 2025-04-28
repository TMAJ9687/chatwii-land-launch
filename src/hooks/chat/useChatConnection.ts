
import { useEffect, useRef } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, onValue, off } from 'firebase/database';

/**
 * Custom hook for managing a persistent connection to Firebase Realtime Database for chat
 * Handles proper connection lifecycle and prevents unnecessary reconnections
 */
export const useChatConnection = (shouldConnect: boolean = true) => {
  // Track connection status
  const isConnectedRef = useRef(false);
  const connectionRefObj = useRef<any>(null);
  const presenceRefObj = useRef<any>(null);

  // Set up connection monitoring
  useEffect(() => {
    if (!shouldConnect) return;

    // Set up connection monitoring
    const connectedRef = ref(realtimeDb, '.info/connected');
    
    const onConnectionChange = (snapshot: any) => {
      isConnectedRef.current = !!snapshot.val();
      console.log(`Firebase connection status: ${isConnectedRef.current ? 'Connected' : 'Disconnected'}`);
    };
    
    connectionRefObj.current = onConnectionChange;
    onValue(connectedRef, onConnectionChange);
    
    // Set up user presence for better debugging
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        const presencePath = `presence/${userId}/status`;
        const presenceRef = ref(realtimeDb, presencePath);
        
        const updatePresence = (snapshot: any) => {
          if (snapshot.val() === true) {
            console.log('User presence system active');
          }
        };
        
        presenceRefObj.current = updatePresence;
        onValue(presenceRef, updatePresence);
      }
    } catch (err) {
      console.warn('Error setting up presence monitoring:', err);
    }
    
    return () => {
      // Clean up listeners
      if (connectionRefObj.current) {
        try {
          off(ref(realtimeDb, '.info/connected'), connectionRefObj.current);
          connectionRefObj.current = null;
        } catch (e) {
          console.warn('Error cleaning up connection listener:', e);
        }
      }
      
      if (presenceRefObj.current) {
        try {
          const userId = localStorage.getItem('userId');
          if (userId) {
            off(ref(realtimeDb, `presence/${userId}/status`), presenceRefObj.current);
            presenceRefObj.current = null;
          }
        } catch (e) {
          console.warn('Error cleaning up presence listener:', e);
        }
      }
    };
  }, [shouldConnect]);

  return {
    isConnected: isConnectedRef.current,
  };
};
