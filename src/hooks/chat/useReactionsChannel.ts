import { useCallback, useRef } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, onValue, off } from 'firebase/database';
import { isMockUser } from '@/utils/mockUsers';

export const useReactionsChannel = (
  currentUserId: string | null,
  selectedUserId: string | null,
  fetchMessages: () => void
) => {
  const reactionListenerRef = useRef<any>(null);

  // Cleanup for reactions
  const cleanupReactionListener = useCallback(() => {
    if (reactionListenerRef.current) {
      off(reactionListenerRef.current);
      reactionListenerRef.current = null;
    }
  }, []);

  // Setup reactions listener (called when conversation changes)
  const setupReactionsListener = useCallback(() => {
    if (!currentUserId || !selectedUserId) return;
    cleanupReactionListener();

    const conversationPath = `message_reactions/${currentUserId}_${selectedUserId}`;
    const reactionsRef = ref(realtimeDb, conversationPath);
    reactionListenerRef.current = reactionsRef;

    onValue(reactionsRef, () => {
      if (isMockUser(selectedUserId)) return;
      fetchMessages();
    });
  }, [currentUserId, selectedUserId, fetchMessages, cleanupReactionListener]);

  return {
    setupReactionsListener,
    cleanupReactionListener
  };
};
