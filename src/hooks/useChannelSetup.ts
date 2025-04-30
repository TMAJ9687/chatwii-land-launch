
import { useEffect, useRef, useState } from 'react';
import { useMessageChannel } from '@/hooks/chat/useMessageChannel';
import { useReactionsChannel } from '@/hooks/chat/useReactionsChannel';
import { useChannelManager } from './chat/useChannelManager';
import { useChatConnection } from './chat/useChatConnection';
import { toast } from 'sonner';

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
  const setupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setupRetryCountRef = useRef(0);
  const hasTriedToSetupRef = useRef(false);
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
    
    // If we're connected after setup, clear any pending setup retries
    if (messageStatus === 'connected' && setupTimeoutRef.current) {
      clearTimeout(setupTimeoutRef.current);
      setupTimeoutRef.current = null;
      setupRetryCountRef.current = 0;
    }
  }, [messageStatus]);

  // Setup effect for channel initialization with improved retry logic
  useEffect(() => {
    // Only proceed if we have both user IDs
    if (!currentUserId || !selectedUserId) {
      console.log("Missing user IDs, skipping channel setup");
      return;
    }

    // Check if this is a new user selection or first setup
    const userIdChanged = 
      previousUserIdRef.current !== selectedUserId || 
      !hasTriedToSetupRef.current;
      
    if (userIdChanged) {
      hasTriedToSetupRef.current = true;
      console.log(`User selection changed: ${previousUserIdRef.current} -> ${selectedUserId}`);
      previousUserIdRef.current = selectedUserId;
      setupAttemptRef.current = true;
      
      // Clear any existing setup timeout
      if (setupTimeoutRef.current) {
        clearTimeout(setupTimeoutRef.current);
        setupTimeoutRef.current = null;
      }
      
      // Set up immediately
      setIsSettingUp(true);
      console.log("Setting up message and reaction channels");
      setChannelStatus({
        messages: false,
        reactions: false
      });
      
      // Reset retry count for new user
      setupRetryCountRef.current = 0;
      
      // Fetch messages right away
      fetchMessages();
      
      // Give time for setup to complete
      setupTimeoutRef.current = setTimeout(() => {
        setIsSettingUp(false);
        
        // Check channel status and retry if needed
        if (!channelStatus.messages && setupRetryCountRef.current < 2) {
          console.log(`Channel setup incomplete, trying another approach (${setupRetryCountRef.current + 1}/2)`);
          setupRetryCountRef.current += 1;
          
          // Force a direct fetch instead of more retries
          fetchMessages();
        } else if (!channelStatus.messages) {
          // If we're still not connected after retries, inform the user but don't keep retrying
          toast.info("Using cached messages. Reconnecting in background...");
        }
      }, 5000); // Increased timeout to give more time for setup
    }
  }, [currentUserId, selectedUserId, fetchMessages, isSettingUp, channelStatus, cleanupAllChannels]);

  // Only clean up everything when component unmounts
  useEffect(() => {
    return () => {
      console.log("Component unmounting, cleaning up all channels");
      setupAttemptRef.current = false;
      previousUserIdRef.current = null;
      hasTriedToSetupRef.current = false;
      
      if (setupTimeoutRef.current) {
        clearTimeout(setupTimeoutRef.current);
        setupTimeoutRef.current = null;
      }
      
      cleanupAllChannels(true); // Force cleanup only on unmount
    };
  }, [cleanupAllChannels]);

  return { 
    isConnected,
    isSettingUp,
    channelStatus
  };
};
