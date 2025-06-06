
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { isMockUser } from '@/utils/mockUsers';
import { queryDocuments, updateDocument, subscribeToQuery } from '@/lib/firebase';

export const useGlobalMessages = (currentUserId: string | null) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [newMessageReceived, setNewMessageReceived] = useState<boolean>(false);
  const [currentSelectedUserId, setCurrentSelectedUserId] = useState<string | null>(null);
  
  // Use refs to prevent dependency issues and infinite renders
  const currentUserIdRef = useRef(currentUserId);
  const currentSelectedUserIdRef = useRef(currentSelectedUserId);
  
  // Update refs when props change
  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);
  
  useEffect(() => {
    currentSelectedUserIdRef.current = currentSelectedUserId;
  }, [currentSelectedUserId]);

  // Memoize fetchUnreadCount to prevent infinite loops
  const fetchUnreadCount = useCallback(async () => {
    const userId = currentUserIdRef.current;
    if (!userId) return;
    
    try {
      const unreadMessages = await queryDocuments('messages', [
        { field: 'receiver_id', operator: '==', value: userId },
        { field: 'is_read', operator: '==', value: false }
      ]);
      
      // Count valid messages
      const count = unreadMessages.filter(msg => msg && typeof msg === 'object').length;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Memoize markMessagesAsRead to prevent recreation on each render
  const markMessagesAsRead = useCallback(async (senderId: string) => {
    const userId = currentUserIdRef.current;
    if (!userId) return;
    
    // Skip database operations for mock user
    if (isMockUser(senderId)) {
      console.log('Skipping markMessagesAsRead for mock user');
      return;
    }
    
    try {
      // Get unread messages from this sender
      const unreadMessages = await queryDocuments('messages', [
        { field: 'sender_id', operator: '==', value: senderId },
        { field: 'receiver_id', operator: '==', value: userId },
        { field: 'is_read', operator: '==', value: false }
      ]);
      
      // Update each message to mark as read
      const updatePromises = unreadMessages.map(msg => {
        if (!msg || !msg.id) return Promise.resolve();
        return updateDocument('messages', msg.id, { is_read: true });
      });
      
      await Promise.all(updatePromises);

      // Update the unread count after marking messages as read
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [fetchUnreadCount]);

  // Set up global subscription for new messages using Firebase
  useEffect(() => {
    if (!currentUserId) return;

    let unsubscribe: (() => void) | null = null;
    
    const setupSubscription = async () => {
      // Subscribe to any messages where the current user is the receiver
      unsubscribe = subscribeToQuery(
        'messages',
        [
          { field: 'receiver_id', operator: '==', value: currentUserId },
          { field: 'is_read', operator: '==', value: false }
        ],
        async (newMessages) => {
          // Skip notifications for mock users
          const realMessages = newMessages.filter(msg => !isMockUser(msg.sender_id));
          if (realMessages.length === 0) return;
          
          // Process new messages
          for (const message of realMessages) {
            // Skip if we're already chatting with this sender
            if (currentSelectedUserIdRef.current === message.sender_id) continue;
            
            // Get sender information
            try {
              const senderProfiles = await queryDocuments('profiles', [
                { field: 'id', operator: '==', value: message.sender_id }
              ]);
              
              const senderProfile = senderProfiles.length > 0 ? senderProfiles[0] : null;
              
              // Safely get the nickname with proper type checking
              let senderName = 'Someone';
              if (senderProfile && typeof senderProfile === 'object') {
                // Explicitly check if the property exists and is a string
                if ('nickname' in senderProfile && typeof senderProfile.nickname === 'string') {
                  senderName = senderProfile.nickname;
                } else if ('nickname' in senderProfile) {
                  // Convert to string if it's not already a string
                  senderName = String(senderProfile.nickname);
                }
              }
              
              // Show toast notification
              toast(`New message from ${senderName}`);
            } catch (error) {
              console.error('Error processing message notification:', error);
            }
          }
          
          setNewMessageReceived(true);
          // Update the unread count
          fetchUnreadCount();
        }
      );
    };
    
    setupSubscription();

    // Initial fetch of unread count
    fetchUnreadCount();

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUserId, fetchUnreadCount]); // Reduced dependencies to prevent infinite updates

  // Update the current selected user ID
  const updateSelectedUserId = useCallback((userId: string | null) => {
    setCurrentSelectedUserId(userId);
    currentSelectedUserIdRef.current = userId;
  }, []);

  return { 
    unreadCount, 
    fetchUnreadCount, 
    markMessagesAsRead, 
    newMessageReceived,
    setNewMessageReceived,
    updateSelectedUserId
  };
};
