
import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useChannelManagement } from './useChannelManagement';
import { isMockUser } from '@/utils/mockUsers';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, onValue, off } from 'firebase/database';

export const useReactionsChannel = (
  currentUserId: string | null,
  selectedUserId: string | null,
  fetchMessages: () => void
) => {
  const { registerChannel } = useChannelManagement();
  const reactionListenerRef = useRef<any>(null);

  // Cleanup function to remove any existing listeners
  const cleanupReactionListener = useCallback(() => {
    if (reactionListenerRef.current) {
      off(reactionListenerRef.current);
      reactionListenerRef.current = null;
      console.log('Cleaned up reaction listener');
    }
  }, []);

  // Setup Firebase realtime listener instead of Supabase channel
  const setupReactionsListener = useCallback(() => {
    if (!currentUserId || !selectedUserId) return null;
    
    // Clean up any existing listener first
    cleanupReactionListener();
    
    try {
      console.log('Setting up reactions listener with Firebase');
      
      // Create a reference to the reactions path in the database
      // This is a simplified approach - in a production app, you might want
      // to structure this differently based on your data model
      const reactionsRef = ref(realtimeDb, 'message_reactions');
      reactionListenerRef.current = reactionsRef;
      
      // Set up the value listener
      onValue(reactionsRef, (snapshot) => {
        // Skip mock user updates
        if (isMockUser(selectedUserId)) return;
        
        // Only refresh messages when reactions change and for the current selected user
        if (selectedUserId) {
          fetchMessages();
        }
      }, (error) => {
        console.error('Error listening to reactions:', error);
      });
      
      return reactionsRef;
    } catch (error) {
      console.error('Failed to setup reactions listener:', error);
      return null;
    }
  }, [currentUserId, selectedUserId, fetchMessages, cleanupReactionListener]);

  // Return the cleanup function so it can be used in useChannelSetup
  return { 
    setupReactionsListener,
    cleanupReactionListener
  };
};
