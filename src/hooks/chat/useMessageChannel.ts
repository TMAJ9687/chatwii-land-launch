
import { useCallback } from 'react';
import { queryDocuments, subscribeToQuery } from '@/lib/firebase';
import { useChannelManagement } from './useChannelManagement';
import { MessageWithMedia } from '@/types/message';
import { isMockUser } from '@/utils/mockUsers';

export const useMessageChannel = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<MessageWithMedia[]>>
) => {
  const { registerChannel } = useChannelManagement();

  const setupMessageChannel = useCallback(() => {
    if (!currentUserId || !selectedUserId) return null;

    // We'll re-use the channel name pattern from Supabase for consistency
    const channelName = `private-messages-${currentUserId}-${selectedUserId}`;
    
    // Set up subscription to new messages
    const unsubscribe = subscribeToQuery(
      'messages',
      [
        { field: 'participants', operator: 'array-contains', value: currentUserId },
        { field: 'deleted_at', operator: '==', value: null }
      ],
      async (newMessages) => {
        // Filter for messages between the current user and selected user
        const filteredMessages = newMessages.filter(msg => 
          (msg.sender_id === currentUserId && msg.receiver_id === selectedUserId) || 
          (msg.sender_id === selectedUserId && msg.receiver_id === currentUserId)
        );
        
        if (filteredMessages.length === 0) return;
        
        // Skip mock user updates
        if (filteredMessages.some(msg => isMockUser(msg.sender_id))) return;
        
        // Process each message to get media and reactions
        const processedMessages = await Promise.all(
          filteredMessages.map(async (msg) => {
            // Fetch media for this message
            const mediaRecords = await queryDocuments('message_media', [
              { field: 'message_id', operator: '==', value: msg.id }
            ]);
            
            // Fetch reactions for this message
            const reactionRecords = await queryDocuments('message_reactions', [
              { field: 'message_id', operator: '==', value: msg.id }
            ]);
            
            const message: MessageWithMedia = {
              id: msg.id,
              content: msg.content || '',
              sender_id: msg.sender_id,
              receiver_id: msg.receiver_id,
              is_read: msg.is_read || false,
              created_at: msg.created_at,
              updated_at: msg.updated_at,
              deleted_at: msg.deleted_at,
              translated_content: msg.translated_content,
              language_code: msg.language_code,
              reply_to: msg.reply_to,
              media: mediaRecords.length > 0 ? {
                id: mediaRecords[0].id,
                message_id: mediaRecords[0].message_id,
                user_id: mediaRecords[0].user_id,
                file_url: mediaRecords[0].file_url,
                media_type: mediaRecords[0].media_type as any,
                created_at: mediaRecords[0].created_at
              } : null,
              reactions: reactionRecords.map(reaction => ({
                id: reaction.id,
                message_id: reaction.message_id,
                user_id: reaction.user_id,
                emoji: reaction.emoji,
                created_at: reaction.created_at
              }))
            };
            
            return message;
          })
        );
        
        // Update messages state
        setMessages(prev => {
          // Check if messages already exist in state to avoid duplicates
          const newMessagesFiltered = processedMessages.filter(
            newMsg => !prev.some(existingMsg => existingMsg.id === newMsg.id)
          );
          
          if (newMessagesFiltered.length === 0) return prev;
          return [...prev, ...newMessagesFiltered];
        });
      },
      'created_at',
      'asc'
    );
    
    return registerChannel(channelName, unsubscribe);
  }, [currentUserId, selectedUserId, setMessages, registerChannel]);

  return { setupMessageChannel };
};
