
import { useCallback, useState } from 'react';
import { useChannel } from './useChannel';
import { MessageWithMedia } from '@/types/message';
import { getMessageChannelPath } from '@/utils/channelUtils';
import { isMockUser } from '@/utils/mockUsers';
import { syncService } from '@/services/syncService';
import { toast } from 'sonner';

export function useMessageChannel(
  currentUserId: string | null,
  selectedUserId: string | null,
  conversationId: string | null
) {
  const [messages, setMessages] = useState<MessageWithMedia[]>([]);
  
  // Skip for mock users
  const enabled = !!currentUserId && 
                  !!selectedUserId && 
                  !!conversationId && 
                  !isMockUser(selectedUserId);
  
  // Get channel path
  const channelPath = enabled ? getMessageChannelPath(conversationId) : null;
  
  // Process messages helper function
  const processMessages = useCallback((data: any): MessageWithMedia[] => {
    if (!data) return [];
    
    try {
      return Object.values(data)
        .filter((m: any) => m && typeof m === 'object' && m.id)
        .map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          is_read: msg.is_read,
          created_at: msg.created_at,
          media: msg.media || null,
          reactions: msg.reactions || []
        }));
    } catch (e) {
      console.error('Error processing messages:', e);
      return [];
    }
  }, []);
  
  // Handle channel data updates
  const handleChannelData = useCallback((data: any) => {
    const processed = processMessages(data);
    setMessages(processed);
  }, [processMessages]);
  
  // Handle channel errors
  const handleChannelError = useCallback((error: Error) => {
    toast.error('Error loading messages');
  }, []);
  
  // Use our generic channel hook
  const { isLoading, error, refresh } = useChannel(
    channelPath,
    enabled,
    handleChannelError
  );
  
  // Trigger sync when needed
  const sync = useCallback(() => {
    if (currentUserId && selectedUserId) {
      syncService.queueSync(currentUserId, selectedUserId).catch(console.error);
    }
  }, [currentUserId, selectedUserId]);
  
  // Reconnect function
  const reconnect = useCallback(() => {
    sync();
    refresh();
  }, [sync, refresh]);
  
  return {
    messages,
    setMessages,
    isLoading,
    error,
    reconnect,
    sync
  };
}
