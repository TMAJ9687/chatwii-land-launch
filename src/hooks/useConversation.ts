// src/hooks/chat/useConversation.ts

import { useState, useCallback, useEffect } from 'react';
import { ref, set } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/client';
import { createDocument, queryDocuments } from '@/lib/firebase';
import { useMessages } from '@/hooks/useMessages';
import { useGlobalMessages } from '@/hooks/useGlobalMessages';
import { useMessageActions } from '@/hooks/useMessageActions';
import { useBot } from '@/hooks/useBot';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { isMockUser } from '@/utils/mockUsers';
import { insertTemporaryMessage } from '@/utils/messageUtils';
import { getConversationId, getMessagesPath } from '@/utils/channelUtils';
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

  const {
    messages,
    setMessages,
    fetchMessages,
    isLoading,
    error: messagesError,
    resetState
  } = useMessages(
    currentUserId,
    selectedUserId,
    currentUserRole,
    markMessagesAsRead
  );

  const { deleteConversation, isDeletingConversation } = useMessageActions(
    currentUserId || '',
    isVipUser
  );

  // keep global selected‐user in sync
  useEffect(() => {
    updateSelectedUserId(selectedUserId);
  }, [selectedUserId, updateSelectedUserId]);

  // reset & fetch messages on change
  useEffect(() => {
    if (selectedUserId && currentUserId) {
      setHasSelectedNewUser(true);
      resetState();
      fetchMessages();
    }
  }, [selectedUserId, currentUserId, fetchMessages, resetState]);

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
      resetState();
      await fetchMessages();
      toast.success('Conversation deleted');
    } catch (err) {
      console.error('Error deleting conversation:', err);
      toast.error('Failed to delete conversation');
    }
  }, [
    selectedUserId,
    currentUserId,
    isDeletingConversation,
    deleteConversation,
    fetchMessages,
    resetState
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

      const now = new Date().toISOString();
      const tempId = `temp-${uuidv4()}`;

      // 1) optimistic UI
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
      setMessages(cur => insertTemporaryMessage(cur, optimistic));

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
          is_read: false,
          created_at: now,
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
            created_at: now
          });
        }

        // 3) write into RTDB so your listeners pick it up immediately
        const convId = getConversationId(currentUserId, selectedUserId)!;
        const rtdbPath = `${getMessagesPath(currentUserId, selectedUserId)}/${messageId}`;
        await set(ref(realtimeDb, rtdbPath || ''), {
          id: messageId,
          content: optimistic.content,
          sender_id: currentUserId,
          receiver_id: selectedUserId,
          is_read: false,
          created_at: now,
          media: optimistic.media,
          reactions: []
        });

        fetchUnreadCount();
        setTimeout(fetchMessages, 400);
        return true;
      } catch (err: any) {
        console.error('Error in handleSendMessage:', err);
        // rollback optimistic
        setMessages(cur => cur.filter(m => m.id !== tempId));
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
      setMessages,
      handleBotResponse,
      fetchUnreadCount,
      fetchMessages
    ]
  );

  return {
    messages,
    isLoading,
    messagesError,
    handleSendMessage,
    handleDeleteConversation,
    isDeletingConversation,
    hasSelectedNewUser
  };
};
