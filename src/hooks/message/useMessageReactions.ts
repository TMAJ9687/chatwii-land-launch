
import { useCallback } from 'react';
import { toast } from 'sonner';
import { createDocument, queryDocuments, deleteDocument } from '@/lib/firebase';

export const useMessageReactions = (currentUserId: string, isVipUser: boolean) => {
  // Add or remove a reaction to a message
  const handleReactToMessage = useCallback(async (messageId: string, emoji: string) => {
    if (!isVipUser || !currentUserId) {
      toast.error('Only VIP users can react to messages');
      return;
    }
    
    try {
      // Check if user already reacted with this emoji
      const existingReactions = await queryDocuments('message_reactions', [
        { field: 'message_id', operator: '==', value: messageId },
        { field: 'user_id', operator: '==', value: currentUserId },
        { field: 'emoji', operator: '==', value: emoji }
      ]);
      
      if (existingReactions.length > 0) {
        // Remove the reaction
        await deleteDocument('message_reactions', existingReactions[0].id);
        return;
      }
      
      // Add the new reaction
      await createDocument('message_reactions', {
        message_id: messageId,
        user_id: currentUserId,
        emoji: emoji,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast.error('Failed to add reaction');
    }
  }, [currentUserId, isVipUser]);
  
  return {
    handleReactToMessage
  };
};
