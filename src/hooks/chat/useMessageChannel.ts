
import { useEffect, useCallback, useRef } from 'react';
import { useChannelManager } from './useChannelManager';
import { MessageWithMedia } from '@/types/message';
import { isMockUser } from '@/utils/mockUsers';
import { queryDocuments } from '@/lib/firebase';

export const useMessageChannel = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<MessageWithMedia[]>>
) => {
  const { listenToChannel, cleanupChannel, getConversationId } = useChannelManager();
  const isListeningRef = useRef(false);
  const latestDataRef = useRef<any>(null);

  // Process raw message data with media and reactions
  const processMessages = useCallback(async (messagesData: any) => {
    if (!messagesData) return [];
    const messages = Object.values(messagesData);
    if (!Array.isArray(messages) || messages.length === 0) return [];

    const messageIds = messages.map((msg: any) => msg.id).filter(Boolean);
    if (messageIds.length === 0) return [];

    try {
      const [mediaRecords, reactionRecords] = await Promise.all([
        queryDocuments('message_media', [
          { field: 'message_id', operator: 'in', value: messageIds }
        ]),
        queryDocuments('message_reactions', [
          { field: 'message_id', operator: 'in', value: messageIds }
        ])
      ]);

      const mediaById = mediaRecords.reduce((acc: Record<string, any>, m: any) => {
        if (m?.message_id) acc[m.message_id] = m;
        return acc;
      }, {});
      const reactionsById = reactionRecords.reduce((acc: Record<string, any[]>, r: any) => {
        if (r?.message_id) {
          acc[r.message_id] = acc[r.message_id] || [];
          acc[r.message_id].push(r);
        }
        return acc;
      }, {});

      return messages.map((msg: any) => ({
        ...msg,
        media: mediaById[msg.id] || null,
        reactions: reactionsById[msg.id] || []
      }));
    } catch (err) {
      console.error('Error processing messages:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    if (
      !currentUserId ||
      !selectedUserId ||
      isMockUser(selectedUserId) ||
      isListeningRef.current
    ) {
      return;
    }

    // Mark that we're now listening to avoid duplicate listeners
    isListeningRef.current = true;

    // Unique channel keys
    const convId = getConversationId(currentUserId, selectedUserId);
    const channelName = `messages_${convId}`;
    const path = `messages/${convId}`;

    // Subscribe with immediate processing
    listenToChannel(channelName, path, async (data) => {
      // Store the latest data
      latestDataRef.current = data;
      
      // Process and update messages immediately
      const processed = await processMessages(data);
      setMessages(processed);
    });

    // Cleanup on unmount or dependency change
    return () => {
      isListeningRef.current = false;
      cleanupChannel(channelName);
    };
  }, [
    currentUserId,
    selectedUserId,
    getConversationId,
    listenToChannel,
    cleanupChannel,
    processMessages,
    setMessages
  ]);

  return {
    latestData: latestDataRef.current
  };
};
