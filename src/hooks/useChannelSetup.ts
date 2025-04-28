
import { useEffect } from 'react';
import { useMessageChannel } from '@/hooks/chat/useMessageChannel';
import { useReactionsChannel } from '@/hooks/chat/useReactionsChannel';

export const useChannelSetup = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<any[]>>,
  fetchMessages: () => void
) => {
  const { isListening: messageChannelActive } = useMessageChannel(currentUserId, selectedUserId, setMessages);
  const { isListening: reactionsChannelActive } = useReactionsChannel(
    currentUserId, 
    selectedUserId, 
    fetchMessages
  );

  useEffect(() => {
    // Only logging for debugging purposes
    if (currentUserId && selectedUserId) {
      console.log(`Channel setup: Messages ${messageChannelActive ? 'active' : 'inactive'}, Reactions ${reactionsChannelActive ? 'active' : 'inactive'}`);
    }
  }, [currentUserId, selectedUserId, messageChannelActive, reactionsChannelActive]);

  return {
    messageChannelActive,
    reactionsChannelActive
  };
};
