
import { useEffect, useRef } from 'react';
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
  
  const prevSelectedUserIdRef = useRef<string | null>(null);

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

