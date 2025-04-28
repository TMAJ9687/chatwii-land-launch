
import { useCallback, useEffect, useMemo } from 'react';
import { MessageWithMedia } from '@/types/message';
import { isMockUser } from '@/utils/mockUsers';
import { queryDocuments } from '@/lib/firebase';
import { useFirebaseListener } from '@/hooks/useFirebaseListener';

export const useMessageChannel = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<MessageWithMedia[]>>
) => {
  // Generate a stable conversation path
  const conversationPath = useMemo(() => {
    if (!currentUserId || !selectedUserId) return null;
    return `messages/${currentUserId}_${selectedUserId}`;
  }, [currentUserId, selectedUserId]);

  // Process messages when data changes
  const handleMessagesUpdate = useCallback(async (data: any) => {
    // Skip mock user updates
    if (!data || !selectedUserId || isMockUser(selectedUserId)) return;
    
    // Process each message to get media and reactions
    const processedMessages = await Promise.all(
      Object.values(data).map(async (msg: any) => {
        const mediaRecords = await queryDocuments('message_media', [
          { field: 'message_id', operator: '==', value: msg.id }
        ]);
        
        const reactionRecords = await queryDocuments('message_reactions', [
          { field: 'message_id', operator: '==', value: msg.id }
        ]);
        
        return {
          ...msg,
          media: mediaRecords.length > 0 ? {
            id: mediaRecords[0].id,
            message_id: mediaRecords[0].message_id,
            user_id: mediaRecords[0].user_id,
            file_url: mediaRecords[0].file_url,
            media_type: mediaRecords[0].media_type,
            created_at: mediaRecords[0].created_at
          } : null,
          reactions: reactionRecords
        };
      })
    );
    
    setMessages(processedMessages);
  }, [selectedUserId, setMessages]);

  // Set up listener with the useFirebaseListener hook
  const { isListening } = useFirebaseListener(
    conversationPath,
    handleMessagesUpdate,
    (error) => console.error('Message channel error:', error),
    !!currentUserId && !!selectedUserId,
    'message-channel'
  );

  return {
    isListening
  };
};
