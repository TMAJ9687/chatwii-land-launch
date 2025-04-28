
import { useEffect, useRef } from 'react';
import { useMessageChannel } from '@/hooks/chat/useMessageChannel';
import { useReactionsChannel } from '@/hooks/chat/useReactionsChannel';
import { useChannelManager } from './chat/useChannelManager';

export const useChannelSetup = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<any[]>>,
  fetchMessages: () => void
) => {
  const setupAttemptRef = useRef(false);
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

  // Centralized setup and cleanup to prevent infinite loops
  useEffect(() => {
    if (!currentUserId || !selectedUserId) return;
    
    // Only set up channels if they're not already set up
    if (!isListeningToMessages && !isListeningToReactions && !setupAttemptRef.current) {
      setupAttemptRef.current = true;
      
      // Clean up all channels before setting up new ones
      cleanupAllChannels();
      
      // Set up new channels
      setupMessageChannel();
      setupReactionsListener();
    }
    
    // Clean up on unmount or when user selection changes
    return () => {
      cleanupMessageChannel();
      cleanupReactionListener();
      setupAttemptRef.current = false;
    };
  }, [
    currentUserId, 
    selectedUserId, 
    setupMessageChannel, 
    setupReactionsListener,
    cleanupMessageChannel, 
    cleanupReactionListener,
    cleanupAllChannels,
    isListeningToMessages,
    isListeningToReactions
  ]);

  return { isListeningToMessages, isListeningToReactions };
};
