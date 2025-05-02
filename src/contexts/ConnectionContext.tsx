
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/client';
import { FirebaseListenerService } from '@/services/FirebaseListenerService';

// Get the singleton instance
const firebaseListeners = FirebaseListenerService.getInstance();

interface ConnectionContextType {
  isConnected: boolean;
  lastConnectionUpdate: Date | null;
  reconnect: () => void;
}

const ConnectionContext = createContext<ConnectionContextType>({
  isConnected: false,
  lastConnectionUpdate: null,
  reconnect: () => {},
});

export const useConnection = () => useContext(ConnectionContext);

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastConnectionUpdate, setLastConnectionUpdate] = useState<Date | null>(null);

  // Setup the connection monitoring
  useEffect(() => {
    // Monitor .info/connected to detect connection status
    const unsubscribe = firebaseListeners.subscribe(
      'connection-status',
      '.info/connected',
      (connected: boolean | null) => {
        setIsConnected(!!connected);
        setLastConnectionUpdate(new Date());
        
        if (connected) {
          console.log('Connected to Firebase Realtime Database');
        } else {
          console.log('Disconnected from Firebase Realtime Database');
        }
      }
    );
    
    // Add online/offline event listeners for browser connectivity
    const handleOnline = () => {
      console.log('Browser online');
    };
    
    const handleOffline = () => {
      console.log('Browser offline');
      setIsConnected(false);
      setLastConnectionUpdate(new Date());
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      firebaseListeners.unsubscribe('connection-status');
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Function to force a reconnection attempt
  const reconnect = () => {
    // Read from .info/connected to trigger a reconnection attempt
    const connectedRef = ref(realtimeDb, '.info/connected');
    onValue(
      connectedRef, 
      (snap) => {
        setIsConnected(!!snap.val());
        setLastConnectionUpdate(new Date());
      }, 
      (error) => {
        console.error('Error reconnecting:', error);
        setIsConnected(false);
        setLastConnectionUpdate(new Date());
      }
    );
  };
  
  const value = {
    isConnected,
    lastConnectionUpdate,
    reconnect,
  };
  
  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
};
