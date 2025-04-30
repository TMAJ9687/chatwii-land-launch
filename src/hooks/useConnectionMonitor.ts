
import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/client';
import { notificationService } from '@/services/notificationService';

/**
 * Hook for monitoring global Firebase Realtime Database connection status
 * This helps identify issues with connectivity
 */
export const useConnectionMonitor = (enabled: boolean = true) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastConnectionEvent, setLastConnectionEvent] = useState<Date | null>(null);
  
  // Setup connection monitoring
  useEffect(() => {
    if (!enabled) return;
    
    notificationService.debug('Setting up connection monitor');
    
    try {
      // Use Firebase's special .info/connected path to monitor connection state
      const connectedRef = ref(realtimeDb, '.info/connected');
      
      onValue(connectedRef, (snapshot) => {
        const connected = !!snapshot.val();
        const now = new Date();
        
        setIsConnected(connected);
        setLastConnectionEvent(now);
        
        if (connected) {
          notificationService.debug(`Connected to Firebase Realtime Database at ${now.toISOString()}`);
        } else {
          notificationService.debug(`Disconnected from Firebase Realtime Database at ${now.toISOString()}`);
        }
      });
      
      return () => {
        off(connectedRef);
        notificationService.debug('Connection monitor cleaned up');
      };
    } catch (error) {
      notificationService.error('Failed to monitor connection status', error);
      return () => {};
    }
  }, [enabled]);
  
  // Force a reconnection attempt
  const reconnect = useCallback(() => {
    try {
      // Trigger a dummy read to force reconnection
      const pingRef = ref(realtimeDb, '.info/serverTimeOffset');
      
      onValue(pingRef, () => {
        notificationService.info('Reconnection attempt completed');
      }, 
      {
        onlyOnce: true
      });
    } catch (error) {
      notificationService.error('Failed to trigger reconnection', error);
    }
  }, []);
  
  return {
    isConnected,
    lastConnectionEvent,
    reconnect
  };
};
