import { useEffect, useRef, useState, useCallback } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, onValue, off, goOnline } from 'firebase/database';

/**
 * Custom hook for managing a persistent connection to Firebase Realtime Database for chat
 * Handles proper connection lifecycle and prevents unnecessary reconnections
 */
export const useChatConnection = (shouldConnect: boolean = true) => {
  // Track connection status
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const isConnectedRef = useRef(false);
  const connectionRefObj = useRef<any>(null);
  const presenceRefObj = useRef<any>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoReconnectRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Clean up any existing retry timers
  const cleanupRetryTimers = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    
    if (autoReconnectRef.current) {
      clearInterval(autoReconnectRef.current);
      autoReconnectRef.current = null;
    }
  }, []);

  // Reconnect function that can be called externally
  const reconnect = useCallback(() => {
    cleanupRetryTimers();
    retryCountRef.current = 0;
    
    // Force Firebase to reconnect
    try {
      console.log("Forcing reconnection to Firebase");
      goOnline(realtimeDb);
      
      // Remove and re-add the connection listener
      if (connectionRefObj.current) {
        try {
          const connectedRef = ref(realtimeDb, '.info/connected');
          off(connectedRef, connectionRefObj.current);
        } catch (e) {
          console.warn('Error removing connection listener during reconnect:', e);
        }
      }
      
      // Setup connection monitoring again
      setupConnectionMonitoring();
    } catch (err) {
      console.error("Error during reconnection attempt:", err);
      setConnectionError("Failed to reconnect. Please try again.");
    }
  }, []);
  
  // Function to set up connection monitoring
  const setupConnectionMonitoring = useCallback(() => {
    if (!shouldConnect) return;
    
    try {
      // Set up connection monitoring
      const connectedRef = ref(realtimeDb, '.info/connected');
      
      const onConnectionChange = (snapshot: any) => {
        const connected = !!snapshot.val();
        isConnectedRef.current = connected;
        setIsConnected(connected);
        
        console.log(`Firebase connection status: ${connected ? 'Connected' : 'Disconnected'}`);
        
        if (connected) {
          setConnectionError(null);
          retryCountRef.current = 0;
          cleanupRetryTimers();
          
          // Start an auto-reconnect ping every 30 seconds to keep the connection alive
          if (!autoReconnectRef.current) {
            autoReconnectRef.current = setInterval(() => {
              if (shouldConnect && !isConnectedRef.current) {
                console.log("Auto-reconnect ping");
                goOnline(realtimeDb);
              }
            }, 30000);
          }
        } else if (shouldConnect) {
          // Only attempt retry if we should be connected
          scheduleReconnect();
        }
      };
      
      connectionRefObj.current = onConnectionChange;
      onValue(connectedRef, onConnectionChange, (error) => {
        console.error("Firebase connection monitoring error:", error);
        setConnectionError("Connection monitoring error");
        scheduleReconnect();
      });
      
      // Set up user presence for better debugging
      setupPresenceMonitoring();
      
    } catch (err) {
      console.error('Error setting up connection monitoring:', err);
      setConnectionError("Failed to setup connection monitoring");
      scheduleReconnect();
    }
  }, [shouldConnect, cleanupRetryTimers]);
  
  // Function to set up presence monitoring
  const setupPresenceMonitoring = useCallback(() => {
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
  }, []);
  
  // Schedule reconnection with exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (!shouldConnect) return;
    
    cleanupRetryTimers();
    
    // Calculate backoff time (max 30 seconds)
    const delay = Math.min(1000 * Math.pow(1.5, retryCountRef.current), 30000);
    
    console.log(`Scheduling reconnect attempt in ${delay}ms (attempt ${retryCountRef.current + 1})`);
    
    retryTimerRef.current = setTimeout(() => {
      if (shouldConnect && !isConnectedRef.current) {
        retryCountRef.current += 1;
        reconnect();
      }
    }, delay);
  }, [shouldConnect, reconnect, cleanupRetryTimers]);

  // Clean up function for listeners
  const cleanupListeners = useCallback(() => {
    // Clean up connection listener
    if (connectionRefObj.current) {
      try {
        off(ref(realtimeDb, '.info/connected'), connectionRefObj.current);
        connectionRefObj.current = null;
      } catch (e) {
        console.warn('Error cleaning up connection listener:', e);
      }
    }
    
    // Clean up presence listener
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
    
    // Clean up retry timers
    cleanupRetryTimers();
  }, [cleanupRetryTimers]);

  // Set up connection monitoring on mount
  useEffect(() => {
    if (shouldConnect) {
      setupConnectionMonitoring();
    }
    
    return () => {
      cleanupListeners();
    };
  }, [shouldConnect, setupConnectionMonitoring, cleanupListeners]);

  return {
    isConnected: isConnectedRef.current,
    error: connectionError,
    reconnect
  };
};
