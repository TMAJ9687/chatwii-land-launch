import { useState, useEffect, useCallback, useRef } from 'react';
import { syncService } from '@/services/syncService';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, get, onValue } from 'firebase/database';

export function useChatConnection(active: boolean = true) {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [lastReconnectTime, setLastReconnectTime] = useState<number>(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionCheckedRef = useRef<boolean>(false);

  // Check database connectivity once
  const checkConnection = useCallback(async () => {
    if (!active) return false;

    try {
      // Always use the absolute path for the special info node
      const testRef = ref(realtimeDb, '.info/connected');
      const snapshot = await get(testRef);
      const online = snapshot.val() === true;

      setIsConnected(online);
      connectionCheckedRef.current = true;

      if (online) {
        syncService
          .checkRealtimeDatabaseRules()
          .catch(err => console.error('Error checking database rules:', err));
      }

      return online;
    } catch (err) {
      console.error('Error checking connection:', err);
      setIsConnected(false);
      return false;
    }
  }, [active]);

  // Keep the isConnected state in sync with Realtime Database
  useEffect(() => {
    if (!active) return;

    // Initial one-time check
    if (!connectionCheckedRef.current) {
      checkConnection();
    }

    // Subscribe to connection changes at the absolute path
    const connectedRef = ref(realtimeDb, '.info/connected');
    const unsubscribe = onValue(connectedRef, snapshot => {
      setIsConnected(snapshot.val() === true);
    });

    return () => {
      unsubscribe();
    };
  }, [active, checkConnection]);

  // Throttled manual reconnect trigger
  const reconnect = useCallback(async () => {
    const now = Date.now();
    if (now - lastReconnectTime < 5000) {
      console.log('Throttling reconnect attempt');
      return;
    }
    setLastReconnectTime(now);

    console.log('Attempting to reconnect to chat...');
    const online = await checkConnection();
    if (online) {
      console.log('Successfully reconnected to chat');
    } else {
      console.log('Reconnect failed, retry in 5s');
      reconnectTimerRef.current = setTimeout(reconnect, 5000);
    }
  }, [lastReconnectTime, checkConnection]);

  // Cleanup any pending timer on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, []);

  return { isConnected, reconnect, checkConnection };
}
