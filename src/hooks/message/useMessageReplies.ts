
import { useState } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export const useMessageReplies = (currentUserId: string, isVipUser: boolean) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<string>('');

  const startReply = (messageId: string) => {
    if (!isVipUser) return;
    setIsReplying(true);
    setReplyToMessageId(messageId);
  };

  const cancelReply = () => {
    setIsReplying(false);
    setReplyToMessageId(null);
    setReplyContent('');
  };

  const handleReplyToMessage = async (messageId: string, content: string): Promise<void> => {
    if (!isVipUser || !content) return;
    
    try {
      // Get the original message
      const messagesQuery = query(
        collection(db, 'messages'),
        where('id', '==', messageId)
      );
      
      const messageDocs = await getDocs(messagesQuery);
      
      if (messageDocs.empty) {
        throw new Error('Original message not found');
      }
      
      const originalMessage = messageDocs.docs[0].data();
      
      // Determine receiver ID
      const receiverId = originalMessage.sender_id === currentUserId 
        ? originalMessage.receiver_id 
        : originalMessage.sender_id;

      // Create the reply message
      await addDoc(collection(db, 'messages'), {
        content,
        sender_id: currentUserId,
        receiver_id: receiverId,
        reply_to: messageId,
        is_read: false,
        created_at: new Date().toISOString()
      });

      toast.success('Reply sent');
      
      cancelReply();
    } catch (error) {
      console.error('Error replying to message:', error);
      toast.error('Failed to send reply');
    }
  };

  return {
    isReplying,
    replyToMessageId,
    replyContent,
    setReplyContent,
    startReply,
    cancelReply,
    handleReplyToMessage
  };
};
