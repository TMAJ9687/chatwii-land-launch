import { useEffect, useCallback, useRef, useState } from 'react';
import { useChannelManager } from './useChannelManager';
import { MessageWithMedia } from '@/types/message';
import { isMockUser } from '@/utils/mockUsers';
import { queryDocuments } from '@/lib/firebase';
import { toast } from 'sonner';
import { mergeMessages } from '@/utils/messageUtils';

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
  const channelNameRef = useRef<string | null>(null);
  const reconnectAttemptRef = useRef(0);

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

  // Keep a local cache of messages to prevent flicker during updates and ensure immediate state updates
  const updateMessagesCache = useCallback((newMessages: MessageWithMedia[]) => {
    if (!newMessages || newMessages.length === 0) return;
    
    // Get the current messages from state to merge with
    setMessages(currentMessages => {
      // Merge new messages with existing ones using our utility
      const merged = mergeMessages(currentMessages, newMessages);
      // Update our local ref
      localMessagesRef.current = merged;
      return merged;
    });
    
    // Mark messages as processed to avoid duplicates
    newMessages.forEach(msg => {
      const messageKey = `${msg.id}-${msg.updated_at || msg.created_at}`;
      processedMessagesRef.current[messageKey] = true;
    });
  }, [setMessages]);

  // Immediate update of UI with new messages
  const handleRealTimeUpdate = useCallback(async (data: any) => {
    // Store the latest data
    latestDataRef.current = data;
    
    if (!data) {
      // Don't clear messages when no data - might be a temporary connection issue
      // Instead, keep showing the existing messages
      return;
    }
    
    try {
      // Process and update messages immediately
      const processed = await processMessages(data);
      
      // Update our cache and state
      updateMessagesCache(processed);
      
      // Update connection status
      setConnectionStatus('connected');
      reconnectAttemptRef.current = 0;
    } catch (error) {
      console.error('Error handling real-time update:', error);
      
      // Only set to disconnected if we've had multiple failures
      if (reconnectAttemptRef.current > 1) {
        setConnectionStatus('disconnected');
      }
      
      reconnectAttemptRef.current++;
    }
  }, [processMessages, updateMessagesCache]);

  // Main effect for setting up message channel
  useEffect(() => {
    if (
      !currentUserId ||
      !selectedUserId ||
      isMockUser(selectedUserId)
    ) {
      if (isListeningRef.current) {
        console.log("Missing user IDs or mock user, cleaning up channel");
        isListeningRef.current = false;
        if (channelNameRef.current) {
          cleanupChannel(channelNameRef.current);
          channelNameRef.current = null;
        }
      }
      return;
    }

    // Set connection status to connecting
    setConnectionStatus('connecting');

    // Unique channel keys
    const convId = getConversationId(currentUserId, selectedUserId);
    const channelName = `messages_${convId}`;
    const path = `messages/${convId}`;
    
    // Store the channel name for cleanup
    channelNameRef.current = channelName;

    // Only set up a new listener if one isn't already active for this channel
    if (!isListeningRef.current || channelName !== channelNameRef.current) {
      console.log(`Setting up message channel for ${channelName}`);
      
      // Clean up any existing channel first
      if (channelNameRef.current && channelNameRef.current !== channelName) {
        console.log(`Cleaning up previous channel ${channelNameRef.current}`);
        cleanupChannel(channelNameRef.current);
      }
      
      // Mark that we're now listening
      isListeningRef.current = true;
      
      // Subscribe with immediate processing
      const cleanup = listenToChannel(channelName, path, handleRealTimeUpdate);
      
      // Return cleanup function
      return () => {
        console.log(`Cleaning up message channel ${channelName}`);
        isListeningRef.current = false;
        cleanup();
      };
    }
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
