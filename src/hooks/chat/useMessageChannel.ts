
import { useEffect, useCallback, useRef, useState } from 'react';
import { useChannelManager } from './useChannelManager';
import { MessageWithMedia } from '@/types/message';
import { isMockUser } from '@/utils/mockUsers';
import { mergeMessages } from '@/utils/messageUtils';
import { 
  getConversationId, 
  getMessageChannelName, 
  getMessageChannelPath 
} from '@/utils/channelUtils';
import { syncService } from '@/services/syncService';

// Simplified hook focused on message channel connection
export const useMessageChannel = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<MessageWithMedia[]>>
) => {
  const { listenToChannel, cleanupChannel } = useChannelManager();
  const isListeningRef = useRef(false);
  const latestDataRef = useRef<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const channelNameRef = useRef<string | null>(null);

  // Process raw message data
  const processMessages = useCallback(async (messagesData: any) => {
    if (!messagesData) return [];
    
    try {
      const messages = Object.values(messagesData);
      if (!Array.isArray(messages) || messages.length === 0) return [];

      // Messages from the realtime database should already include media and reactions
      return messages
        .filter((msg: any) => msg && typeof msg === 'object' && msg.id)
        .map((msg: any) => ({
          ...msg,
          media: msg.media || null,
          reactions: msg.reactions || []
        }));
    } catch (err) {
      console.error('Error processing messages:', err);
      return [];
    }
  }, []);

  // Handle real-time updates
  const handleRealTimeUpdate = useCallback(async (data: any) => {
    latestDataRef.current = data;
    
    if (!data) {
      setConnectionStatus('disconnected');
      return;
    }
    
    try {
      // Process messages
      const processed = await processMessages(data);
      
      if (processed.length > 0) {
        // Update messages using merge utility
        setMessages(currentMessages => mergeMessages(currentMessages, processed));
        setConnectionStatus('connected');
      } else {
        // No messages but connected
        setConnectionStatus('connected');
      }
    } catch (error) {
      console.error('Error handling real-time update:', error);
      setConnectionStatus('disconnected');
    }
  }, [processMessages, setMessages]);

  // Main effect for setting up message channel
  useEffect(() => {
    // Skip if we don't have both user IDs or if it's a mock user
    if (!currentUserId || !selectedUserId || isMockUser(selectedUserId)) {
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

    // Create unique channel name and path
    const convId = getConversationId(currentUserId, selectedUserId);
    const channelName = getMessageChannelName(convId);
    const path = getMessageChannelPath(convId);
    
    // Store the channel name for cleanup
    channelNameRef.current = channelName;
    
    // Mark that we're now listening
    isListeningRef.current = true;
    console.log(`Setting up message channel for ${channelName}`);
    
    // Ensure data is synced before subscribing
    syncService.queueSync(currentUserId, selectedUserId)
      .catch(err => console.error('Error queuing sync:', err));
    
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
