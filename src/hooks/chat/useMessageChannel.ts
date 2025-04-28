
import { useEffect, useCallback, useRef, useState } from 'react';
import { useChannelManager } from './useChannelManager';
import { MessageWithMedia } from '@/types/message';
import { isMockUser } from '@/utils/mockUsers';
import { queryDocuments } from '@/lib/firebase';
import { toast } from 'sonner';

export const useMessageChannel = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<MessageWithMedia[]>>
) => {
  const { listenToChannel, cleanupChannel, getConversationId } = useChannelManager();
  const isListeningRef = useRef(false);
  const latestDataRef = useRef<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

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

  // Immediate update of UI with new messages
  const handleRealTimeUpdate = useCallback(async (data: any) => {
    // Store the latest data
    latestDataRef.current = data;
    
    if (!data) {
      setMessages([]);
      return;
    }
    
    try {
      // Process and update messages immediately
      const processed = await processMessages(data);
      setMessages(processed);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error handling real-time update:', error);
      setConnectionStatus('disconnected');
    }
  }, [processMessages, setMessages]);

  // Main effect for setting up message channel
  useEffect(() => {
    if (
      !currentUserId ||
      !selectedUserId ||
      isMockUser(selectedUserId)
    ) {
      if (isListeningRef.current) {
        isListeningRef.current = false;
      }
      return;
    }

    // Set connection status to connecting
    setConnectionStatus('connecting');

    // Reset listening status when user changes
    if (isListeningRef.current) {
      isListeningRef.current = false;
    }

    // Mark that we're now listening to avoid duplicate listeners
    isListeningRef.current = true;

    // Unique channel keys
    const convId = getConversationId(currentUserId, selectedUserId);
    const channelName = `messages_${convId}`;
    const path = `messages/${convId}`;

    console.log(`Setting up message channel for ${channelName}`);

    // Subscribe with immediate processing
    const cleanup = listenToChannel(channelName, path, handleRealTimeUpdate);

    // Cleanup on unmount or dependency change
    return () => {
      console.log(`Cleaning up message channel ${channelName}`);
      isListeningRef.current = false;
      cleanup();
    };
  }, [
    currentUserId,
    selectedUserId,
    getConversationId,
    listenToChannel,
    cleanupChannel,
    handleRealTimeUpdate
  ]);

  return {
    latestData: latestDataRef.current,
    connectionStatus,
    processMessages
  };
};
