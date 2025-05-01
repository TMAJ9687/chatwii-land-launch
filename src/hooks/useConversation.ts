
// src/hooks/useConversation.ts

import { useState, useCallback } from 'react';
import { ref, set } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/client';
import { createDocument, queryDocuments } from '@/lib/firebase';
import { useMessageActions } from '@/hooks/useMessageActions';
import { useBot } from '@/hooks/useBot';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { isMockUser } from '@/utils/mockUsers';
import { insertTemporaryMessage } from '@/utils/messageUtils';
import { getConversationId, getMessageChannelPath } from '@/utils/channelUtils';
import type { MessageWithMedia } from '@/types/message';
import { useConnection } from '@/contexts/ConnectionContext';

export const useConversation = (
  currentUserId: string | null,
  selectedUserId: string | null,
  currentUserRole: string,
  isVipUser: boolean
) => {
  const { isConnected } = useConnection();
  const { handleBotResponse } = useBot();
  const { deleteConversation, isDeletingConversation } = useMessageActions(
    currentUserId || '',
    isVipUser
  );

  // Handle message deletion
  const handleDeleteConversation = useCallback(async () => {
    if (!selectedUserId || !currentUserId || isDeletingConversation) return;
    
    try {
      await deleteConversation(selectedUserId);
      toast.success('Conversation deleted');
      return true;
    } catch (err) {
      console.error('Error deleting conversation:', err);
      toast.error('Failed to delete conversation');
      return false;
    }
  }, [
    selectedUserId,
    currentUserId,
    isDeletingConversation,
    deleteConversation
  ]);

  // Handle sending messages
  const handleSendMessage = useCallback(
    async (content: string, imageUrl?: string, setMessages?: React.Dispatch<React.SetStateAction<MessageWithMedia[]>>) => {
      if (!selectedUserId || !currentUserId) {
        toast.error('Cannot send message – missing user information');
        return false;
      }
      
      if (isMockUser(selectedUserId)) {
        toast.error('Demo VIP user – messaging disabled');
        return false;
      }

      if (!isConnected) {
        toast.error('Cannot send message – you are offline');
        return false;
      }

      const now = new Date().toISOString();
      const tempId = `temp-${uuidv4()}`;

      // Create optimistic message for UI
      const optimistic: MessageWithMedia = {
        id: tempId,
        content: content || (imageUrl ? '[Image]' : ''),
        sender_id: currentUserId,
        receiver_id: selectedUserId,
        created_at: now,
        is_read: false,
        media: imageUrl
          ? {
              id: `temp-media-${uuidv4()}`,
              message_id: tempId,
              user_id: currentUserId,
              file_url: imageUrl,
              media_type: imageUrl.includes('voice') ? 'voice' : 'image',
              created_at: now
            }
          : null,
        reactions: []
      };
      
      // Update UI with optimistic message if setMessages is provided
      if (setMessages) {
        setMessages(cur => insertTemporaryMessage(cur, optimistic));
      }

      try {
        // Get recipient info
        const profiles = await queryDocuments('profiles', [
          { field: 'id', operator: '==', value: selectedUserId }
        ]);
        const recipientProfile = profiles?.[0] || null;

        // Create message in Firestore
        const messageId = await createDocument('messages', {
          content: optimistic.content,
          sender_id: currentUserId,
          receiver_id: selectedUserId,
          is_read: false,
          created_at: now,
          participants: [currentUserId, selectedUserId]
        });

        // Handle bot response
        if (recipientProfile?.role === 'bot' && content) {
          handleBotResponse(selectedUserId, currentUserId, content);
        }

        // Upload media if present
        if (imageUrl && messageId) {
          await createDocument('message_media', {
            message_id: messageId,
            user_id: currentUserId,
            file_url: imageUrl,
            media_type: optimistic.media!.media_type,
            created_at: now
          });
        }

        // Write to RTDB for real-time updates
        const convId = getConversationId(currentUserId, selectedUserId)!;
        const rtdbPath = `${getMessageChannelPath(convId)}/${messageId}`;
        await set(ref(realtimeDb, rtdbPath), {
          id: messageId,
          content: optimistic.content,
          sender_id: currentUserId,
          receiver_id: selectedUserId,
          is_read: false,
          created_at: now,
          media: optimistic.media,
          reactions: []
        });

        return true;
      } catch (err: any) {
        console.error('Error in handleSendMessage:', err);
        
        // Rollback optimistic update
        if (setMessages) {
          setMessages(cur => cur.filter(m => m.id !== tempId));
        }
        
        toast.error(
          err.message?.includes('storage')
            ? 'Media upload failed – check Storage rules.'
            : 'Failed to send message. Try again.'
        );
        return false;
      }
    },
    [
      currentUserId,
      selectedUserId,
      isConnected,
      handleBotResponse
    ]
  );

  return {
    handleSendMessage,
    handleDeleteConversation,
    isDeletingConversation
  };
};
