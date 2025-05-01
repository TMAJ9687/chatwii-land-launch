import { useEffect, useCallback, useRef, useState } from 'react';
import { useChannelManager } from './useChannelManager';
import { MessageWithMedia } from '@/types/message';
import { isMockUser } from '@/utils/mockUsers';
import {
  getConversationId,
  getMessageChannelName,
  getMessageChannelPath
} from '@/utils/channelUtils';
import { syncService } from '@/services/syncService';

export const useMessageChannel = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<MessageWithMedia[]>>
) => {
  const { listenToChannel, cleanupChannel } = useChannelManager();
  const isListeningRef = useRef(false);
  const latestDataRef = useRef<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const channelNameRef = useRef<string | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 3;

  // 1) turn RTDB data → MessageWithMedia[]
  const processMessages = useCallback(async (data: any): Promise<MessageWithMedia[]> => {
    if (!data) return [];
    try {
      const arr = Object.values(data);
      return arr
        .filter((m: any) => m && typeof m === 'object' && m.id)
        .map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          is_read: msg.is_read,
          created_at: msg.created_at,
          media: msg.media || null,
          reactions: msg.reactions || []
        }));
    } catch (e) {
      console.error('Error processing messages:', e);
      return [];
    }
  }, []);

  // 2) on every RTDB update, *replace* (not merge) your React state
  const handleRealTimeUpdate = useCallback(
    async (data: any) => {
      latestDataRef.current = data;
      if (!data) {
        setMessages([]);
        setConnectionStatus('disconnected');
        return;
      }
      try {
        const processed = await processMessages(data);
        setMessages(processed);               // ← full replacement
        setConnectionStatus('connected');
        retryCountRef.current = 0;
      } catch (err) {
        console.error('Error in RT update:', err);
        setConnectionStatus('disconnected');
      }
    },
    [processMessages, setMessages]
  );

  // 3) subscribe helper
  const setupChannel = useCallback(() => {
    if (!currentUserId || !selectedUserId || isMockUser(selectedUserId)) return;
    const convId = getConversationId(currentUserId, selectedUserId);
    if (!convId) return;
    const channelName = getMessageChannelName(convId);
    const path = getMessageChannelPath(convId);

    channelNameRef.current = channelName;
    setConnectionStatus('connecting');
    syncService.queueSync(currentUserId, selectedUserId).catch(console.error);
    return listenToChannel(channelName, path, handleRealTimeUpdate);
  }, [currentUserId, selectedUserId, listenToChannel, handleRealTimeUpdate]);

  // 4) main effect: (re-)subscribe whenever users change
  useEffect(() => {
    // if missing IDs or demo user, clean up and bail
    if (!currentUserId || !selectedUserId || isMockUser(selectedUserId)) {
      if (isListeningRef.current && channelNameRef.current) {
        cleanupChannel(channelNameRef.current);
        channelNameRef.current = null;
        isListeningRef.current = false;
      }
      return;
    }

    // clear any pending retry timer
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    setConnectionStatus('connecting');
    const cleanup = setupChannel();
    isListeningRef.current = true;

    return () => {
      if (cleanup) cleanup();
      isListeningRef.current = false;
    };
  }, [currentUserId, selectedUserId, cleanupChannel, setupChannel]);

  // 5) automatic retry on ‘disconnected’
  useEffect(() => {
    if (
      connectionStatus === 'disconnected' &&
      isListeningRef.current &&
      retryCountRef.current < maxRetries
    ) {
      retryCountRef.current += 1;
      const backoff = 1000 * 2 ** (retryCountRef.current - 1);
      retryTimerRef.current = setTimeout(() => {
        if (channelNameRef.current) {
          cleanupChannel(channelNameRef.current);
          channelNameRef.current = null;
        }
        setupChannel();
      }, backoff);
    }
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [connectionStatus, cleanupChannel, setupChannel]);

  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    if (channelNameRef.current) {
      cleanupChannel(channelNameRef.current);
      channelNameRef.current = null;
    }
    setConnectionStatus('connecting');
    setupChannel();
  }, [cleanupChannel, setupChannel]);

  return {
    latestData: latestDataRef.current,
    connectionStatus,
    reconnect
  };
};
