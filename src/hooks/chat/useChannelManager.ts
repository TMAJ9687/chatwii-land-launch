
import { useCallback, useRef } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, onValue, off, DatabaseReference } from 'firebase/database';

type ChannelCallback = (data: any) => void;

export function useChannelManager() {
  const channelsRef = useRef<Record<string, DatabaseReference>>({});

  const listenToChannel = useCallback(
    (channelName: string, path: string, callback: ChannelCallback) => {
      try {
        const dbRef = ref(realtimeDb, path);
        channelsRef.current[channelName] = dbRef;

        onValue(dbRef, (snapshot) => {
          callback(snapshot.val());
        });

        return () => cleanupChannel(channelName);
      } catch (err) {
        console.error(`Error setting up channel ${channelName}:`, err);
        return () => {};
      }
    },
    []
  );

  const cleanupChannel = useCallback((channelName: string) => {
    const dbRef = channelsRef.current[channelName];
    if (dbRef) {
      off(dbRef);
      delete channelsRef.current[channelName];
    }
  }, []);

  return {
    listenToChannel,
    cleanupChannel,
  };
}
