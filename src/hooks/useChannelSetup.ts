
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
  
  // Call hooks directly without destructuring
  useMessageChannel(currentUserId, selectedUserId, setMessages);
  useReactionsChannel(currentUserId, selectedUserId, fetchMessages);

  // Memoized setup function to prevent recreations on render
  const performChannelSetup = useRef(
    debounce((cId: string, sId: string) => {
      if (isSettingUp) {
        console.log("Already setting up channels, skipping");
        return;
      }
      
      setIsSettingUp(true);
      
      // First ensure cleanup is complete
      console.log("Cleaning up all channels before setup");
      cleanupAllChannels();
      
      // Use setTimeout to ensure cleanup is complete 
      setTimeout(() => {
        // Double-check user IDs haven't changed during the timeout
        if (
          currentUserIdRef.current === cId && 
          selectedUserIdRef.current === sId
        ) {
          console.log("Setting up message and reaction channels");
          // Indicate we're now listening
          setIsListeningToMessages(true);
          setIsListeningToReactions(true);
        } else {
          console.log("User selection changed during setup, canceling");
        }
        setIsSettingUp(false);
      }, 300); // Reduced timeout from 500ms to 300ms for faster setup
    }, 500) // Reduced debounce from 800ms to 500ms for better responsiveness
  ).current;
  
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
      performChannelSetup(currentUserId, selectedUserId);
    }
    
    // Clean up on unmount or when user selection changes
    return () => {
      if (previousUserIdRef.current !== selectedUserId) {
        console.log("Cleaning up channels due to user change");
        setIsListeningToMessages(false);
        setIsListeningToReactions(false);
      }
    };
  }, [
    currentUserId, 
    selectedUserId, 
    performChannelSetup,
    cleanupAllChannels
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
