import { useEffect } from 'react';
import { useMessageChannel } from '@/hooks/chat/useMessageChannel';
import { useReactionsChannel } from '@/hooks/chat/useReactionsChannel';

export const useChannelSetup = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<any[]>>,
  fetchMessages: () => void
) => {
  const { setupMessageChannel, cleanupMessageChannel } = useMessageChannel(
    currentUserId, selectedUserId, setMessages
  );
  const { setupReactionsListener, cleanupReactionListener } = useReactionsChannel(
    currentUserId, selectedUserId, fetchMessages
  );

  useEffect(() => {
    if (!currentUserId || !selectedUserId) return;
    setupMessageChannel();
    setupReactionsListener();

    return () => {
      cleanupMessageChannel();
      cleanupReactionListener();
    };
  }, [currentUserId, selectedUserId]); // ONLY depend on user IDs!
};
