
// src/hooks/chat/useChatConnection.ts

import { useConnection } from '@/contexts/ConnectionContext';

// This hook is now just a wrapper around useConnection for backward compatibility
export function useChatConnection(active: boolean = true) {
  const { isConnected, reconnect } = useConnection();
  
  return { isConnected, reconnect };
}
