
import { useRef, useCallback, useEffect } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, onValue, off } from 'firebase/database';
import { useChannelManager } from './useChannelManager';

// Backward compatibility hook that uses the newer useChannelManager
export const useChannelManagement = () => {
  const { listenToChannel, cleanupChannel } = useChannelManager();
  
  const setupChannel = useCallback((channelName: string, path: string, onData: (data: any) => void) => {
    return listenToChannel(channelName, path, onData);
  }, [listenToChannel]);
  
  return {
    setupChannel,
    cleanupChannel
  };
};
