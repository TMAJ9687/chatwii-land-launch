
import { useRef, useCallback, useEffect } from 'react';
import { firebaseListener } from '@/services/FirebaseListenerService';

export const useChannelManagement = () => {
  const componentId = useRef<string>(`channel-${Math.random().toString(36).substring(2, 9)}`);
  const channelsRef = useRef<Record<string, string>>({});
  const isMountedRef = useRef(true);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Clean up all listeners for this component
      firebaseListener.removeListenersByOwner(componentId.current);
      channelsRef.current = {};
    };
  }, []);
  
  const cleanupChannels = useCallback(() => {
    if (!isMountedRef.current) return;
    
    Object.values(channelsRef.current).forEach((listenerId) => {
      if (listenerId) {
        firebaseListener.removeListener(listenerId);
        delete channelsRef.current[listenerId];
      }
    });
  }, []);

  const removeChannel = useCallback((channelName: string) => {
    if (!isMountedRef.current) return;
    
    const listenerId = channelsRef.current[channelName];
    if (listenerId) {
      firebaseListener.removeListener(listenerId);
      delete channelsRef.current[channelName];
    }
  }, []);

  const registerChannel = useCallback((channelName: string, path: string, callback: (data: any) => void) => {
    if (!isMountedRef.current) return null;
    
    // Remove existing channel if it exists
    if (channelsRef.current[channelName]) {
      firebaseListener.removeListener(channelsRef.current[channelName]);
    }
    
    // Register new listener
    const listenerId = firebaseListener.addListener(
      path,
      callback,
      undefined,
      `${componentId.current}-${channelName}`
    );
    
    channelsRef.current[channelName] = listenerId;
    return listenerId;
  }, []);

  return {
    cleanupChannels,
    removeChannel,
    registerChannel
  };
};
