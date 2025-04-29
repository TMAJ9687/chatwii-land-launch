import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { MessageWithMedia } from '@/types/message';
import { messageService, conversationService } from '@/services/message';
import { createLogger } from '@/utils/logger';
import { insertTemporaryMessage, replaceTemporaryMessage } from '@/utils/messageUtils';

const logger = createLogger('useConversation');

export const useConversation = (
  currentUserId: string | null, 
  selectedUserId: string | null,
  currentUserRole: string,
  isVipUser: boolean
) => {
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle sending a message
  const handleSendMessage = useCallback(async (content: string, imageUrl?: string) => {
    if (!currentUserId || !selectedUserId || !content.trim()) {
      return { success: false, messageId: null };
    }

    // Generate a temporary ID for optimistic updates
    const tempId = `temp-${uuidv4()}`;

    try {
      // Create message in Firestore
      const messageId = await messageService.sendMessage(
        currentUserId,
        selectedUserId,
        content,
        imageUrl
      );

      return { success: true, messageId, tempId };
    } catch (error) {
      logger.error('Error sending message:', error);
      toast.error('Failed to send message');
      return { success: false, messageId: null, tempId };
    }
  }, [currentUserId, selectedUserId]);

  // Handle deleting a conversation
  const handleDeleteConversation = useCallback(async () => {
    if (!currentUserId || !selectedUserId) return;

    setIsDeleting(true);
    try {
      await conversationService.deleteConversation(currentUserId, selectedUserId);
      toast.success('Conversation deleted');
    } catch (error) {
      logger.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    } finally {
      setIsDeleting(false);
    }
  }, [currentUserId, selectedUserId]);

  return {
    handleSendMessage,
    handleDeleteConversation,
    isDeleting
  };
};
