
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
import { insertTemporaryMessage } from '@/utils/messageUtils';

export const useConversation = (
  currentUserId: string | null,
  selectedUserId: string | null,
  currentUserRole: string,
  isVipUser: boolean
) => {
  const [hasSelectedNewUser, setHasSelectedNewUser] = useState(false);
  const { handleBotResponse } = useBot();
  const { fetchUnreadCount, markMessagesAsRead, updateSelectedUserId } = useGlobalMessages(currentUserId);

  // Helper: Mark messages as read and refresh unread count
  const markMessagesAsReadAsync = useCallback(
    async (userId: string) => {
      try {
        await markMessagesAsRead(userId);
        fetchUnreadCount();
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    },
    [markMessagesAsRead, fetchUnreadCount]
  );

  // Messages state/hooks
  const {
    messages,
    setMessages,
    fetchMessages,
    isLoading,
    error: messagesError,
    resetState
  } = useMessages(currentUserId, selectedUserId, currentUserRole, markMessagesAsReadAsync);

  // Message actions (delete, etc.)
  const {
    deleteConversation,
    isDeletingConversation
  } = useMessageActions(currentUserId || '', isVipUser);

  // -- Side Effects and Event Handlers --

  // Keep selected user ID in global messages context
  useEffect(() => {
    updateSelectedUserId(selectedUserId);
  }, [selectedUserId, updateSelectedUserId]);

  // Fetch/reset messages on user switch
  useEffect(() => {
    if (selectedUserId && currentUserId) {
      setHasSelectedNewUser(true);
      resetState();
      fetchMessages();
    }
  }, [selectedUserId, currentUserId, fetchMessages, resetState]);

  // Reset flag after delay when new user selected
  useEffect(() => {
    if (!hasSelectedNewUser) return;
    const timer = setTimeout(() => setHasSelectedNewUser(false), 1000);
    return () => clearTimeout(timer);
  }, [hasSelectedNewUser]);

  // Show error only if not right after user switch
  useEffect(() => {
    if (messagesError && !hasSelectedNewUser) {
      console.error('Message error:', messagesError);
      toast.error("Error loading messages. Please try again.");
    }
  }, [messagesError, hasSelectedNewUser]);

  // --- Event Handlers ---

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

  const createOptimisticMessage = (
    tempId: string, now: string, content: string, imageUrl: string | undefined
  ): MessageWithMedia => ({
    id: tempId,
    content: content || (imageUrl ? '[Image]' : ''),
    sender_id: currentUserId!,
    receiver_id: selectedUserId!,
    created_at: now,
    is_read: false,
    media: imageUrl
      ? {
          id: `temp-media-${uuidv4()}`,
          message_id: tempId,
          user_id: currentUserId!,
          file_url: imageUrl,
          media_type: imageUrl.includes('voice') ? 'voice' : 'image',
          created_at: now
        }
      : null,
    reactions: []
  });

  const handleSendMessage = useCallback(
    async (content: string, imageUrl?: string) => {
      if (!selectedUserId || !currentUserId) {
        toast.error("Cannot send message - missing user information");
        return;
      }
      if (isMockUser(selectedUserId)) {
        toast.error("This is a demo VIP user. You cannot send messages to this account.");
        return;
      }
      const now = new Date().toISOString();
      const tempId = `temp-${uuidv4()}`;
      
      // Create optimistic message
      const optimisticMessage = createOptimisticMessage(tempId, now, content, imageUrl);
      
      // Optimistic UI update - use our utility for consistent state updates
      setMessages(currentMessages => insertTemporaryMessage(currentMessages, optimisticMessage));
      
      try {
        // For bots
        const recipientProfiles = await queryDocuments('profiles', [
          { field: 'id', operator: '==', value: selectedUserId }
        ]);
        const recipientProfile = recipientProfiles?.[0] || null;

        // Create actual message
        const messageId = await createDocument('messages', {
          content: content || (imageUrl ? '[Image]' : ''),
          sender_id: currentUserId,
          receiver_id: selectedUserId,
          is_read: false,
          created_at: now,
          participants: [currentUserId, selectedUserId]
        });

        // Bot auto-response if needed
        if (recipientProfile?.role === 'bot' && content) {
          handleBotResponse(selectedUserId, currentUserId, content);
        }
        // If media, upload the media doc
        if (imageUrl && messageId) {
          await createDocument('message_media', {
            message_id: messageId,
            user_id: currentUserId,
            file_url: imageUrl,
            media_type: imageUrl.includes('voice') ? 'voice' : 'image',
            created_at: now
          });
        }
        
        fetchUnreadCount();
        
        // Slight delay before fetching to allow Firebase to update
        setTimeout(() => {
          fetchMessages();
        }, 400);

        return true;
      } catch (error: any) {
        console.error('Error in handleSendMessage:', error);
        
        // Remove optimistic message on error
        setMessages(current =>
          current.filter(msg => msg.id !== tempId)
        );
        
        const msg =
          error.message?.includes('CORS') || error.message?.includes('storage')
            ? "Media upload failed. Please check Firebase Storage configuration."
            : "Failed to send message. Please try again.";
        toast.error(msg);
        return false;
      }
    },
    [currentUserId, selectedUserId, setMessages, handleBotResponse, fetchUnreadCount, fetchMessages]
  );

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
