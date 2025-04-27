
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const useMessageReactions = (currentUserId: string, isVipUser: boolean) => {
  const handleReactToMessage = async (messageId: number, emoji: string) => {
    if (!isVipUser) return;

    try {
      const { data: existingReaction } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', currentUserId)
        .maybeSingle();
        
      if (existingReaction) {
        const { error } = await supabase
          .from('message_reactions')
          .update({ emoji })
          .eq('id', existingReaction.id);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: currentUserId,
            emoji
          });
          
        if (error) throw error;
      }
      
      toast.success('Reaction added');
    } catch (error) {
      console.error('Error reacting to message:', error);
      toast.error('Failed to add reaction');
    }
  };

  return { handleReactToMessage };
};
