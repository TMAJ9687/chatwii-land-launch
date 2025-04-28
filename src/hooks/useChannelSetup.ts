
import { useEffect, useRef, useState } from 'react';
import { useMessageChannel } from '@/hooks/chat/useMessageChannel';
import { useReactionsChannel } from '@/hooks/chat/useReactionsChannel';
import { useChannelManager } from './chat/useChannelManager';
import { useChatConnection } from './chat/useChatConnection';

export const useChannelSetup = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<any[]>>,
  fetchMessages: () => void
) => {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [channelStatus, setChannelStatus] = useState({
    messages: false,
    reactions: false
  });
  
  // Track setup state with refs
  const setupAttemptRef = useRef(false);
  const previousUserIdRef = useRef<string | null>(null);
  const { cleanupAllChannels } = useChannelManager();
  
  // Ensure we maintain connection whenever chat is open
  const { isConnected } = useChatConnection(true);
  
  // Call hooks to set up channels
  const { connectionStatus: messageStatus } = useMessageChannel(currentUserId, selectedUserId, setMessages);
  useReactionsChannel(currentUserId, selectedUserId, fetchMessages);
  
  // Update channel status based on connection status
  useEffect(() => {
    setChannelStatus(prev => ({
      ...prev,
      messages: messageStatus === 'connected'
    }));
  }, [messageStatus]);

  // Setup effect for channel initialization
  useEffect(() => {
    // Only proceed if we have both user IDs
    if (!currentUserId || !selectedUserId) {
      console.log("Missing user IDs, skipping channel setup");
      return;
    }
    
    const userIdChanged = 
      previousUserIdRef.current !== selectedUserId || 
      setupAttemptRef.current === false;
      
    if (userIdChanged) {
      console.log(`User selection changed: ${previousUserIdRef.current} -> ${selectedUserId}`);
      previousUserIdRef.current = selectedUserId;
      setupAttemptRef.current = true;
      
      // Set up immediately
      setIsSettingUp(true);
      console.log("Setting up message and reaction channels immediately");
      setChannelStatus({
        messages: false,
        reactions: false
      });
      
      // Give a little time for setup to complete
      setTimeout(() => {
        setIsSettingUp(false);
      }, 500);
    }
    
    // Fetch messages initially to ensure we have data while channels connect
    if (userIdChanged && !isSettingUp) {
      fetchMessages();
    }
  }, [currentUserId, selectedUserId, fetchMessages, isSettingUp]);

  // Only clean up everything when component unmounts
  useEffect(() => {
    return () => {
      console.log("Component unmounting, cleaning up all channels");
      setupAttemptRef.current = false;
      previousUserIdRef.current = null;
      cleanupAllChannels(true); // Force cleanup only on unmount
    };
  }, [cleanupAllChannels]);

  return { 
    isConnected,
    isSettingUp,
    channelStatus
  };
};
