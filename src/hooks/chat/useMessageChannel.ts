// src/hooks/chat/useMessageChannel.ts

import { useCallback, useRef, useEffect } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, onValue, off } from 'firebase/database';
import { MessageWithMedia } from '@/types/message';
import { isMockUser } from '@/utils/mockUsers';
import { queryDocuments } from '@/lib/firebase';

export const useMessageChannel = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<MessageWithMedia[]>>
) => {
  const listenerRef = useRef<any>(null);

  const cleanupMessageChannel = useCallback(() => {
    if (listenerRef.current) {
      off(listenerRef.current);
      listenerRef.current = null;
    }
  }, []);

  const setupMessageChannel = useCallback(() => {
    if (!currentUserId || !selectedUserId || isMockUser(selectedUserId)) return;

    cleanupMessageChannel();

    const path = `messages/${currentUserId}_${selectedUserId}`;
    const messagesRef = ref(realtimeDb, path);
    listenerRef.current = messagesRef;

    onValue(messagesRef, async (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setMessages([]);
        return;
      }

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
            media: mediaRecords[0] || null,
            reactions: reactionRecords || []
          };
        })
      );

      setMessages(processedMessages);
    });
  }, [currentUserId, selectedUserId, setMessages, cleanupMessageChannel]);

  useEffect(() => {
    setupMessageChannel();
    return cleanupMessageChannel;
  }, [setupMessageChannel, cleanupMessageChannel]);

  return { setupMessageChannel, cleanupMessageChannel };
};
