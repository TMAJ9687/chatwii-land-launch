
import { useEffect, useCallback, useRef, useState } from 'react';
import { useChannelManager } from './useChannelManager';
import { MessageWithMedia } from '@/types/message';
import { isMockUser } from '@/utils/mockUsers';
import { queryDocuments } from '@/lib/firebase';
import { mergeMessages } from '@/utils/messageUtils';
import { getConversationId, getMessageChannelName, getMessagesPath } from '@/utils/channelUtils';

export const useMessageChannel = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<MessageWithMedia[]>>
) => {
  const { listenToChannel, cleanupChannel } = useChannelManager();
  const isListeningRef = useRef(false);
  const latestDataRef = useRef<any>(null);
  const localMessagesRef = useRef<MessageWithMedia[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const processedMessagesRef = useRef<Record<string, boolean>>({});
  const channelNameRef = useRef<string | null>(null);
  const reconnectAttemptRef = useRef(0);
  const setupTimeRef = useRef<number>(0);
  const hasDataRef = useRef<boolean>(false);

  // Process raw message data with media and reactions
  const processMessages = useCallback(async (messagesData: any) => {
    if (!messagesData) return [];
    
    try {
      const messages = Object.values(messagesData);
      if (!Array.isArray(messages) || messages.length === 0) return [];

      const messageIds = messages
        .filter((msg: any) => msg && typeof msg === 'object' && msg.id)
        .map((msg: any) => msg.id);
        
      if (messageIds.length === 0) return [];

      // Batch fetch media and reactions in parallel
      const [mediaRecords, reactionRecords] = await Promise.all([
        queryDocuments('message_media', [
          { field: 'message_id', operator: 'in', value: messageIds }
        ]),
        queryDocuments('message_reactions', [
          { field: 'message_id', operator: 'in', value: messageIds }
        ])
      ]);

      // Create lookup maps for fast access
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

      // Construct complete message objects
      return messages
        .filter((msg: any) => msg && typeof msg === 'object' && msg.id)
        .map((msg: any) => ({
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
      try {
        // Merge new messages with existing ones using our utility
        const merged = mergeMessages(currentMessages, newMessages);
        // Update our local ref
        localMessagesRef.current = merged;
        return merged;
      } catch (error) {
        console.error('Error merging messages:', error);
        return currentMessages;
      }
    });
    
    // Mark messages as processed to avoid duplicates
    newMessages.forEach(msg => {
      if (!msg?.id) return;
      const messageKey = `${msg.id}-${msg.updated_at || msg.created_at}`;
      processedMessagesRef.current[messageKey] = true;
    });
  }, [setMessages]);

  // Immediate update of UI with new messages
  const handleRealTimeUpdate = useCallback(async (data: any) => {
    // Store the latest data
    latestDataRef.current = data;
    hasDataRef.current = !!data;
    
    if (!data) {
      // Don't clear messages when no data - might be a temporary connection issue
      return;
    }
    
    try {
      // Process and update messages immediately
      const processed = await processMessages(data);
      
      if (processed.length > 0) {
        updateMessagesCache(processed);
        setConnectionStatus('connected');
        reconnectAttemptRef.current = 0;
      } else {
        // No messages found but we have data - consider this a successful connection
        // This handles cases where the conversation is empty
        if (hasDataRef.current) {
          setConnectionStatus('connected');
          reconnectAttemptRef.current = 0;
        }
      }
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
    // Skip if we don't have both user IDs or if it's a mock user
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

    // Create unique channel name and path using our utilities
    const conversationId = getConversationId(currentUserId, selectedUserId);
    const channelName = getMessageChannelName(conversationId);
    const path = getMessagesPath(conversationId);
    
    // Store the channel name for cleanup
    channelNameRef.current = channelName;

    // Prevent excessive setup/cleanup cycles for the same channel
    const now = Date.now();
    const isSameChannelRecently = 
      channelName === channelNameRef.current && 
      now - setupTimeRef.current < 5000; // 5 seconds threshold
      
    if (isSameChannelRecently && isListeningRef.current) {
      console.log(`Skipping redundant setup for ${channelName}, last setup was ${now - setupTimeRef.current}ms ago`);
      return;
    }
    
    // Update setup time reference
    setupTimeRef.current = now;

    // Clean up any existing channel first
    if (channelNameRef.current && channelNameRef.current !== channelName) {
      console.log(`Cleaning up previous channel ${channelNameRef.current}`);
      cleanupChannel(channelNameRef.current);
    }
    
    // Mark that we're now listening
    isListeningRef.current = true;
    console.log(`Setting up message channel for ${channelName}`);
    
    // Subscribe with immediate processing
    const cleanup = listenToChannel(channelName, path, handleRealTimeUpdate);
    
    // Return cleanup function
    return () => {
      console.log(`Cleaning up message channel ${channelName}`);
      isListeningRef.current = false;
      cleanup();
    };
  }, [
    currentUserId,
    selectedUserId,
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
