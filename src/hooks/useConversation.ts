import { ref, set } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/client';
import { getConversationId, getMessageChannelPath } from '@/utils/channelUtils';
import { v4 as uuidv4 } from 'uuid';
import { createDocument, queryDocuments } from '@/lib/firebase';
import { toast } from 'sonner';
import { isMockUser } from '@/utils/mockUsers';
import { insertTemporaryMessage } from '@/utils/messageUtils';
import { MessageWithMedia } from '@/types/message';
import { useMessageActions } from '@/hooks/useMessageActions';
import { useMessages } from '@/hooks/useMessages';
import { useGlobalMessages } from '@/hooks/useGlobalMessages';
import { useBot } from '@/hooks/useBot';

export const useConversation = (
  currentUserId: string | null,
  selectedUserId: string | null,
  currentUserRole: string,
  isVipUser: boolean
) => {
  // …omitted unrelated code for brevity…
  const { handleBotResponse } = useBot();
  const { fetchUnreadCount, markMessagesAsRead, updateSelectedUserId } = useGlobalMessages(currentUserId);

  const {
    messages,
    setMessages,
    fetchMessages,
    isLoading,
    error: messagesError,
    resetState
  } = useMessages(currentUserId, selectedUserId, currentUserRole, markMessagesAsRead);

  const handleSendMessage = useCallback(
    async (content: string, imageUrl?: string) => {
      if (!selectedUserId || !currentUserId) {
        toast.error("Cannot send message - missing user information");
        return false;
      }
      if (isMockUser(selectedUserId)) {
        toast.error("Demo VIP user - messaging disabled");
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
          content: content || (imageUrl ? '[Image]' : ''),
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
            media_type: imageUrl.includes('voice') ? 'voice' : 'image',
            created_at: now
          });
        }

        // 3) instant RTDB write
        const convId = getConversationId(currentUserId, selectedUserId)!;
        const rtdbPath = `${getMessageChannelPath(convId)}/${messageId}`;
        await set(ref(realtimeDb, rtdbPath), {
          id: messageId,
          content: content || (imageUrl ? '[Image]' : ''),
          sender_id: currentUserId,
          receiver_id: selectedUserId,
          is_read: false,
          created_at: now,
          media: imageUrl
            ? {
                id: `media-${messageId}`,
                message_id: messageId,
                user_id: currentUserId,
                file_url: imageUrl,
                media_type: imageUrl.includes('voice') ? 'voice' : 'image',
                created_at: now
              }
            : null,
          reactions: []
        });

        fetchUnreadCount();
        setTimeout(fetchMessages, 400);

        return true;
      } catch (err: any) {
        console.error('Error in handleSendMessage:', err);
        // roll back optimistic
        setMessages(cur => cur.filter(m => m.id !== tempId));
        toast.error(err.message?.includes('storage')
          ? "Media upload failed. Check your Storage rules."
          : "Failed to send message. Try again.");
        return false;
      }
    },
    [currentUserId, selectedUserId, setMessages, handleBotResponse, fetchUnreadCount, fetchMessages]
  );

  return {
    messages,
    isLoading,
    messagesError,
    handleSendMessage,
    // …other handlers…
  };
};
