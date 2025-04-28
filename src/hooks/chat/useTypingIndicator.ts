
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  
  // Set up channel to listen for typing events
  useEffect(() => {
    if (!isVipUser || !selectedUserId || !currentUserId) return;
    
    const channelName = getTypingChannelName();
    const typingChannel = supabase.channel(channelName);
    
    typingChannel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId === selectedUserId) {
          setIsTyping(payload.isTyping);
        }
      })
      .subscribe((status) => {
        console.log(`Typing channel status: ${status}`);
      });
      
    registerChannel(channelName, typingChannel);
    
    return () => {
      supabase.removeChannel(typingChannel);
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
      
      const channelName = getTypingChannelName();
      supabase.channel(channelName)
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: currentUserId, isTyping }
        })
        .then((status) => {
          console.log('Broadcast typing status:', status);
        })
        .catch((error) => {
          console.error('Error broadcasting typing status:', error);
        });
    }, 300),
    [selectedUserId, currentUserId, isVipUser, getTypingChannelName]
  );

  return {
    isTyping,
    setIsTyping,
    broadcastTypingStatus
  };
};
