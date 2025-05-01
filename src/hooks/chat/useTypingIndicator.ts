
import { useState, useEffect, useRef, useCallback } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, onValue, set, off } from 'firebase/database';
import { getTypingStatusPath, getConversationId } from '@/utils/channelUtils';
import { isMockUser } from '@/utils/mockUsers';

interface TypingStatus {
  isTyping: boolean;
  userId: string;
  timestamp: number;
}

export function useTypingIndicator(
  currentUserId: string | null,
  selectedUserId: string | null,
  isVipUser: boolean = false
) {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingListenerRef = useRef<(() => void) | null>(null);

  // Clear any existing typing timeout
  const clearTypingTimeout = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  // Clean up typing listener
  const clearTypingListener = useCallback(() => {
    if (typingListenerRef.current) {
      typingListenerRef.current();
      typingListenerRef.current = null;
    }
  }, []);

  // Broadcast current user's typing status
  const broadcastTypingStatus = useCallback((isUserTyping: boolean) => {
    if (!currentUserId || !selectedUserId || isMockUser(selectedUserId)) {
      return;
    }

    const conversationId = getConversationId(currentUserId, selectedUserId);
    if (!conversationId) return;

    const path = getTypingStatusPath(conversationId);
    const typingRef = ref(realtimeDb, `${path}/${currentUserId}`);

    clearTypingTimeout();

    // Set typing status in database
    set(typingRef, {
      isTyping: isUserTyping,
      userId: currentUserId,
      timestamp: Date.now()
    }).catch(console.error);

    // Auto-clear typing status after 5 seconds
    if (isUserTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        set(typingRef, {
          isTyping: false,
          userId: currentUserId,
          timestamp: Date.now()
        }).catch(console.error);
      }, 5000);
    }
  }, [currentUserId, selectedUserId, clearTypingTimeout]);

  // Listen for other user's typing status
  useEffect(() => {
    if (!currentUserId || !selectedUserId || isMockUser(selectedUserId)) {
      return;
    }

    const conversationId = getConversationId(currentUserId, selectedUserId);
    if (!conversationId) return;

    // Clean up existing listener first
    clearTypingListener();

    const path = getTypingStatusPath(conversationId);
    const otherUserTypingRef = ref(realtimeDb, `${path}/${selectedUserId}`);

    // Set up new listener
    const unsubscribe = onValue(otherUserTypingRef, (snapshot) => {
      const typingData = snapshot.val() as TypingStatus | null;
      
      if (typingData && typingData.isTyping) {
        // Check if typing status is recent (within last 10 seconds)
        const isRecent = Date.now() - typingData.timestamp < 10000;
        setIsTyping(isRecent);
        
        // Auto-clear typing status after 10 seconds if no updates
        clearTimeout(typingTimeoutRef.current!);
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 10000);
      } else {
        setIsTyping(false);
      }
    });

    typingListenerRef.current = unsubscribe;

    return () => {
      clearTypingListener();
      clearTypingTimeout();
    };
  }, [currentUserId, selectedUserId, clearTypingListener, clearTypingTimeout]);

  return {
    isTyping,
    setIsTyping: broadcastTypingStatus,
    broadcastTypingStatus
  };
}
