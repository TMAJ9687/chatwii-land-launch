import { useEffect, useRef, useState, useCallback } from 'react';
import { useMessageChannel } from '@/hooks/chat/useMessageChannel';
import { useReactionsChannel } from '@/hooks/chat/useReactionsChannel';
import { useChannelManager } from '@/hooks/chat/useChannelManager';
import { useChatConnection } from '@/hooks/chat/useChatConnection';
import { toast } from 'sonner';
import { syncService } from '@/services/syncService';

export const useChannelSetup = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<any[]>>,
  fetchMessages: () => void
) => {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [channelStatus, setChannelStatus] = useState({ messages: false, reactions: false });
  const setupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { cleanupAllChannels } = useChannelManager();
  const { isConnected, reconnect } = useChatConnection(true);

  const {
    connectionStatus: messageStatus,
    reconnect: reconnectMessages
  } = useMessageChannel(currentUserId, selectedUserId, setMessages);

  useReactionsChannel(currentUserId, selectedUserId, fetchMessages);

  // mirror message channel status
  useEffect(() => {
    setChannelStatus(cs => ({ ...cs, messages: messageStatus === 'connected' }));
    if (messageStatus === 'connected' && setupTimeoutRef.current) {
      clearTimeout(setupTimeoutRef.current);
      setupTimeoutRef.current = null;
    }
  }, [messageStatus]);

  const handleRetryConnection = useCallback(() => {
    reconnect();
    reconnectMessages();
    if (currentUserId && selectedUserId) {
      syncService.queueSync(currentUserId, selectedUserId).catch(console.error);
    }
    toast.info('Attempting to reconnect...');
  }, [reconnect, reconnectMessages, currentUserId, selectedUserId]);

  // whenever you pick a new user, *tear down* old channels first…
  useEffect(() => {
    // if no user selected, just clean up
    if (!currentUserId || !selectedUserId) {
      cleanupAllChannels();
      return;
    }

    // 1) tear down
    cleanupAllChannels();
    if (setupTimeoutRef.current) {
      clearTimeout(setupTimeoutRef.current);
      setupTimeoutRef.current = null;
    }

    // 2) start fresh
    setIsSettingUp(true);
    syncService.queueSync(currentUserId, selectedUserId).catch(console.error);
    fetchMessages();

    // 3) after a bit, stop the “setting up…” spinner
    setupTimeoutRef.current = setTimeout(() => {
      setIsSettingUp(false);
      if (!channelStatus.messages) {
        fetchMessages();
        syncService.queueSync(currentUserId, selectedUserId).catch(console.error);
      }
    }, 5_000);
  }, [currentUserId, selectedUserId, fetchMessages, cleanupAllChannels, channelStatus.messages]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (setupTimeoutRef.current) {
        clearTimeout(setupTimeoutRef.current);
      }
      cleanupAllChannels(true);
    };
  }, [cleanupAllChannels]);

  return {
    isConnected,
    isSettingUp,
    channelStatus,
    onRetryConnection: handleRetryConnection
  };
};
