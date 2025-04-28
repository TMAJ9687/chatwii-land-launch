import { useEffect } from 'react';
import { useMessageChannel } from '@/hooks/chat/useMessageChannel';
import { useReactionsChannel } from '@/hooks/chat/useReactionsChannel';

export const useChannelSetup = (
  currentUserId,
  selectedUserId,
  setMessages,
  fetchMessages
) => {
  const { setupMessageChannel, cleanupMessageChannel } = useMessageChannel(
    currentUserId, selectedUserId, setMessages
  );

  const { setupReactionsListener, cleanupReactionListener } = useReactionsChannel(
    currentUserId, selectedUserId, fetchMessages
  );

  useEffect(() => {
    if (!currentUserId || !selectedUserId) return;

    cleanupMessageChannel();
    cleanupReactionListener();

    setupMessageChannel();
    setupReactionsListener();

    return () => {
      cleanupMessageChannel();
      cleanupReactionListener();
    };
  }, [currentUserId, selectedUserId, setupMessageChannel, setupReactionsListener, cleanupMessageChannel, cleanupReactionListener]);
};