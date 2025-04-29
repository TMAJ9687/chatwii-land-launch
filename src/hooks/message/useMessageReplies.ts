
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { createDocument } from '@/lib/firebase';

export const useMessageReplies = (currentUserId: string, isVipUser: boolean) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  
  // Start replying to a message
  const startReply = useCallback((messageId: string) => {
    if (!isVipUser) {
      toast.error('Only VIP users can reply to messages');
      return;
    }
    
    setReplyToMessageId(messageId);
    setIsReplying(true);
  }, [isVipUser]);
  
  // Cancel replying
  const cancelReply = useCallback(() => {
    setIsReplying(false);
    setReplyToMessageId(null);
    setReplyContent('');
  }, []);
  
  // Send a reply to a message
  const handleReplyToMessage = useCallback(async (messageId: string, content: string) => {
    if (!currentUserId || !isVipUser) return;
    
    try {
      await createDocument('messages', {
        content,
        sender_id: currentUserId,
        receiver_id: '', // This will be set by the caller
        is_read: false,
        created_at: new Date().toISOString(),
        reply_to: messageId
      });
      
      cancelReply();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    }
  }, [currentUserId, isVipUser, cancelReply]);
  
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
