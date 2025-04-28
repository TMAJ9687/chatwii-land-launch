
import { useState, useCallback, useEffect } from 'react';
import { useChannelManager } from './useChannelManager';
import { MessageWithMedia } from '@/types/message';
import { isMockUser } from '@/utils/mockUsers';
import { queryDocuments } from '@/lib/firebase';

// Improved message channel hook with proper memory management
export const useMessageChannel = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<MessageWithMedia[]>>
) => {
  const [isListening, setIsListening] = useState(false);
  const { listenToChannel, cleanupChannel, getConversationId } = useChannelManager();

  // Process raw message data with media and reactions
  const processMessages = useCallback(async (messagesData: any) => {
    if (!messagesData) return [];

    const messages = Object.values(messagesData);
    
    // Early return for empty messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return [];
    }

    // Get all message IDs for batch querying
    const messageIds = messages.map((msg: any) => msg.id).filter(Boolean);
    
    // Make a single batch query for all media instead of one per message
    const mediaRecords = messageIds.length > 0 ? 
      await queryDocuments('message_media', [
        { field: 'message_id', operator: 'in', value: messageIds }
      ]) : [];
      
    // Make a single batch query for all reactions
    const reactionRecords = messageIds.length > 0 ? 
      await queryDocuments('message_reactions', [
        { field: 'message_id', operator: 'in', value: messageIds }
      ]) : [];
    
    // Create lookup maps for efficient assignment
    const mediaByMessageId = mediaRecords.reduce((acc: Record<string, any>, media: any) => {
      if (media && media.message_id) {
        acc[media.message_id] = media;
      }
      return acc;
    }, {});
    
    const reactionsByMessageId = reactionRecords.reduce((acc: Record<string, any[]>, reaction: any) => {
      if (reaction && reaction.message_id) {
        if (!acc[reaction.message_id]) {
          acc[reaction.message_id] = [];
        }
        acc[reaction.message_id].push(reaction);
      }
      return acc;
    }, {});
    
    // Process all messages with their media and reactions
    const processedMessages = messages.map((msg: any) => ({
      ...msg,
      media: mediaByMessageId[msg.id] || null,
      reactions: reactionsByMessageId[msg.id] || []
    }));
    
    return processedMessages;
  }, []);

  // Setup message channel
  const setupMessageChannel = useCallback(() => {
    if (!currentUserId || !selectedUserId || isMockUser(selectedUserId)) {
      return;
    }

    setIsListening(true);
    
    // Generate a consistent conversation ID
    const conversationId = getConversationId(currentUserId, selectedUserId);
    const channelName = `messages_${conversationId}`;
    const path = `messages/${conversationId}`;
    
    // Set up channel listener with proper cleanup
    listenToChannel(channelName, path, async (data) => {
      try {
        const processedMessages = await processMessages(data);
        setMessages(processedMessages);
      } catch (error) {
        console.error('Error processing messages:', error);
        setMessages([]);
      }
    });
    
    // Return cleanup function
    return () => {
      cleanupChannel(channelName);
      setIsListening(false);
    };
  }, [currentUserId, selectedUserId, getConversationId, listenToChannel, cleanupChannel, processMessages, setMessages]);

  // Clean up when user selection changes
  const cleanupMessageChannel = useCallback(() => {
    if (currentUserId && selectedUserId) {
      const conversationId = getConversationId(currentUserId, selectedUserId);
      cleanupChannel(`messages_${conversationId}`);
    }
    setIsListening(false);
  }, [currentUserId, selectedUserId, cleanupChannel, getConversationId]);

  // Set up and clean up the message channel on user selection change
  useEffect(() => {
    if (currentUserId && selectedUserId && !isMockUser(selectedUserId) && !isListening) {
      const cleanup = setupMessageChannel();
      return cleanup;
    }
    
    return () => cleanupMessageChannel();
  }, [currentUserId, selectedUserId, isListening, setupMessageChannel, cleanupMessageChannel]);

  return { setupMessageChannel, cleanupMessageChannel, isListening };
};
