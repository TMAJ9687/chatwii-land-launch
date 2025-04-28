
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

  // Debounced setup function with increased delay to prevent rapid setup/teardown cycles
  const debouncedSetup = useRef(debounce((cId: string, sId: string) => {
    if (isSettingUp) return;
    
    setIsSettingUp(true);
    
    // First ensure cleanup is complete
    cleanupAllChannels();
    
    // Small delay to ensure cleanup is complete
    setTimeout(() => {
      // Only proceed if the user IDs haven't changed during the timeout
      if (
        currentUserId === cId && 
        selectedUserId === sId && 
        previousUserIdRef.current === sId
      ) {
        setupMessageChannel();
        setupReactionsListener();
      }
      setIsSettingUp(false);
    }, 200);
  }, 400)).current;

  // Centralized setup and cleanup to prevent infinite loops
  useEffect(() => {
    // Only proceed if we have both user IDs and they've changed
    if (!currentUserId || !selectedUserId) return;
    
    const userIdChanged = 
      previousUserIdRef.current !== selectedUserId || 
      setupAttemptRef.current === false;
      
    if (userIdChanged) {
      previousUserIdRef.current = selectedUserId;
      setupAttemptRef.current = true;
      
      // Use the debounced setup to prevent multiple rapid setups
      debouncedSetup(currentUserId, selectedUserId);
    }
    
    // Clean up on unmount or when user selection changes
    return () => {
      if (previousUserIdRef.current !== selectedUserId) {
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
