
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
  const { setupReactionsChannel } = useReactionsChannel(currentUserId, selectedUserId, fetchMessages);

  useEffect(() => {
    let messageChannel: ReturnType<typeof setupMessageChannel> | null = null;
    let reactionsChannel: ReturnType<typeof setupReactionsChannel> | null = null;

    const setupChannels = async () => {
      messageChannel = setupMessageChannel();
      reactionsChannel = setupReactionsChannel();
    };

    setupChannels().catch(error => {
      console.error("Error setting up channels:", error);
    });
    
    return () => {
      cleanupChannels();
    };
  }, [currentUserId, selectedUserId, setupMessageChannel, setupReactionsChannel, cleanupChannels]);
};
