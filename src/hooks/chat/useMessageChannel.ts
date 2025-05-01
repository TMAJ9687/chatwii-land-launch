
import { useRef, useState, useEffect } from 'react';
import { useChannel } from './useChannel';
import { getMessagesPath } from '@/utils/channelPath';
import { MessageWithMedia } from '@/types/message';
import { isMockUser } from '@/utils/mockUsers';

export const useMessageChannel = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<MessageWithMedia[]>>
) => {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const latestDataRef = useRef<any>(null);
  
  // Get messages path
  const messagesPath = !isMockUser(selectedUserId || '') && currentUserId && selectedUserId ? 
    getMessagesPath(currentUserId, selectedUserId) : null;
  
  // Process raw message data
  const processMessages = (data: any): MessageWithMedia[] => {
    if (!data) return [];
    
    try {
      const arr = Object.values(data);
      return arr
        .filter((m: any) => m && typeof m === 'object' && m.id)
        .map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          is_read: msg.is_read,
          created_at: msg.created_at,
          media: msg.media || null,
          reactions: msg.reactions || [],
          updated_at: msg.updated_at || null,
          deleted_at: msg.deleted_at || null,
          translated_content: msg.translated_content || null,
          language_code: msg.language_code || null,
          reply_to: msg.reply_to || null
        }));
    } catch (e) {
      console.error('Error processing messages:', e);
      return [];
    }
  };
  
  // Use our channel hook
  const { 
    data, 
    status,
    reconnect 
  } = useChannel<MessageWithMedia[]>(
    'messages', 
    messagesPath,
    true,
    processMessages
  );
  
  // Update state references and messages
  useEffect(() => {
    latestDataRef.current = data;
    setConnectionStatus(status === 'connected' ? 'connected' : 
                        status === 'connecting' ? 'connecting' : 'disconnected');
    
    if (data) {
      setMessages(data);
    } else if (!messagesPath) {
      setMessages([]);
    }
  }, [data, status, messagesPath, setMessages]);

  return {
    latestData: latestDataRef.current,
    connectionStatus,
    reconnect
  };
};
