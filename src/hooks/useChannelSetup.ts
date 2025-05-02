
import { useEffect, useRef, useState, useCallback } from 'react';
import { useConnection } from '@/contexts/ConnectionContext';
import { FirebaseListenerService } from '@/services/FirebaseListenerService';
import { getMessagesPath, getReactionsPath, getConversationId } from '@/utils/channelUtils';

// Get the singleton instance
const firebaseListeners = FirebaseListenerService.getInstance();

export const useChannelSetup = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<any[]>>,
  fetchMessages: () => void
) => {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [channelStatus, setChannelStatus] = useState({ messages: false, reactions: false });
  const setupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isConnected, reconnect } = useConnection();
  
  // Handle reconnection
  const handleRetryConnection = useCallback(() => {
    reconnect();
    fetchMessages();
  }, [reconnect, fetchMessages]);
  
  // Setup channels when users change
  useEffect(() => {
    // If no users selected, just clean up
    if (!currentUserId || !selectedUserId) {
      return;
    }
    
    // Generate conversation ID and paths
    const conversationId = getConversationId(currentUserId, selectedUserId);
    const messagesPath = getMessagesPath(currentUserId, selectedUserId);
    const reactionsPath = getReactionsPath(currentUserId, selectedUserId);
    
    if (!messagesPath || !reactionsPath || !conversationId) return;
    
    // Start fresh setup
    setIsSettingUp(true);
    fetchMessages();
    
    // After a timeout, stop the "setting up..." spinner
    setupTimeoutRef.current = setTimeout(() => {
      setIsSettingUp(false);
      if (!channelStatus.messages) {
        fetchMessages();
      }
    }, 5000);
    
    return () => {
      if (setupTimeoutRef.current) {
        clearTimeout(setupTimeoutRef.current);
        setupTimeoutRef.current = null;
      }
      
      // Clean up any listeners
      firebaseListeners.unsubscribe(`messages-${conversationId}`);
      firebaseListeners.unsubscribe(`reactions-${conversationId}`);
    };
  }, [currentUserId, selectedUserId, fetchMessages, channelStatus.messages]);
  
  return {
    isConnected,
    isSettingUp,
    channelStatus,
    onRetryConnection: handleRetryConnection
  };
};
