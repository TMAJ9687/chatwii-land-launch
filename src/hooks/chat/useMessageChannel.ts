
import { useState, useCallback, useEffect, useRef } from 'react';
import { useChannelManager } from './useChannelManager';
import { MessageWithMedia } from '@/types/message';
import { isMockUser } from '@/utils/mockUsers';
import { queryDocuments } from '@/lib/firebase';

// Improved message channel hook with proper memory management and stability
export const useMessageChannel = (
  currentUserId: string | null,
  selectedUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<MessageWithMedia[]>>
) => {
  const [isListening, setIsListening] = useState(false);
  
  // Use refs for stable references across renders
  const currentUserIdRef = useRef(currentUserId);
  const selectedUserIdRef = useRef(selectedUserId);
  const isListeningRef = useRef(isListening);
  const { listenToChannel, cleanupChannel, getConversationId } = useChannelManager();
  
  // Update refs when dependencies change
  useEffect(() => {
    currentUserIdRef.current = currentUserId;
    selectedUserIdRef.current = selectedUserId;
    isListeningRef.current = isListening;
  }, [currentUserId, selectedUserId, isListening]);

  // Process raw message data with media and reactions - memoized
  const processMessages = useCallback(async (messagesData: any) => {
    if (!messagesData) return [];

    const messages = Object.values(messagesData);
    
    // Early return for empty messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return [];
    }

    // Get all message IDs for batch querying
    const messageIds = messages.map((msg: any) => msg.id).filter(Boolean);
    
    // Skip if no valid IDs
    if (messageIds.length === 0) {
      return [];
    }
    
    try {
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
    } catch (error) {
      console.error('Error processing messages:', error);
      return [];
    }
  }, []);

  // Setup message channel - memoized with stable references
  const setupMessageChannel = useCallback(() => {
    const currentId = currentUserIdRef.current;
    const selectedId = selectedUserIdRef.current;
    
    if (!currentId || !selectedId || isMockUser(selectedId)) {
      return;
    }

    // Skip if already listening
    if (isListeningRef.current) {
      console.log('Already listening to message channel, skipping setup');
      return;
    }

    setIsListening(true);
    isListeningRef.current = true;
    
    // Generate a consistent conversation ID
    const conversationId = getConversationId(currentId, selectedId);
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
  }, [getConversationId, listenToChannel, processMessages, setMessages]);

  // Cleanup handler with stable references
  const cleanupMessageChannel = useCallback(() => {
    const currentId = currentUserIdRef.current;
    const selectedId = selectedUserIdRef.current;
    
    if (currentId && selectedId) {
      const conversationId = getConversationId(currentId, selectedId);
      cleanupChannel(`messages_${conversationId}`);
    }
    
    setIsListening(false);
    isListeningRef.current = false;
  }, [getConversationId, cleanupChannel]);

  // Set up and clean up the message channel on user selection change
  useEffect(() => {
    if (currentUserId && selectedUserId && !isMockUser(selectedUserId) && !isListening) {
      setupMessageChannel();
    }
    
    return () => {
      if (isListening) {
        cleanupMessageChannel();
      }
    };
  }, [currentUserId, selectedUserId, isListening, setupMessageChannel, cleanupMessageChannel]);

  return { setupMessageChannel, cleanupMessageChannel, isListening };
};
