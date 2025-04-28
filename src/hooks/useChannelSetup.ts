
import { useEffect, useRef, useState } from 'react';
import { useMessageChannel } from '@/hooks/chat/useMessageChannel';
import { useReactionsChannel } from '@/hooks/chat/useReactionsChannel';
import { useChannelManager } from './chat/useChannelManager';
import { debounce } from 'lodash';

export const useChannelSetup = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<any[]>>,
  fetchMessages: () => void
) => {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const setupAttemptRef = useRef(false);
  const previousUserIdRef = useRef<string | null>(null);
  const { cleanupAllChannels } = useChannelManager();
  
  const { 
    setupMessageChannel, 
    cleanupMessageChannel, 
    isListening: isListeningToMessages 
  } = useMessageChannel(currentUserId, selectedUserId, setMessages);
  
  const { 
    setupReactionsListener, 
    cleanupReactionListener, 
    isListening: isListeningToReactions 
  } = useReactionsChannel(currentUserId, selectedUserId, fetchMessages);

  // Significantly increased debounce delay to prevent rapid setup/teardown cycles
  const debouncedSetup = useRef(debounce((cId: string, sId: string) => {
    if (isSettingUp) {
      console.log("Already setting up channels, skipping");
      return;
    }
    
    setIsSettingUp(true);
    
    // First ensure cleanup is complete
    console.log("Cleaning up all channels before setup");
    cleanupAllChannels();
    
    // Larger delay to ensure cleanup is complete 
    setTimeout(() => {
      // Double-check user IDs haven't changed during the timeout
      if (
        currentUserId === cId && 
        selectedUserId === sId && 
        previousUserIdRef.current === sId
      ) {
        console.log("Setting up message channel");
        setupMessageChannel();
        console.log("Setting up reactions listener");
        setupReactionsListener();
      } else {
        console.log("User selection changed during setup, canceling");
      }
      setIsSettingUp(false);
    }, 500);
  }, 800)).current; // Much longer debounce delay (800ms) to prevent spurious setups

  // Centralized setup and cleanup to prevent infinite loops
  useEffect(() => {
    // Only proceed if we have both user IDs and they've changed
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
      
      // Use the debounced setup to prevent multiple rapid setups
      debouncedSetup(currentUserId, selectedUserId);
    }
    
    // Clean up on unmount or when user selection changes
    return () => {
      if (previousUserIdRef.current !== selectedUserId) {
        console.log("Cleaning up channels due to user change");
        cleanupMessageChannel();
        cleanupReactionListener();
      }
    };
  }, [
    currentUserId, 
    selectedUserId, 
    setupMessageChannel, 
    setupReactionsListener,
    cleanupMessageChannel, 
    cleanupReactionListener,
    cleanupAllChannels,
    debouncedSetup
  ]);

  // Clean up function for component unmount
  useEffect(() => {
    return () => {
      console.log("Component unmounting, cleaning up all channels");
      setupAttemptRef.current = false;
      previousUserIdRef.current = null;
      cleanupAllChannels();
    };
  }, [cleanupAllChannels]);

  return { 
    isListeningToMessages, 
    isListeningToReactions, 
    isSettingUp 
  };
};
