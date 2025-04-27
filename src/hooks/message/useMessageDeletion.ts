
import { useState } from 'react';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export const useMessageDeletion = (currentUserId: string, isVipUser: boolean) => {
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);

  const handleUnsendMessage = async (messageId: string) => {
    if (!isVipUser) return;

    try {
      const messageRef = doc(db, 'messages', messageId);
      
      await updateDoc(messageRef, { 
        deleted_at: new Date().toISOString() 
      });
      
      toast.success('Message unsent');
    } catch (error) {
      console.error('Error unsending message:', error);
      toast.error('Failed to unsend message');
    }
  };

  const deleteConversation = async (partnerId: string): Promise<void> => {
    if (!isVipUser || isDeletingConversation) return;

    try {
      setIsDeletingConversation(true);
      toast.loading('Deleting conversation...');
      
      // Get messages sent by current user to partner
      const sentMessagesQuery = query(
        collection(db, 'messages'),
        where('sender_id', '==', currentUserId),
        where('receiver_id', '==', partnerId)
      );
      
      const sentMessagesDocs = await getDocs(sentMessagesQuery);
      
      // Get messages received by current user from partner
      const receivedMessagesQuery = query(
        collection(db, 'messages'),
        where('sender_id', '==', partnerId),
        where('receiver_id', '==', currentUserId)
      );
      
      const receivedMessagesDocs = await getDocs(receivedMessagesQuery);
      
      // Update all messages to mark as deleted
      const updatePromises = [];
      
      for (const doc of sentMessagesDocs.docs) {
        updatePromises.push(
          updateDoc(doc.ref, { deleted_at: new Date().toISOString() })
        );
      }
      
      for (const doc of receivedMessagesDocs.docs) {
        updatePromises.push(
          updateDoc(doc.ref, { deleted_at: new Date().toISOString() })
        );
      }
      
      await Promise.all(updatePromises);
      
      toast.dismiss();
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.dismiss();
      toast.error('Failed to delete conversation');
    } finally {
      setIsDeletingConversation(false);
    }
  };

  return {
    handleUnsendMessage,
    deleteConversation,
    isDeletingConversation
  };
};
