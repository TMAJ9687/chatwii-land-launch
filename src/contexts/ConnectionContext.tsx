
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { realtimeDb } from '@/integrations/firebase/firebase-core';
import { firebaseListeners } from '@/services/FirebaseListenerService';
import { toast } from 'sonner';

interface ConnectionContextType {
  isConnected: boolean;
  lastConnectionEvent: Date | null;
  reconnect: () => void;
}

const ConnectionContext = createContext<ConnectionContextType>({
  isConnected: false,
  lastConnectionEvent: null,
  reconnect: () => {},
});

export const useConnection = () => useContext(ConnectionContext);

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastConnectionEvent, setLastConnectionEvent] = useState<Date | null>(null);

  // Setup connection monitoring
  useEffect(() => {
    console.log('Setting up Firebase connection monitor');
    
    // Use Firebase's special .info/connected path to monitor connection state
    const cleanupFunction = firebaseListeners.subscribe(
      'connection-status',
      '.info/connected',
      (connected: boolean | null) => {
        const isNowConnected = Boolean(connected);
        const now = new Date();
        
        setIsConnected(isNowConnected);
        setLastConnectionEvent(now);
        
        console.log(`Firebase connection status changed to ${isNowConnected ? 'connected' : 'disconnected'}`);
        
        if (!isNowConnected) {
          toast.error("Lost connection to chat server", {
            id: "connection-lost",
            duration: 3000
          });
        } else if (lastConnectionEvent) {
          // Only show reconnection toast if this isn't the first connection
          toast.success("Reconnected to chat server", {
            id: "connection-restored",
            duration: 2000
          });
        }
      },
      (error) => {
        console.error("Connection monitor error:", error);
        setIsConnected(false);
      }
    );
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      cleanupFunction();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [lastConnectionEvent]);
  
  const handleOnline = () => {
    console.log('Browser reports online status');
  };
  
  const handleOffline = () => {
    console.log('Browser reports offline status');
    setIsConnected(false);
  };

  // Force a reconnection attempt
  const reconnect = useCallback(() => {
    console.log('Attempting to reconnect to Firebase');
    
    try {
      // Trigger a dummy read to force reconnection attempt
      firebaseListeners.subscribe(
        'reconnect-ping',
        '.info/serverTimeOffset',
        () => {
          console.log('Reconnection ping completed');
          // Automatically unsubscribe after getting the response
          firebaseListeners.unsubscribe('reconnect-ping');
        }
      );
      
      toast.info("Attempting to reconnect...", {
        id: "reconnect-attempt",
      });
    } catch (error) {
      console.error("Failed to trigger reconnection:", error);
    }
  }, []);

  return (
    <ConnectionContext.Provider value={{ isConnected, lastConnectionEvent, reconnect }}>
      {children}
    </ConnectionContext.Provider>
  );
};
