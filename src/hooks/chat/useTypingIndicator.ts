import { useState, useCallback, useEffect } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, set, serverTimestamp } from 'firebase/database';
import { debounce } from 'lodash';
import { getTypingStatusPath, getConversationId } from '@/utils/channelUtils';
import { firebaseListeners } from '@/services/FirebaseListenerService';

export const useTypingIndicator = (
  currentUserId: string | null,
  selectedUserId: string | null,
  isVipUser: boolean
) => {
  const [isTyping, setIsTyping] = useState(false);
  
  // Set up Firebase listener for typing events
  useEffect(() => {
    if (!isVipUser || !selectedUserId || !currentUserId) return;
    
    // Generate a stable listener key
    const listenerKey = `typing-${currentUserId}-${selectedUserId}`;
    
    // Get path for typing status
    const typingPath = getTypingStatusPath(currentUserId, selectedUserId);
    if (!typingPath) return;
    
    // Use the FirebaseListenerService to handle subscription
    firebaseListeners.subscribe(
      listenerKey,
      typingPath,
      (data: { userId: string; isTyping: boolean; timestamp: any } | null) => {
        if (data && data.userId === selectedUserId) {
          setIsTyping(data.isTyping);
        }
      }
    );
    
    return () => {
      firebaseListeners.unsubscribe(listenerKey);
    };
  }, [selectedUserId, currentUserId, isVipUser]);

  // Auto-reset typing indicator after inactivity
  useEffect(() => {
    if (!isTyping || !isVipUser) return;
    
    const timeout = setTimeout(() => {
      setIsTyping(false);
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [isTyping, isVipUser]);

  // Function to broadcast typing status
  const broadcastTypingStatus = useCallback(
    debounce((isTyping: boolean) => {
      if (!isVipUser || !selectedUserId || !currentUserId) return;
      
      // Get path for typing status
      const typingPath = getTypingStatusPath(selectedUserId, currentUserId);
      if (!typingPath) return;
      
      const typingRef = ref(realtimeDb, typingPath);
      
      set(typingRef, {
        userId: currentUserId,
        isTyping,
        timestamp: serverTimestamp()
      }).catch(error => {
        console.error('Error broadcasting typing status:', error);
      });
    }, 300),
    [selectedUserId, currentUserId, isVipUser]
  );

  return {
    isTyping,
    setIsTyping,
    broadcastTypingStatus
  };
};
