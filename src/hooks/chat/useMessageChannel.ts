
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
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<any>(null);
  const maxRetries = 3;

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
      console.log('No data received from Realtime DB');
      setConnectionStatus('disconnected');
      return;
    }
    
    try {
      // Process messages
      const processed = await processMessages(data);
      
      if (processed.length > 0) {
        console.log(`Received ${processed.length} messages from Realtime DB`);
        // Update messages using merge utility
        setMessages(currentMessages => mergeMessages(currentMessages, processed));
        setConnectionStatus('connected');
        // Reset retry count when we succeed
        retryCountRef.current = 0;
      } else {
        // No messages but connected
        console.log('Connected to Realtime DB but no messages found');
        setConnectionStatus('connected');
      }
    } catch (error) {
      console.error('Error handling real-time update:', error);
      setConnectionStatus('disconnected');
    }
  }, [processMessages, setMessages]);

  const setupChannel = useCallback(() => {
    if (!currentUserId || !selectedUserId) {
      console.log('Missing user IDs for channel setup');
      return null;
    }
    
    // Check if it's a mock user
    if (isMockUser(selectedUserId)) {
      console.log('Mock user selected, skipping channel setup');
      return null;
    }
    
    // Create unique channel name and path
    const convId = getConversationId(currentUserId, selectedUserId);
    if (!convId) {
      console.error('Could not generate conversation ID');
      return null;
    }
    
    const channelName = getMessageChannelName(convId);
    const path = getMessageChannelPath(convId);
    
    console.log(`Setting up message channel: ${channelName} at path: ${path}`);
    setConnectionStatus('connecting');
    
    // Store the channel name for cleanup
    channelNameRef.current = channelName;
    
    // Ensure data is synced before subscribing
    syncService.queueSync(currentUserId, selectedUserId)
      .catch(err => console.error('Error queuing sync:', err));
    
    // Subscribe with immediate processing
    return listenToChannel(channelName, path, handleRealTimeUpdate);
  }, [currentUserId, selectedUserId, listenToChannel, handleRealTimeUpdate]);

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

    // Clear any existing retry timer
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    // Set connection status to connecting
    setConnectionStatus('connecting');
    
    // Setup the channel
    const cleanup = setupChannel();
    
    // Mark that we're now listening
    isListeningRef.current = true;
    
    // Return cleanup function
    return () => {
      console.log(`Cleaning up message channel ${channelNameRef.current}`);
      isListeningRef.current = false;
      if (cleanup) cleanup();
    };
  }, [
    currentUserId,
    selectedUserId,
    cleanupChannel,
    setupChannel
  ]);

  // Effect to handle automatic retries
  useEffect(() => {
    if (connectionStatus === 'disconnected' && retryCountRef.current < maxRetries && isListeningRef.current) {
      console.log(`Message channel disconnected, retrying (${retryCountRef.current + 1}/${maxRetries})`);
      
      // Increment retry count
      retryCountRef.current += 1;
      
      // Set up retry with exponential backoff
      retryTimerRef.current = setTimeout(() => {
        console.log(`Attempting to reconnect message channel...`);
        
        // Clean up existing channel
        if (channelNameRef.current) {
          cleanupChannel(channelNameRef.current);
        }
        
        // Create new channel
        setupChannel();
      }, 1000 * Math.pow(2, retryCountRef.current - 1)); // 1s, 2s, 4s, 8s
    }
    
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [connectionStatus, cleanupChannel, setupChannel]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    console.log('Manual reconnect requested');
    
    // Reset retry count for manual reconnect
    retryCountRef.current = 0;
    
    // Clean up existing channel
    if (channelNameRef.current) {
      cleanupChannel(channelNameRef.current);
      channelNameRef.current = null;
    }
    
    // Set status to connecting
    setConnectionStatus('connecting');
    
    // Setup new channel
    setupChannel();
  }, [cleanupChannel, setupChannel]);

  return {
    latestData: latestDataRef.current,
    connectionStatus,
    processMessages,
    reconnect
  };
};
