// src/hooks/chat/useChatConnection.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, get, onValue } from 'firebase/database';

export function useChatConnection(active: boolean = true) {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [lastReconnectTime, setLastReconnectTime] = useState<number>(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionCheckedRef = useRef<boolean>(false);

  // 1) A one-off check using get()
  const checkConnection = useCallback(async () => {
    if (!active) return false;

    try {
      // ⚠️ MUST be '.info/connected' NOT '/.info/connected'
      const connectedRef = ref(realtimeDb, '.info/connected');
      const snap = await get(connectedRef);
      const online = snap.val() === true;
      setIsConnected(online);
      connectionCheckedRef.current = true;
      return online;
    } catch (err) {
      console.error('Error checking connection:', err);
      setIsConnected(false);
      return false;
    }
  }, [active]);

  // 2) Subscribe to realtime updates
  useEffect(() => {
    if (!active) return;

    // run our initial check once
    if (!connectionCheckedRef.current) {
      checkConnection();
    }

    // subscribe
    // ⚠️ AGAIN: no leading '/'
    const connectedRef = ref(realtimeDb, '.info/connected');
    const unsubscribe = onValue(connectedRef, (snap) => {
      setIsConnected(snap.val() === true);
    });

    return () => unsubscribe();
  }, [active, checkConnection]);

  // 3) “Reconnect” helper with simple back-off
  const reconnect = useCallback(async () => {
    const now = Date.now();
    if (now - lastReconnectTime < 5_000) {
      // throttle to once every 5s
      return;
    }
    setLastReconnectTime(now);

    try {
      const online = await checkConnection();
      if (!online) {
        // try again in 5s
        reconnectTimerRef.current = setTimeout(reconnect, 5_000);
      }
    } catch {
      reconnectTimerRef.current = setTimeout(reconnect, 5_000);
    }
  }, [lastReconnectTime, checkConnection]);

  // 4) Cleanup any pending timer on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, []);

  return { isConnected, reconnect, checkConnection };
}
