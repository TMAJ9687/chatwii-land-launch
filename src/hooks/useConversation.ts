
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useMessageActions } from '@/hooks/useMessageActions';
import { useMessages } from '@/hooks/useMessages';
import { useGlobalMessages } from '@/hooks/useGlobalMessages';
import { useBot } from '@/hooks/useBot';
import { createDocument, queryDocuments } from '@/lib/firebase';
import { isMockUser } from '@/utils/mockUsers';
import { MessageWithMedia } from '@/types/message';
import { v4 as uuidv4 } from 'uuid';

export const useConversation = (
  currentUserId: string | null,
  selectedUserId: string | null,
  currentUserRole: string,
  isVipUser: boolean
) => {
  const [hasSelectedNewUser, setHasSelectedNewUser] = useState(false);
  const { handleBotResponse } = useBot();
  const { fetchUnreadCount, markMessagesAsRead, updateSelectedUserId } = useGlobalMessages(currentUserId);

  const { 
    messages, 
    setMessages,
    fetchMessages,
    isLoading,
    error: messagesError,
    resetState
  } = useMessages(currentUserId, selectedUserId, currentUserRole, markMessagesAsRead);

  const {
    deleteConversation,
    isDeletingConversation
  } = useMessageActions(currentUserId || '', isVipUser);

  useEffect(() => {
    updateSelectedUserId(selectedUserId);
  }, [selectedUserId, updateSelectedUserId]);

  useEffect(() => {
    if (selectedUserId && currentUserId && !isLoading) {
      console.log('New user selected, fetching messages:', selectedUserId);
      setHasSelectedNewUser(true);
      
      resetState();
      fetchMessages();
    }
  }, [selectedUserId, currentUserId, fetchMessages, isLoading, resetState]);

  useEffect(() => {
    if (hasSelectedNewUser) {
      const timer = setTimeout(() => {
        setHasSelectedNewUser(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [hasSelectedNewUser]);

  useEffect(() => {
    if (messagesError && !hasSelectedNewUser) {
      console.error('Message error:', messagesError);
      toast.error(messagesError);
    }
  }, [messagesError, hasSelectedNewUser]);

  const handleDeleteConversation = useCallback(async () => {
    if (selectedUserId && !isDeletingConversation) {
      try {
        await deleteConversation(selectedUserId);
        fetchMessages();
      } catch (error) {
        console.error("Error deleting conversation:", error);
        toast.error("Failed to delete conversation");
      }
    }
  }, [selectedUserId, isDeletingConversation, deleteConversation, fetchMessages]);

  const handleSendMessage = useCallback(async (content: string, imageUrl?: string) => {
    if (!selectedUserId || !currentUserId) return;

    if (isMockUser(selectedUserId)) {
      toast.error("This is a demo VIP user. You cannot send messages to this account.");
      return;
    }

    try {
      console.log('Sending message:', {content, hasImage: !!imageUrl});
      
      // Generate a temporary ID for optimistic UI update
      const tempId = `temp-${uuidv4()}`;
      
      const optimisticMessage: MessageWithMedia = {
        id: tempId,
        content: content || (imageUrl ? '[Image]' : ''),
        sender_id: currentUserId,
        receiver_id: selectedUserId,
        created_at: new Date().toISOString(),
        is_read: false,
        media: imageUrl ? {
          id: `temp-media-${uuidv4()}`,
          message_id: tempId,
          user_id: currentUserId,
          file_url: imageUrl,
          media_type: imageUrl.includes('voice') ? 'voice' : 'image',
          created_at: new Date().toISOString()
        } : null,
        reactions: []
      };

      // Update UI optimistically
      setMessages(current => [...current, optimisticMessage]);
      console.log('Added optimistic message to UI');

      // Get recipient profile
      const recipientProfiles = await queryDocuments('profiles', [
        { field: 'id', operator: '==', value: selectedUserId }
      ]);
      const recipientProfile = recipientProfiles.length > 0 ? recipientProfiles[0] : null;

      // Create the message in Firestore
      console.log('Creating message in Firestore');
      const messageId = await createDocument('messages', {
        content: content || (imageUrl ? '[Image]' : ''),
        sender_id: currentUserId,
        receiver_id: selectedUserId,
        is_read: false,
        created_at: new Date().toISOString(), // Explicitly set created_at as string
        participants: [currentUserId, selectedUserId]
      });
      
      console.log('Message created with ID:', messageId);

      // If it's a bot user, trigger a response
      if (recipientProfile?.role === 'bot' && content) {
        handleBotResponse(selectedUserId, currentUserId, content);
      }

      // Create media record if image URL is provided
      if (imageUrl && messageId) {
        console.log('Creating media record for message:', messageId);
        await createDocument('message_media', {
          message_id: messageId,
          user_id: currentUserId,
          file_url: imageUrl,
          media_type: imageUrl.includes('voice') ? 'voice' : 'image',
          created_at: new Date().toISOString() // Explicitly set created_at as string
        });
        console.log('Media record created');
      }

      // Update the global unread count
      fetchUnreadCount();

      // Remove the optimistic message and fetch updated messages
      console.log('Fetching fresh messages to replace optimistic update');
      fetchMessages();
    } catch (error: any) {
      console.error('Error in handleSendMessage:', error);
      toast.error("An error occurred while sending your message");
      
      // Show more specific error for CORS or storage issues
      if (error.message?.includes('CORS') || error.message?.includes('storage')) {
        toast.error("Media upload failed. Please check Firebase Storage configuration.");
      }
    }
  }, [currentUserId, selectedUserId, setMessages, handleBotResponse, fetchUnreadCount, fetchMessages]);

  return {
    messages,
    isLoading,
    messagesError,
    handleSendMessage,
    handleDeleteConversation,
    isDeletingConversation,
    hasSelectedNewUser
  };
};
