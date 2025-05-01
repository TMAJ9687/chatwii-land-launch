
// src/hooks/chat/useChatConnection.ts

import { useEffect } from 'react';
import { useConnection } from '@/contexts/ConnectionContext';

/**
 * Hook for accessing Firebase Realtime Database connection status
 * This is a simplified wrapper around the ConnectionContext for backward compatibility
 */
export function useChatConnection(active: boolean = true) {
  const { isConnected, reconnect } = useConnection();

  // For debugging and monitoring, log connection status changes
  useEffect(() => {
    if (!active) return;
    
    if (isConnected) {
      console.log('useChatConnection: Connected to chat server');
    } else {
      console.log('useChatConnection: Disconnected from chat server');
    }
  }, [isConnected, active]);

  return { isConnected, reconnect };
}
