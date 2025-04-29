
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { createLogger } from '@/utils/logger';
import { messageService, conversationService } from '@/services/message';

const logger = createLogger('useMessageDeletion');

export const useMessageDeletion = (currentUserId: string, isVipUser: boolean) => {
  const [isDeletingMessage, setIsDeletingMessage] = useState<string | null>(null);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);

  const handleUnsendMessage = useCallback(async (messageId: string, senderId: string) => {
    // Only allow deleting your own messages
    if (senderId !== currentUserId) {
      toast.error("You can only unsend your own messages");
      return false;
    }

    setIsDeletingMessage(messageId);
    try {
      await messageService.deleteMessage(messageId);
      toast.success("Message unsent");
      return true;
    } catch (error) {
      logger.error("Error unsending message:", error);
      toast.error("Failed to unsend message");
      return false;
    } finally {
      setIsDeletingMessage(null);
    }
  }, [currentUserId]);

  const deleteConversation = useCallback(async (receiverId: string) => {
    if (!currentUserId) return false;

    setIsDeletingConversation(true);
    try {
      await conversationService.deleteConversation(currentUserId, receiverId);
      toast.success("Conversation deleted");
      return true;
    } catch (error) {
      logger.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
      return false;
    } finally {
      setIsDeletingConversation(false);
    }
  }, [currentUserId]);

  return {
    handleUnsendMessage,
    deleteConversation,
    isDeletingMessage,
    isDeletingConversation
  };
};
