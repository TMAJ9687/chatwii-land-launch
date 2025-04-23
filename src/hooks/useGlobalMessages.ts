
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const useGlobalMessages = (currentUserId: string | null) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [newMessageReceived, setNewMessageReceived] = useState<boolean>(false);

  // Function to fetch unread message count
  const fetchUnreadCount = async () => {
    if (!currentUserId) return;
    
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', currentUserId)
        .eq('is_read', false);
      
      if (error) throw error;
      
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark messages as read when opening a chat
  const markMessagesAsRead = async (senderId: string) => {
    if (!currentUserId) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', senderId)
        .eq('receiver_id', currentUserId)
        .eq('is_read', false);
      
      if (error) throw error;
      
      // Update the unread count after marking messages as read
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Set up global subscription for new messages
  useEffect(() => {
    if (!currentUserId) return;

    // Subscribe to any messages where the current user is the receiver
    const channel = supabase
      .channel('global-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        async (payload) => {
          console.log('New message received globally:', payload);
          
          // Extract the sender's information
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('nickname')
            .eq('id', payload.new.sender_id)
            .single();
            
          const senderName = senderProfile?.nickname || 'Someone';
          
          // Show toast notification for new message
          if (!window.selectedUserId || window.selectedUserId !== payload.new.sender_id) {
            toast(`New message from ${senderName}`);
            setNewMessageReceived(true);
            
            // Update the unread count
            fetchUnreadCount();
          }
        }
      )
      .subscribe();

    // Initial fetch of unread count
    fetchUnreadCount();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return { 
    unreadCount, 
    fetchUnreadCount, 
    markMessagesAsRead, 
    newMessageReceived,
    setNewMessageReceived
  };
};
