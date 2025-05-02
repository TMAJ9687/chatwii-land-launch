// src/hooks/chat/useConversation.ts

import { useState, useCallback, useEffect } from 'react';
import { ref, set } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/client';
import { createDocument, queryDocuments } from '@/lib/firebase';
import { useConversationMessages } from '@/hooks/chat/useConversationMessages';
import { useGlobalMessages } from '@/hooks/useGlobalMessages';
import { useMessageActions } from '@/hooks/useMessageActions';
import { useBot } from '@/hooks/useBot';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { isMockUser } from '@/utils/mockUsers';
import { insertTemporaryMessage } from '@/utils/messageUtils';
import { getConversationId } from '@/utils/channelUtils';
import type { MessageWithMedia } from '@/types/message';

export const useConversation = (
  currentUserId: string | null,
  selectedUserId: string | null,
  currentUserRole: string,
  isVipUser: boolean
) => {
  const [hasSelectedNewUser, setHasSelectedNewUser] = useState(false);
  const { handleBotResponse } = useBot();
  const { fetchUnreadCount, markMessagesAsRead, updateSelectedUserId } =
    useGlobalMessages(currentUserId);

  // Use the new useConversationMessages hook
  const {
    messages,
    isLoading,
    error: messagesError,
  } = useConversationMessages(currentUserId, selectedUserId);

  const [localMessages, setLocalMessages] = useState<MessageWithMedia[]>([]);

  // Sync messages from the hook to local state
  useEffect(() => {
    if (messages && messages.length > 0) {
      setLocalMessages(messages);
      
      // Mark messages as read when we receive them
      if (selectedUserId) {
        markMessagesAsRead(selectedUserId);
      }
    }
  }, [messages, selectedUserId, markMessagesAsRead]);

  const { deleteConversation, isDeletingConversation } = useMessageActions(
    currentUserId || '',
    isVipUser
  );

  // keep global selected-user in sync
  useEffect(() => {
    updateSelectedUserId(selectedUserId);
  }, [selectedUserId, updateSelectedUserId]);

  // reset & update selected user state
  useEffect(() => {
    if (selectedUserId && currentUserId) {
      setHasSelectedNewUser(true);
    }
  }, [selectedUserId, currentUserId]);

  useEffect(() => {
    if (!hasSelectedNewUser) return;
    const t = setTimeout(() => setHasSelectedNewUser(false), 1_000);
    return () => clearTimeout(t);
  }, [hasSelectedNewUser]);

  useEffect(() => {
    if (messagesError && !hasSelectedNewUser) {
      console.error('Message error:', messagesError);
      toast.error('Error loading messages. Please try again.');
    }
  }, [messagesError, hasSelectedNewUser]);

  const handleDeleteConversation = useCallback(async () => {
    if (!selectedUserId || !currentUserId || isDeletingConversation) return;
    try {
      await deleteConversation(selectedUserId);
      setLocalMessages([]);
      toast.success('Conversation deleted');
    } catch (err) {
      console.error('Error deleting conversation:', err);
      toast.error('Failed to delete conversation');
    }
  }, [
    selectedUserId,
    currentUserId,
    isDeletingConversation,
    deleteConversation
  ]);

  const handleSendMessage = useCallback(
    async (content: string, imageUrl?: string) => {
      if (!selectedUserId || !currentUserId) {
        toast.error('Cannot send message – missing user information');
        return false;
      }
      if (isMockUser(selectedUserId)) {
        toast.error('Demo VIP user – messaging disabled');
        return false;
      }

      const now = new Date();
      const nowISO = now.toISOString();
      const tempId = `temp-${uuidv4()}`;
      
      // Calculate expiration time based on VIP status
      const expireHours = isVipUser ? 8 : 1;
      const expireAt = new Date(now.getTime() + expireHours * 60 * 60 * 1000);

      // Create conversation ID
      const conversationId = getConversationId(currentUserId, selectedUserId);

      // 1) optimistic UI
      const optimistic: MessageWithMedia = {
        id: tempId,
        content: content || (imageUrl ? '[Image]' : ''),
        sender_id: currentUserId,
        receiver_id: selectedUserId,
        created_at: nowISO,
        is_read: false,
        media: imageUrl
          ? {
              id: `temp-media-${uuidv4()}`,
              message_id: tempId,
              user_id: currentUserId,
              file_url: imageUrl,
              media_type: imageUrl.includes('voice') ? 'voice' : 'image',
              created_at: nowISO
            }
          : null,
        reactions: []
      };
      setLocalMessages(cur => insertTemporaryMessage(cur, optimistic));

      try {
        // 2) write to Firestore
        const profiles = await queryDocuments('profiles', [
          { field: 'id', operator: '==', value: selectedUserId }
        ]);
        const recipientProfile = profiles?.[0] || null;

        const messageId = await createDocument('messages', {
          content: optimistic.content,
          sender_id: currentUserId,
          receiver_id: selectedUserId,
          conversation_id: conversationId, // Add conversation_id
          is_read: false,
          created_at: nowISO,
          expire_at: expireAt, // Add expiration time
          participants: [currentUserId, selectedUserId]
        });

        if (recipientProfile?.role === 'bot' && content) {
          handleBotResponse(selectedUserId, currentUserId, content);
        }

        if (imageUrl && messageId) {
          await createDocument('message_media', {
            message_id: messageId,
            user_id: currentUserId,
            file_url: imageUrl,
            media_type: optimistic.media!.media_type,
            created_at: nowISO
          });
        }

        fetchUnreadCount();
        return true;
      } catch (err: any) {
        console.error('Error in handleSendMessage:', err);
        // rollback optimistic
        setLocalMessages(cur => cur.filter(m => m.id !== tempId));
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
      setLocalMessages,
      handleBotResponse,
      fetchUnreadCount,
      isVipUser
    ]
  );

  return {
    messages: localMessages,
    setMessages: setLocalMessages,
    isLoading,
    messagesError,
    handleSendMessage,
    handleDeleteConversation,
    isDeletingConversation,
    hasSelectedNewUser
  };
};
