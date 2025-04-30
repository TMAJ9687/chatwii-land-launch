
import { useEffect, useRef, useState, useCallback } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, onValue, off, goOnline } from 'firebase/database';
import { toast } from 'sonner';

/**
 * Custom hook for managing a persistent connection to Firebase Realtime Database for chat
 * Enhanced with better state synchronization and auto-recovery
 */
export const useChatConnection = (shouldConnect: boolean = true) => {
  // Track connection status
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const isConnectedRef = useRef(false);
  const connectionRefObj = useRef<any>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoReconnectRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectionAttemptTimeRef = useRef<number>(0);
  const lastToastTimeRef = useRef<number>(0);
  
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

  // Throttled toast function to prevent spam
  const showConnectionToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const now = Date.now();
    // Only show a toast every 10 seconds at most
    if (now - lastToastTimeRef.current > 10000) {
      lastToastTimeRef.current = now;
      if (type === 'success') {
        toast.success(message);
      } else if (type === 'error') {
        toast.error(message);
      } else {
        toast.info(message);
      }
    }
  }, []);

  // Reconnect function that can be called externally
  const reconnect = useCallback(() => {
    // Prevent multiple reconnection attempts within 2 seconds
    const now = Date.now();
    if (now - connectionAttemptTimeRef.current < 2000) {
      console.log("Reconnect throttled - too soon since last attempt");
      return;
    }
    
    connectionAttemptTimeRef.current = now;
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
      
      showConnectionToast("Reconnecting to chat service...");
      
      // Setup connection monitoring again
      setupConnectionMonitoring();
    } catch (err) {
      console.error("Error during reconnection attempt:", err);
      setConnectionError("Failed to reconnect. Please try again.");
      showConnectionToast("Failed to reconnect. Please try again.", "error");
    }
  }, [cleanupRetryTimers, showConnectionToast]);
  
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
          
          // Auto-reconnect ping at longer interval when already connected
          if (!autoReconnectRef.current) {
            autoReconnectRef.current = setInterval(() => {
              if (shouldConnect && !isConnectedRef.current) {
                console.log("Auto-reconnect ping");
                goOnline(realtimeDb);
              }
            }, 45000); // Less frequent pings when connected
          }
        } else if (shouldConnect) {
          // Schedule reconnect only if we should be connected
          scheduleReconnect();
        }
      };
      
      connectionRefObj.current = onConnectionChange;
      
      // Add error function to catch connection errors
      const onError = (error: any) => {
        console.error("Firebase connection monitoring error:", error);
        setConnectionError("Connection monitoring error");
        scheduleReconnect();
      };
      
      onValue(connectedRef, onConnectionChange, onError);
    } catch (err) {
      console.error('Error setting up connection monitoring:', err);
      setConnectionError("Failed to setup connection monitoring");
      scheduleReconnect();
    }
  }, [shouldConnect, cleanupRetryTimers]);
  
  // Schedule reconnection with exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (!shouldConnect) return;
    
    cleanupRetryTimers();
    
    // Calculate backoff time - reduced max to 15 seconds
    const delay = Math.min(1000 * Math.pow(1.5, retryCountRef.current), 15000);
    
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
    
    // Clean up retry timers
    cleanupRetryTimers();
  }, [cleanupRetryTimers]);

  // Set up connection monitoring on mount or when shouldConnect changes
  useEffect(() => {
    if (shouldConnect) {
      setupConnectionMonitoring();
    } else {
      cleanupListeners();
    }
    
    return () => {
      cleanupListeners();
    };
  }, [shouldConnect, setupConnectionMonitoring, cleanupListeners]);
  
  // Force reconnect when switching from inactive to active
  useEffect(() => {
    if (shouldConnect) {
      reconnect();
    }
  }, [shouldConnect, reconnect]);

  return {
    // Return actual value for more reliable UI updates
    isConnected: isConnectedRef.current,
    error: connectionError,
    reconnect
  };
};
