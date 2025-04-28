
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

  // Cleanup function to remove any existing listeners
  const cleanupReactionListener = useCallback(() => {
    if (reactionListenerRef.current) {
      off(reactionListenerRef.current);
      reactionListenerRef.current = null;
      console.log('Cleaned up reaction listener');
    }
  }, []);

  // Setup Firebase realtime listener
  const setupReactionsListener = useCallback(() => {
    if (!currentUserId || !selectedUserId) return null;
    
    // Clean up any existing listener first
    cleanupReactionListener();
    
    try {
      // Create a reference to the specific conversation's reactions
      const conversationPath = `message_reactions/${currentUserId}_${selectedUserId}`;
      const reactionsRef = ref(realtimeDb, conversationPath);
      reactionListenerRef.current = reactionsRef;
      
      // Set up the value listener
      onValue(reactionsRef, (snapshot) => {
        // Skip mock user updates
        if (isMockUser(selectedUserId)) return;
        
        // Only refresh messages when reactions change
        fetchMessages();
      }, (error) => {
        console.error('Error listening to reactions:', error);
      });
      
      return reactionsRef;
    } catch (error) {
      console.error('Failed to setup reactions listener:', error);
      return null;
    }
  }, [currentUserId, selectedUserId, fetchMessages, cleanupReactionListener]);

  return { 
    setupReactionsListener,
    cleanupReactionListener
  };
};
