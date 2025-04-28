
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
    // Only set up new channels if user ID has changed
    if (!currentUserId || !selectedUserId) return;
    
    // Clean up previous connections if they exist and user ID has changed
    if (prevSelectedUserIdRef.current !== selectedUserId) {
      cleanupMessageChannel();
      cleanupReactionListener();
      
      // Set up new connections
      setupMessageChannel();
      setupReactionsListener();
      
      // Update the ref
      prevSelectedUserIdRef.current = selectedUserId;
    }

    return () => {
      cleanupMessageChannel();
      cleanupReactionListener();
    };
  }, [currentUserId, selectedUserId]); 
};
