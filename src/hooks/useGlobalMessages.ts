
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { isMockUser } from '@/utils/mockUsers';
import { queryDocuments, updateDocument, subscribeToQuery } from '@/lib/firebase';

export const useGlobalMessages = (currentUserId: string | null) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [newMessageReceived, setNewMessageReceived] = useState<boolean>(false);
  const [currentSelectedUserId, setCurrentSelectedUserId] = useState<string | null>(null);

  // Function to fetch unread message count
  const fetchUnreadCount = async () => {
    if (!currentUserId) return;
    try {
      const unreadMessages = await queryDocuments('messages', [
        { field: 'receiver_id', operator: '==', value: currentUserId },
        { field: 'is_read', operator: '==', value: false }
      ]);
      
      // Count valid messages
      const count = unreadMessages.filter(msg => msg && typeof msg === 'object').length;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark messages as read when opening a chat
  const markMessagesAsRead = async (senderId: string) => {
    if (!currentUserId) return;
    
    // Skip database operations for mock user
    if (isMockUser(senderId)) {
      console.log('Skipping markMessagesAsRead for mock user');
      return;
    }
    
    try {
      // Get unread messages from this sender
      const unreadMessages = await queryDocuments('messages', [
        { field: 'sender_id', operator: '==', value: senderId },
        { field: 'receiver_id', operator: '==', value: currentUserId },
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
  };

  // Set up global subscription for new messages using Firebase
  useEffect(() => {
    if (!currentUserId) return;

    // Subscribe to any messages where the current user is the receiver
    const unsubscribe = subscribeToQuery(
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
          if (currentSelectedUserId === message.sender_id) continue;
          
          // Get sender information
          const senderProfiles = await queryDocuments('profiles', [
            { field: 'id', operator: '==', value: message.sender_id }
          ]);
          
          const senderProfile = senderProfiles.length > 0 ? senderProfiles[0] : null;
          
          // Safely get the nickname - handle if profile schema doesn't match expectations
          let senderName = 'Someone';
          if (senderProfile && typeof senderProfile === 'object') {
            // Check if nickname exists on the profile object
            if ('nickname' in senderProfile && senderProfile.nickname) {
              senderName = senderProfile.nickname;
            }
          }
          
          // Show toast notification
          toast(`New message from ${senderName}`);
        }
        
        setNewMessageReceived(true);
        // Update the unread count
        fetchUnreadCount();
      }
    );

    // Initial fetch of unread count
    fetchUnreadCount();

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUserId, currentSelectedUserId]);

  // Update the current selected user ID
  const updateSelectedUserId = (userId: string | null) => {
    setCurrentSelectedUserId(userId);
  };

  return { 
    unreadCount, 
    fetchUnreadCount, 
    markMessagesAsRead, 
    newMessageReceived,
    setNewMessageReceived,
    updateSelectedUserId
  };
};
