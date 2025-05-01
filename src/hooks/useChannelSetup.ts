
import { useState, useCallback } from 'react';
import { useMessageChannel } from '@/hooks/chat/useMessageChannel';
import { useConnection } from '@/contexts/ConnectionContext';
import { getConversationId } from '@/utils/channelUtils';
import { syncService } from '@/services/syncService';

export const useChannelSetup = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<any[]>>
) => {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const { isConnected, reconnect: reconnectGlobal } = useConnection();
  
  // Get conversation ID
  const conversationId = currentUserId && selectedUserId ? 
    getConversationId(currentUserId, selectedUserId) : null;
  
  // Use our message channel hook
  const { 
    messages,
    isLoading,
    error: channelError, 
    reconnect: reconnectChannel,
    sync
  } = useMessageChannel(currentUserId, selectedUserId, conversationId);
  
  // Sync messages when channel is set up
  const setupChannel = useCallback(() => {
    if (currentUserId && selectedUserId) {
      setIsSettingUp(true);
      sync();
      
      // After a delay, stop the "setting up" spinner
      setTimeout(() => {
        setIsSettingUp(false);
      }, 2000);
    }
  }, [currentUserId, selectedUserId, sync]);
  
  // Handle reconnection
  const handleRetryConnection = useCallback(() => {
    reconnectGlobal();
    reconnectChannel();
    setupChannel();
  }, [reconnectGlobal, reconnectChannel, setupChannel]);
  
  // Update messages when they change
  if (messages.length > 0) {
    setMessages(messages);
  }
  
  return {
    isConnected,
    isSettingUp,
    isLoading,
    channelError,
    setupChannel,
    onRetryConnection: handleRetryConnection
  };
};
