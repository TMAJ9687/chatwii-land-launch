
import { useState, useEffect, useCallback, useRef } from 'react';
import { syncService } from '@/services/syncService';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, set, get, onDisconnect, onValue } from 'firebase/database';

export function useChatConnection(active: boolean = true) {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [lastReconnectTime, setLastReconnectTime] = useState<number>(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionCheckedRef = useRef<boolean>(false);

  // Check database connectivity
  const checkConnection = useCallback(async () => {
    if (!active) return;
    
    try {
      // Try a simple read operation to see if we're connected
      const testRef = ref(realtimeDb, '/.info/connected');
      const snapshot = await get(testRef);
      const isOnline = snapshot.val() === true;
      
      setIsConnected(isOnline);
      connectionCheckedRef.current = true;
      
      // Also check rules
      if (isOnline) {
        syncService.checkRealtimeDatabaseRules()
          .catch(err => console.error('Error checking database rules:', err));
      }
      
      return isOnline;
    } catch (error) {
      console.error('Error checking connection:', error);
      setIsConnected(false);
      return false;
    }
  }, [active]);

  // Setup connection monitoring
  useEffect(() => {
    if (!active) return;
    
    // Initial check
    if (!connectionCheckedRef.current) {
      checkConnection();
    }
    
    // Monitor connection state
    const connectedRef = ref(realtimeDb, '.info/connected');
    
    // Fixed: Use onValue to monitor connection changes
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const connected = snapshot.val() === true;
      setIsConnected(connected);
      
      // Don't set onDisconnect handler on the .info/connected reference
      // onDisconnect handlers should only be set on your application's data paths
      // such as presence/{uid}
    });
    
    return () => {
      // Handle cleanup
      unsubscribe();
    };
  }, [active, checkConnection]);

  // Reconnect function with throttling
  const reconnect = useCallback(async () => {
    const now = Date.now();
    
    // Throttle reconnection attempts (max one every 5 seconds)
    if (now - lastReconnectTime < 5000) {
      console.log('Throttling reconnect attempt');
      return;
    }
    
    // Clear any pending reconnect timer
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    setLastReconnectTime(now);
    console.log('Attempting to reconnect to chat...');
    
    try {
      // Check connection
      const isOnline = await checkConnection();
      
      if (isOnline) {
        console.log('Successfully reconnected to chat');
      } else {
        console.log('Failed to reconnect immediately, will retry in 5s');
        reconnectTimerRef.current = setTimeout(reconnect, 5000);
      }
    } catch (error) {
      console.error('Error during reconnect:', error);
      reconnectTimerRef.current = setTimeout(reconnect, 5000);
    }
  }, [lastReconnectTime, checkConnection]);

  // Clean up any timers on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, []);

  return { isConnected, reconnect, checkConnection };
}
