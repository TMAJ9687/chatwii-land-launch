
import { useEffect, useRef, useState, useCallback } from 'react';
import { useChatConnection } from '@/hooks/chat/useChatConnection';
import { useChannel } from '@/hooks/chat/useChannel';
import { getMessagesPath, getReactionsPath } from '@/utils/channelPath';
import { toast } from 'sonner';

export const useChannelSetup = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<any[]>>,
  fetchMessages: () => void
) => {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [channelStatus, setChannelStatus] = useState({ messages: false, reactions: false });
  const setupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isConnected, reconnect } = useChatConnection(true);
  
  // Get message channel path
  const messagesPath = currentUserId && selectedUserId ? 
    getMessagesPath(currentUserId, selectedUserId) : null;
  
  // Get reactions channel path
  const reactionsPath = currentUserId && selectedUserId ? 
    getReactionsPath(currentUserId, selectedUserId) : null;
  
  // Use our hook to subscribe to messages
  const {
    status: messagesStatus,
    data: messagesData,
    reconnect: reconnectMessages
  } = useChannel('messages', messagesPath, !!currentUserId && !!selectedUserId);
  
  // Use our hook to subscribe to reactions
  const {
    status: reactionsStatus
  } = useChannel('reactions', reactionsPath, !!currentUserId && !!selectedUserId);
  
  // Update messages when data changes
  useEffect(() => {
    if (messagesData) {
      try {
        const processedMessages = Array.isArray(messagesData) 
          ? messagesData 
          : Object.values(messagesData || {}).filter(Boolean);
        
        setMessages(processedMessages);
      } catch (err) {
        console.error('Error processing messages:', err);
      }
    }
  }, [messagesData, setMessages]);
  
  // Mirror connection status
  useEffect(() => {
    setChannelStatus({
      messages: messagesStatus === 'connected',
      reactions: reactionsStatus === 'connected'
    });
    
    if (
      messagesStatus === 'connected' && 
      reactionsStatus === 'connected' && 
      setupTimeoutRef.current
    ) {
      clearTimeout(setupTimeoutRef.current);
      setupTimeoutRef.current = null;
      setIsSettingUp(false);
    }
  }, [messagesStatus, reactionsStatus]);
  
  // Retry connection handler
  const handleRetryConnection = useCallback(() => {
    reconnect();
    reconnectMessages();
    fetchMessages();
    toast.info('Attempting to reconnect...');
  }, [reconnect, reconnectMessages, fetchMessages]);
  
  // Setup channels when users change
  useEffect(() => {
    // If no users selected, just clean up
    if (!currentUserId || !selectedUserId) {
      return;
    }
    
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
    };
  }, [currentUserId, selectedUserId, fetchMessages, channelStatus.messages]);
  
  return {
    isConnected,
    isSettingUp,
    channelStatus,
    onRetryConnection: handleRetryConnection
  };
};
