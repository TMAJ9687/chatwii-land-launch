
import { useState, useCallback, useEffect } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, set, onValue, off, serverTimestamp } from 'firebase/database';
import { debounce } from 'lodash';
import { useChannelManagement } from './useChannelManagement';

export const useTypingIndicator = (
  currentUserId: string | null,
  selectedUserId: string | null,
  isVipUser: boolean
) => {
  const [isTyping, setIsTyping] = useState(false);
  const { registerChannel } = useChannelManagement();
  
  // Generate a stable channel name
  const getTypingChannelName = useCallback(() => {
    if (!currentUserId || !selectedUserId) return '';
    return `typing:${currentUserId}-${selectedUserId}`;
  }, [currentUserId, selectedUserId]);
  
  // Set up Firebase listener for typing events
  useEffect(() => {
    if (!isVipUser || !selectedUserId || !currentUserId) return;
    
    const channelName = getTypingChannelName();
    const typingRef = ref(realtimeDb, `typing/${currentUserId}_${selectedUserId}`);
    
    const unsubscribe = onValue(typingRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.userId === selectedUserId) {
        setIsTyping(data.isTyping);
      }
    });
    
    registerChannel(channelName, typingRef);
    
    return () => {
      off(typingRef);
    };
  }, [selectedUserId, currentUserId, isVipUser, getTypingChannelName, registerChannel]);

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
      
      const typingRef = ref(realtimeDb, `typing/${currentUserId}_${selectedUserId}`);
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
