
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const useMessageDeletion = (currentUserId: string, isVipUser: boolean) => {
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);

  const handleUnsendMessage = async (messageId: number) => {
    if (!isVipUser) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('sender_id', currentUserId);

      if (error) throw error;
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
      
      const { error: error1 } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('sender_id', currentUserId)
        .eq('receiver_id', partnerId);
        
      if (error1) throw error1;
      
      const { error: error2 } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('sender_id', partnerId)
        .eq('receiver_id', currentUserId);
      
      if (error2) throw error2;
      
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
