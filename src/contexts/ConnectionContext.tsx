
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, onValue } from 'firebase/database';
import { toast } from 'sonner';

interface ConnectionContextType {
  isConnected: boolean;
  connectionError: string | null;
  reconnect: () => void;
}

const ConnectionContext = createContext<ConnectionContextType>({
  isConnected: false,
  connectionError: null,
  reconnect: () => {},
});

export const useConnection = () => useContext(ConnectionContext);

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Setup Firebase connection monitoring
  useEffect(() => {
    const connectedRef = ref(realtimeDb, '.info/connected');
    
    const unsubscribe = onValue(
      connectedRef,
      (snap) => {
        const connected = !!snap.val();
        setIsConnected(connected);
        if (connected && connectionError) {
          setConnectionError(null);
        }
      },
      (err) => {
        console.error('Connection monitor error:', err);
        setIsConnected(false);
        setConnectionError(`Connection error: ${err.message}`);
        toast.error('Lost connection to chat server');
      }
    );

    return () => unsubscribe();
  }, [connectionError]);

  // Function to attempt reconnection
  const reconnect = useCallback(() => {
    toast.info('Attempting to reconnect to chat server...');
    // Firebase will automatically attempt to reconnect
    // This function mainly serves as a user-initiated action that refreshes UI state
    setConnectionError(null);
  }, []);

  return (
    <ConnectionContext.Provider value={{ isConnected, connectionError, reconnect }}>
      {children}
    </ConnectionContext.Provider>
  );
};
