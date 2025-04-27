
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const useMessageReplies = (currentUserId: string, isVipUser: boolean) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyToMessageId, setReplyToMessageId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState<string>('');

  const startReply = (messageId: number) => {
    if (!isVipUser) return;
    setIsReplying(true);
    setReplyToMessageId(messageId);
  };

  const cancelReply = () => {
    setIsReplying(false);
    setReplyToMessageId(null);
    setReplyContent('');
  };

  const handleReplyToMessage = async (messageId: number, content: string): Promise<void> => {
    if (!isVipUser || !content) return;
    
    try {
      const { data: originalMessage, error: fetchError } = await supabase
        .from('messages')
        .select('sender_id, receiver_id')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;

      const receiverId = originalMessage.sender_id === currentUserId 
        ? originalMessage.receiver_id 
        : originalMessage.sender_id;

      const { error } = await supabase
        .from('messages')
        .insert({
          content,
          sender_id: currentUserId,
          receiver_id: receiverId,
          reply_to: messageId,
          is_read: false
        });

      if (error) throw error;
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
