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
  const localMessagesRef = useRef<MessageWithMedia[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const processedMessagesRef = useRef<Record<string, boolean>>({});

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

  // Keep a local cache of messages to prevent flicker during updates
  const updateMessagesCache = useCallback((newMessages: MessageWithMedia[]) => {
    if (!newMessages || newMessages.length === 0) return;
    
    const updatedMessages = [...localMessagesRef.current];
    let hasChanges = false;
    
    // Process each new message
    newMessages.forEach(newMsg => {
      // Check if we've already processed this exact message state
      const messageKey = `${newMsg.id}-${newMsg.updated_at || newMsg.created_at}`;
      if (processedMessagesRef.current[messageKey]) {
        return; // Skip already processed messages
      }
      
      // Mark as processed
      processedMessagesRef.current[messageKey] = true;
      
      // Find existing message index
      const existingIndex = updatedMessages.findIndex(m => m.id === newMsg.id);
      
      if (existingIndex >= 0) {
        // Update existing message
        updatedMessages[existingIndex] = newMsg;
        hasChanges = true;
      } else {
        // Add new message
        updatedMessages.push(newMsg);
        hasChanges = true;
      }
    });
    
    // If we made changes, update the cache and state
    if (hasChanges) {
      // Sort by created_at
      updatedMessages.sort((a, b) => {
        const dateA = a.created_at instanceof Date ? a.created_at.getTime() : 
          new Date(a.created_at as any).getTime();
        const dateB = b.created_at instanceof Date ? b.created_at.getTime() : 
          new Date(b.created_at as any).getTime();
        return dateA - dateB;
      });
      
      localMessagesRef.current = updatedMessages;
      setMessages(updatedMessages);
    }
  }, [setMessages]);

  // Immediate update of UI with new messages
  const handleRealTimeUpdate = useCallback(async (data: any) => {
    // Store the latest data
    latestDataRef.current = data;
    
    if (!data) {
      setMessages([]);
      localMessagesRef.current = [];
      return;
    }
    
    try {
      // Process and update messages immediately
      const processed = await processMessages(data);
      
      // Update our cache and state
      updateMessagesCache(processed);
      
      // Update connection status
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error handling real-time update:', error);
      setConnectionStatus('disconnected');
    }
  }, [processMessages, setMessages, updateMessagesCache]);

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

    // Reset cache when user changes
    if (selectedUserId) {
      processedMessagesRef.current = {};
      localMessagesRef.current = [];
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
