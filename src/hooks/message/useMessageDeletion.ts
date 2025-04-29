
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { updateDocument, queryDocuments, deleteDocument } from '@/lib/firebase';
import { isMockUser } from '@/utils/mockUsers';

export const useMessageDeletion = (currentUserId: string, isVipUser: boolean) => {
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  
  // Delete a single message (mark as deleted)
  const handleUnsendMessage = useCallback(async (messageId: string) => {
    if (!currentUserId || !isVipUser) return;
    
    try {
      await updateDocument('messages', messageId, {
        deleted_at: new Date().toISOString(),
        content: '[Message removed]'
      });
      toast.success('Message removed');
    } catch (error) {
      console.error('Error unsending message:', error);
      toast.error('Failed to remove message');
    }
  }, [currentUserId, isVipUser]);

  // Delete an entire conversation between two users
  const deleteConversation = useCallback(async (otherUserId: string) => {
    if (!currentUserId || !isVipUser) return;
    
    // Skip for mock users
    if (isMockUser(otherUserId)) {
      console.log('Skipping delete conversation for mock user');
      return;
    }
    
    setIsDeletingConversation(true);
    
    try {
      // Fetch all messages between these two users
      const [sentMessages, receivedMessages] = await Promise.all([
        queryDocuments('messages', [
          { field: 'sender_id', operator: '==', value: currentUserId },
          { field: 'receiver_id', operator: '==', value: otherUserId }
        ]),
        queryDocuments('messages', [
          { field: 'sender_id', operator: '==', value: otherUserId },
          { field: 'receiver_id', operator: '==', value: currentUserId }
        ])
      ]);
      
      const allMessages = [...sentMessages, ...receivedMessages];
      
      // Mark all messages as deleted
      const updatePromises = allMessages.map(message => 
        updateDocument('messages', message.id, {
          deleted_at: new Date().toISOString(),
          content: '[Message removed]'
        })
      );
      
      await Promise.all(updatePromises);
      
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    } finally {
      setIsDeletingConversation(false);
    }
  }, [currentUserId, isVipUser]);
  
  return {
    handleUnsendMessage,
    deleteConversation,
    isDeletingConversation
  };
};
