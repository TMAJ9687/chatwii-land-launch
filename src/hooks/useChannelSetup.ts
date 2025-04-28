
import { useEffect, useRef, useState } from 'react';
import { useMessageChannel } from '@/hooks/chat/useMessageChannel';
import { useReactionsChannel } from '@/hooks/chat/useReactionsChannel';
import { useChannelManager } from './chat/useChannelManager';

export const useChannelSetup = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<any[]>>,
  fetchMessages: () => void
) => {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isListeningToMessages, setIsListeningToMessages] = useState(false);
  const [isListeningToReactions, setIsListeningToReactions] = useState(false);
  
  const setupAttemptRef = useRef(false);
  const previousUserIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(currentUserId);
  const selectedUserIdRef = useRef<string | null>(selectedUserId);
  const { cleanupAllChannels } = useChannelManager();
  
  // Update refs when props change to avoid stale closures
  useEffect(() => {
    currentUserIdRef.current = currentUserId;
    selectedUserIdRef.current = selectedUserId;
  }, [currentUserId, selectedUserId]);
  
  // Call hooks directly - this ensures listeners are set up immediately
  useMessageChannel(currentUserId, selectedUserId, setMessages);
  useReactionsChannel(currentUserId, selectedUserId, fetchMessages);

  // Setup effect for channel initialization/cleanup
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
      
      // Set up immediately without debouncing
      if (isSettingUp) {
        console.log("Already setting up channels, continuing anyway");
      }
      
      setIsSettingUp(true);
      console.log("Setting up message and reaction channels immediately");
      setIsListeningToMessages(true);
      setIsListeningToReactions(true);
      setIsSettingUp(false);
    }
    
    // Clean up on unmount or when user selection changes
    return () => {
      if (previousUserIdRef.current !== selectedUserId) {
        console.log("Cleaning up channels due to user change");
        // Don't actually call cleanup here to prevent premature disconnection
        setIsListeningToMessages(false);
        setIsListeningToReactions(false);
      }
    };
  }, [currentUserId, selectedUserId]);

  // Only clean up everything when component actually unmounts
  useEffect(() => {
    return () => {
      console.log("Component unmounting, cleaning up all channels");
      setupAttemptRef.current = false;
      previousUserIdRef.current = null;
      cleanupAllChannels(true); // Force cleanup only on unmount
    };
  }, [cleanupAllChannels]);

  return { 
    isListeningToMessages, 
    isListeningToReactions, 
    isSettingUp 
  };
};
