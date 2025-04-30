
import { doc, collection, query, where, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export const useMessageReactions = (currentUserId: string, isVipUser: boolean) => {
  const handleReactToMessage = async (messageId: string, emoji: string) => {
    if (!isVipUser) return;

    try {
      // Check for existing reaction
      const reactionsQuery = query(
        collection(db, 'message_reactions'),
        where('message_id', '==', messageId),
        where('user_id', '==', currentUserId)
      );
      
      const existingReactions = await getDocs(reactionsQuery);
      
      if (!existingReactions.empty) {
        // Update existing reaction
        const existingReaction = existingReactions.docs[0];
        await updateDoc(existingReaction.ref, { emoji });
      } else {
        // Create new reaction
        await addDoc(collection(db, 'message_reactions'), {
          message_id: messageId,
          user_id: currentUserId,
          emoji,
          created_at: new Date().toISOString()
        });
      }
      
      toast.success('Reaction added');
    } catch (error) {
      console.error('Error reacting to message:', error);
      toast.error('Failed to add reaction');
    }
  };

  return { handleReactToMessage };
};
