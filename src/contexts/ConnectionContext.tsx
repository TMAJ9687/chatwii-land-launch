import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, serverTimestamp } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/client';
import { firebaseListeners } from '@/services/FirebaseListenerService';
import { toast } from 'sonner';
import { useMockMode } from '@/contexts/MockModeContext';

// Connection status check interval in ms (1 minute)
const CONNECTION_CHECK_INTERVAL = 60000;
// Time before attempting auto-reconnect (10 seconds)
const RECONNECT_DELAY = 10000;
// Max reconnection attempts before showing message
const MAX_RECONNECT_ATTEMPTS = 3;

interface ConnectionContextType {
  isConnected: boolean;
  lastConnectionUpdate: Date | null;
  reconnect: () => Promise<boolean>;
  connectionState: 'connected' | 'connecting' | 'disconnected';
}

const ConnectionContext = createContext<ConnectionContextType>({
  isConnected: false,
  lastConnectionUpdate: null,
  reconnect: async () => false,
  connectionState: 'disconnected',
});

export const useConnection = () => useContext(ConnectionContext);

interface ConnectionProviderProps {
  children: React.ReactNode;
}

export const ConnectionProvider: React.FC<ConnectionProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastConnectionUpdate, setLastConnectionUpdate] = useState<Date | null>(null);
  const [connectionState, setConnectionState] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const [heartbeatInterval, setHeartbeatInterval] = useState<NodeJS.Timeout | null>(null);
  const { isMockMode } = useMockMode();

  // Setup the connection monitoring
  useEffect(() => {
    // If in mock mode, always report as connected
    if (isMockMode) {
      setIsConnected(true);
      setConnectionState('connected');
      setLastConnectionUpdate(new Date());
      return () => {};
    }
    
    let mounted = true;
    
    // Monitor .info/connected to detect connection status
    const setupConnectionListener = () => {
      console.log('Setting up connection listener');
      setConnectionState('connecting');
      
      // Create a unique heartbeat reference for this client session
      const clientId = Math.random().toString(36).substring(2, 15);
      const heartbeatRef = ref(realtimeDb, `heartbeats/${clientId}`);
      
      // Using the string path for Realtime DB
      const unsubscribe = firebaseListeners.subscribe(
        'connection-status',
        '.info/connected',
        (connected: boolean | null) => {
          if (!mounted) return;
          
          const newConnectionState = connected ? 'connected' : 'disconnected';
          setConnectionState(newConnectionState);
          setIsConnected(!!connected);
          setLastConnectionUpdate(new Date());
          
          if (connected) {
            console.log('Connected to Firebase Realtime Database');
            setReconnectAttempts(0);
            
            // Setup heartbeat interval
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            const interval = setInterval(() => {
              try {
                set(heartbeatRef, {
                  timestamp: serverTimestamp()
                }).catch(err => console.warn('Heartbeat error:', err));
              } catch (e) {
                console.warn('Error setting heartbeat:', e);
              }
            }, CONNECTION_CHECK_INTERVAL);
            setHeartbeatInterval(interval);
          } else {
            console.log('Disconnected from Firebase Realtime Database');
            if (heartbeatInterval) {
              clearInterval(heartbeatInterval);
              setHeartbeatInterval(null);
            }
            
            // Try to reconnect automatically after delay if not too many attempts
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              setTimeout(() => {
                if (mounted && !isConnected) {
                  console.log(`Attempting automatic reconnection (attempt ${reconnectAttempts + 1})`);
                  reconnect();
                  setReconnectAttempts(prev => prev + 1);
                }
              }, RECONNECT_DELAY);
            } else if (reconnectAttempts === MAX_RECONNECT_ATTEMPTS) {
              toast.error('Connection lost. Please check your internet connection.', {
                action: {
                  label: 'Reconnect',
                  onClick: reconnect,
                },
              });
            }
          }
        }
      );
      
      // Add online/offline event listeners for browser connectivity
      const handleOnline = () => {
        console.log('Browser online');
        if (!isConnected) {
          reconnect();
        }
      };
      
      const handleOffline = () => {
        console.log('Browser offline');
        setIsConnected(false);
        setConnectionState('disconnected');
        setLastConnectionUpdate(new Date());
      };
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        firebaseListeners.unsubscribe('connection-status');
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
        
        // Clear the heartbeat reference when unmounting
        try {
          set(heartbeatRef, null).catch(err => console.warn('Error clearing heartbeat:', err));
        } catch (e) {
          console.warn('Error clearing heartbeat on unmount:', e);
        }
      };
    };
    
    const cleanup = setupConnectionListener();
    
    return () => {
      mounted = false;
      cleanup();
    };
  }, [reconnectAttempts, isConnected, isMockMode]);
  
  // Function to force a reconnection attempt
  const reconnect = useCallback(async () => {
    // In mock mode, just report success immediately
    if (isMockMode) {
      return Promise.resolve(true);
    }
    
    setConnectionState('connecting');
    
    try {
      // Clean up existing listeners first
      firebaseListeners.unsubscribe('connection-status');
      
      // Read from .info/connected to trigger a reconnection attempt
      const connectedRef = ref(realtimeDb, '.info/connected');
      
      return new Promise<boolean>((resolve) => {
        const unsub = onValue(
          connectedRef, 
          (snap) => {
            const connected = !!snap.val();
            setIsConnected(connected);
            setConnectionState(connected ? 'connected' : 'disconnected');
            setLastConnectionUpdate(new Date());
            unsub(); // Only need one reading
            resolve(connected);
          }, 
          (error) => {
            console.error('Error reconnecting:', error);
            setIsConnected(false);
            setConnectionState('disconnected');
            setLastConnectionUpdate(new Date());
            resolve(false);
          }
        );
        
        // If we don't get a response after 5 seconds, resolve as false
        setTimeout(() => {
          unsub();
          setIsConnected(false);
          setConnectionState('disconnected');
          resolve(false);
        }, 5000);
      });
    } catch (error) {
      console.error('Error during reconnect:', error);
      setIsConnected(false);
      setConnectionState('disconnected');
      return false;
    }
  }, [isMockMode]);
  
  const value = {
    isConnected: isMockMode ? true : isConnected,
    lastConnectionUpdate,
    reconnect,
    connectionState: isMockMode ? 'connected' : connectionState,
  };
  
  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
};
