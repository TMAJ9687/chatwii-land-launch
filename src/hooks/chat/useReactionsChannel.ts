
import { useCallback, useMemo } from 'react';
import { isMockUser } from '@/utils/mockUsers';
import { useFirebaseListener } from '@/hooks/useFirebaseListener';

export const useReactionsChannel = (
  currentUserId: string | null,
  selectedUserId: string | null,
  fetchMessages: () => void
) => {
  // Generate a stable conversation path
  const reactionPath = useMemo(() => {
    if (!currentUserId || !selectedUserId) return null;
    return `message_reactions/${currentUserId}_${selectedUserId}`;
  }, [currentUserId, selectedUserId]);

  // Handler for reaction updates
  const handleReactionUpdate = useCallback((data: any) => {
    // Skip mock user updates
    if (selectedUserId && isMockUser(selectedUserId)) return;
    
    // Only refresh messages when reactions change
    fetchMessages();
  }, [selectedUserId, fetchMessages]);

  // Set up listener with our new hook
  const { isListening } = useFirebaseListener(
    reactionPath,
    handleReactionUpdate,
    (error) => console.error('Reaction listener error:', error),
    !!currentUserId && !!selectedUserId,
    'reaction-channel'
  );

  return { 
    isListening
  };
};
