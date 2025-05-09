
// src/hooks/chat/useChatConnection.ts

import { useEffect } from 'react';
import { useConnection } from '@/contexts/ConnectionContext';
import { useMockMode } from '@/contexts/MockModeContext';

/**
 * Hook for accessing Firebase Realtime Database connection status
 * This is a simplified wrapper around the ConnectionContext for backward compatibility
 */
export function useChatConnection(active: boolean = true) {
  const { isConnected, reconnect } = useConnection();
  const { isMockMode } = useMockMode();

  // For debugging and monitoring, log connection status changes
  useEffect(() => {
    if (!active) return;
    
    // In mock mode, always consider connected
    if (isMockMode) {
      console.log('useChatConnection: Mock mode active, simulating connection');
      return;
    }
    
    if (isConnected) {
      console.log('useChatConnection: Connected to chat server');
    } else {
      console.log('useChatConnection: Disconnected from chat server');
    }
  }, [isConnected, active, isMockMode]);

  return { 
    isConnected: isMockMode ? true : isConnected, 
    reconnect 
  };
}
