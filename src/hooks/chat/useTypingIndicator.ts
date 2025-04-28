
import { useState, useCallback, useEffect, useMemo } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, set, serverTimestamp } from 'firebase/database';
import { debounce } from 'lodash';
import { useFirebaseListener } from '@/hooks/useFirebaseListener';

export const useTypingIndicator = (
  currentUserId: string | null,
  selectedUserId: string | null,
  isVipUser: boolean
) => {
  const [isTyping, setIsTyping] = useState(false);
  
  // Generate a stable typing path
  const typingPath = useMemo(() => {
    if (!currentUserId || !selectedUserId) return null;
    return `typing/${currentUserId}_${selectedUserId}`;
  }, [currentUserId, selectedUserId]);
  
  // Handler for typing status updates
  const handleTypingUpdate = useCallback((data: any) => {
    if (data && data.userId === selectedUserId) {
      setIsTyping(data.isTyping);
    }
  }, [selectedUserId]);

  // Set up Firebase listener for typing events
  useFirebaseListener(
    typingPath, 
    handleTypingUpdate,
    undefined,
    isVipUser && !!currentUserId && !!selectedUserId,
    'typing-indicator'
  );

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
    broadcastTypingStatus
  };
};
