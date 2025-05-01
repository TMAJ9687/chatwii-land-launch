// src/hooks/chat/useChatConnection.ts

import { useState, useEffect, useCallback } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, onValue } from 'firebase/database';

export function useChatConnection(active: boolean = true) {
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // 1) Subscribe to '.info/connected' and update state
  useEffect(() => {
    if (!active) return;

    const connectedRef = ref(realtimeDb, '.info/connected');
    const unsubscribe = onValue(
      connectedRef,
      (snap) => {
        setIsConnected(!!snap.val());
      },
      (err) => {
        console.error('Connection monitor error:', err);
        setIsConnected(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [active]);

  // 2) Placeholder reconnect (if you want to force a reconnection you can toggle
  //    the SDK back online/offline, or just rely on the onValue above)
  const reconnect = useCallback(() => {
    console.log('useChatConnection: reconnect() called — nothing to do; onValue will auto-recover.');
  }, []);

  return { isConnected, reconnect };
}
