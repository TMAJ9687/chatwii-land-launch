
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

  // Create an async wrapper function for messages hook
  const markMessagesAsReadAsync = async (userId: string) => {
    try {
      await markMessagesAsRead(userId);
      fetchUnreadCount();
      return Promise.resolve();
    } catch (error) {
      console.error("Error marking messages as read:", error);
      return Promise.resolve();
    }
  };

  const { 
    messages, 
    setMessages,
    fetchMessages,
    isLoading,
    error: messagesError,
    resetState
  } = useMessages(currentUserId, selectedUserId, currentUserRole, markMessagesAsReadAsync);

  const {
    deleteConversation,
    isDeletingConversation
  } = useMessageActions(currentUserId || '', isVipUser);

  // Update selected user ID in the global messages context
  useEffect(() => {
    updateSelectedUserId(selectedUserId);
  }, [selectedUserId, updateSelectedUserId]);

  // Fetch messages when a new user is selected
  useEffect(() => {
    if (selectedUserId && currentUserId) {
      console.log('New user selected, fetching messages:', selectedUserId);
      setHasSelectedNewUser(true);
      
      resetState();
      fetchMessages();
    }
  }, [selectedUserId, currentUserId, fetchMessages, resetState]);

  // Reset the "new user selected" flag after a delay
  useEffect(() => {
    if (hasSelectedNewUser) {
      const timer = setTimeout(() => {
        setHasSelectedNewUser(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [hasSelectedNewUser]);

  // Show message errors, but not immediately after selecting a new user
  useEffect(() => {
    if (messagesError && !hasSelectedNewUser) {
      console.error('Message error:', messagesError);
      toast.error("Error loading messages. Please try again.");
    }
  }, [messagesError, hasSelectedNewUser]);

  // Handle conversation deletion
  const handleDeleteConversation = useCallback(async () => {
    if (!selectedUserId || !currentUserId || isDeletingConversation) return;

    try {
      await deleteConversation(selectedUserId);
      resetState();
      await fetchMessages();
      toast.success("Conversation deleted");
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    }
  }, [selectedUserId, currentUserId, isDeletingConversation, deleteConversation, fetchMessages, resetState]);

  // Handle sending messages with improved error handling
  const handleSendMessage = useCallback(async (content: string, imageUrl?: string) => {
    if (!selectedUserId || !currentUserId) {
      toast.error("Cannot send message - missing user information");
      return;
    }

    if (isMockUser(selectedUserId)) {
      toast.error("This is a demo VIP user. You cannot send messages to this account.");
      return;
    }

    try {
      console.log('Sending message:', {content, hasImage: !!imageUrl});
      
      // Generate a temporary ID for optimistic UI update
      const tempId = `temp-${uuidv4()}`;
      const now = new Date().toISOString();
      
      // Create optimistic message for immediate UI feedback
      const optimisticMessage: MessageWithMedia = {
        id: tempId,
        content: content || (imageUrl ? '[Image]' : ''),
        sender_id: currentUserId,
        receiver_id: selectedUserId,
        created_at: now,
        is_read: false,
        media: imageUrl ? {
          id: `temp-media-${uuidv4()}`,
          message_id: tempId,
          user_id: currentUserId,
          file_url: imageUrl,
          media_type: imageUrl.includes('voice') ? 'voice' : 'image',
          created_at: now
        } : null,
        reactions: []
      };

      // Update UI optimistically
      setMessages(current => [...current, optimisticMessage]);
      
      // Get recipient profile for bot handling
      const recipientProfiles = await queryDocuments('profiles', [
        { field: 'id', operator: '==', value: selectedUserId }
      ]);
      const recipientProfile = recipientProfiles.length > 0 ? recipientProfiles[0] : null;

      // Create the message in Firestore
      const messageId = await createDocument('messages', {
        content: content || (imageUrl ? '[Image]' : ''),
        sender_id: currentUserId,
        receiver_id: selectedUserId,
        is_read: false,
        created_at: now,
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
          created_at: now
        });
      }

      // Update the global unread count
      fetchUnreadCount();

      // Remove optimistic message and fetch the actual messages
      // We're using a tiny delay to avoid race conditions
      setTimeout(() => {
        fetchMessages();
      }, 500);
      
      return true;
    } catch (error: any) {
      console.error('Error in handleSendMessage:', error);
      
      // Remove the optimistic message on error
      setMessages(current => current.filter(msg => !msg.id.includes('temp-')));
      
      // Show appropriate error message
      if (error.message?.includes('CORS') || error.message?.includes('storage')) {
        toast.error("Media upload failed. Please check Firebase Storage configuration.");
      } else {
        toast.error("Failed to send message. Please try again.");
      }
      
      return false;
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
