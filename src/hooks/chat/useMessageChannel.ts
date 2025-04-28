import { useCallback, useRef } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, onValue, off } from 'firebase/database';
import { MessageWithMedia } from '@/types/message';
import { isMockUser } from '@/utils/mockUsers';
import { queryDocuments } from '@/lib/firebase';

// Messages listener hook for one conversation
export const useMessageChannel = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<MessageWithMedia[]>>
) => {
  const messageListenerRef = useRef<any>(null);

  // Clean up function for messages
  const cleanupMessageChannel = useCallback(() => {
    if (messageListenerRef.current) {
      off(messageListenerRef.current);
      messageListenerRef.current = null;
    }
  }, []);

  // Setup messages listener (called when conversation changes)
  const setupMessageChannel = useCallback(() => {
    if (!currentUserId || !selectedUserId) return;
    cleanupMessageChannel();

    const conversationPath = `messages/${currentUserId}_${selectedUserId}`;
    const messagesRef = ref(realtimeDb, conversationPath);
    messageListenerRef.current = messagesRef;

    onValue(messagesRef, async (snapshot) => {
      if (isMockUser(selectedUserId)) return;
      const data = snapshot.val();
      if (!data) return;

      // Get media & reactions for each message
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
            media: mediaRecords.length > 0 ? mediaRecords[0] : null,
            reactions: reactionRecords || []
          };
        })
      );

      setMessages(processedMessages);
    });
  }, [currentUserId, selectedUserId, setMessages, cleanupMessageChannel]);

  return {
    setupMessageChannel,
    cleanupMessageChannel
  };
};
