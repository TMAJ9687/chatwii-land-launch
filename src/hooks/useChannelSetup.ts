
import { useEffect } from 'react';
import { useMessageChannel } from '@/hooks/chat/useMessageChannel';
import { useReactionsChannel } from '@/hooks/chat/useReactionsChannel';
import { useChannelManagement } from '@/hooks/chat/useChannelManagement';

export const useChannelSetup = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<any[]>>,
  fetchMessages: () => void
) => {
  const { cleanupChannels } = useChannelManagement();
  const { setupMessageChannel } = useMessageChannel(currentUserId, selectedUserId, setMessages);
  const { setupReactionsListener, cleanupReactionListener } = useReactionsChannel(
    currentUserId, 
    selectedUserId, 
    fetchMessages
  );

  useEffect(() => {
    // Only set up channels when we have both user IDs
    if (!currentUserId || !selectedUserId) {
      return;
    }

    console.log(`Setting up channels for conversation: ${currentUserId} -> ${selectedUserId}`);
    
    // Initialize message channel 
    const messageChannel = setupMessageChannel();
    
    // Initialize reactions listener using Firebase
    setupReactionsListener();
    
    // Clean up function
    return () => {
      console.log('Cleaning up channels and listeners');
      cleanupChannels();
      cleanupReactionListener();
    };
  }, [
    currentUserId, 
    selectedUserId, 
    setupMessageChannel, 
    setupReactionsListener, 
    cleanupChannels, 
    cleanupReactionListener
  ]);
};
