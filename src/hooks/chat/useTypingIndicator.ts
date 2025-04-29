
import { useState, useCallback, useEffect } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, set, serverTimestamp } from 'firebase/database';
import { debounce } from 'lodash';
import { useChannelManager } from './useChannelManager';

export const useTypingIndicator = (
  currentUserId: string | null,
  selectedUserId: string | null,
  isVipUser: boolean
) => {
  const [isTyping, setIsTyping] = useState(false);
  const { listenToChannel, getConversationId } = useChannelManager();
  
  // Set up Firebase listener for typing events
  useEffect(() => {
    if (!isVipUser || !selectedUserId || !currentUserId) return;
    
    const convId = getConversationId(currentUserId, selectedUserId);
    const channelName = `typing_${convId}`;
    const typingPath = `typing/${convId}`;
    
    const cleanup = listenToChannel(channelName, typingPath, (data) => {
      if (data && data.userId === selectedUserId) {
        setIsTyping(data.isTyping);
      }
    });
    
    return cleanup;
  }, [selectedUserId, currentUserId, isVipUser, getConversationId, listenToChannel]);

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
      
      const convId = getConversationId(currentUserId, selectedUserId);
      const typingRef = ref(realtimeDb, `typing/${convId}`);
      
      set(typingRef, {
        userId: currentUserId,
        isTyping,
        timestamp: serverTimestamp()
      }).catch(error => {
        console.error('Error broadcasting typing status:', error);
      });
    }, 300),
    [selectedUserId, currentUserId, isVipUser, getConversationId]
  );

  return {
    isTyping,
    setIsTyping,
    broadcastTypingStatus
  };
};
