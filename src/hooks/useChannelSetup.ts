
import { useEffect } from 'react';
import { useMessageChannel } from '@/hooks/chat/useMessageChannel';
import { useReactionsChannel } from '@/hooks/chat/useReactionsChannel';

export const useChannelSetup = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<any[]>>,
  fetchMessages: () => void
) => {
  const { setupMessageChannel, cleanupMessageChannel } = useMessageChannel(currentUserId, selectedUserId, setMessages);
  const { setupReactionsListener, cleanupReactionListener } = useReactionsChannel(
    currentUserId, 
    selectedUserId, 
    fetchMessages
  );

  useEffect(() => {
    // Only set up listeners when we have both user IDs
    if (!currentUserId || !selectedUserId) {
      return;
    }

    console.log(`Setting up channels for conversation: ${currentUserId} -> ${selectedUserId}`);
    
    // Initialize message channel 
    const messageChannel = setupMessageChannel();
    
    // Initialize reactions listener
    setupReactionsListener();
    
    // Clean up function
    return () => {
      console.log('Cleaning up channels and listeners');
      cleanupMessageChannel();
      cleanupReactionListener();
    };
  }, [
    currentUserId, 
    selectedUserId, 
    setupMessageChannel, 
    setupReactionsListener, 
    cleanupMessageChannel, 
    cleanupReactionListener
  ]);
};
