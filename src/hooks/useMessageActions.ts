
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { MessageWithMedia } from '@/types/message';
import { debounce } from 'lodash';

export const useMessageActions = (currentUserId: string, isVipUser: boolean) => {
  const [translatingMessageId, setTranslatingMessageId] = useState<number | null>(null);

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

  const handleReplyToMessage = async (messageId: number, content: string) => {
    if (!isVipUser) return;
    
    try {
      // First, we need to get the original message to know the receiver_id
      const { data: originalMessage, error: fetchError } = await supabase
        .from('messages')
        .select('sender_id, receiver_id')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;

      // Determine the receiver_id - if the current user sent the original message,
      // reply to the person who received it, otherwise reply to the sender
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
    } catch (error) {
      console.error('Error replying to message:', error);
      toast.error('Failed to send reply');
    }
  };

  const handleReactToMessage = async (messageId: number, emoji: string) => {
    if (!isVipUser) return;

    try {
      const { error } = await supabase
        .from('message_reactions')
        .upsert({
          message_id: messageId,
          user_id: currentUserId,
          emoji
        }, {
          onConflict: 'message_id,user_id,emoji'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error reacting to message:', error);
      toast.error('Failed to add reaction');
    }
  };

  const translateMessage = debounce(async (message: MessageWithMedia) => {
    if (!isVipUser || !message.content) return;
    
    try {
      setTranslatingMessageId(message.id);
      
      const response = await fetch('https://libretranslate.com/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: message.content,
          source: 'auto',
          target: 'en' // Default to English, could be made configurable
        })
      });

      if (!response.ok) throw new Error('Translation failed');
      
      const data = await response.json();
      
      const { error } = await supabase
        .from('messages')
        .update({
          translated_content: data.translatedText,
          language_code: data.detectedLanguage?.language || 'unknown'
        })
        .eq('id', message.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error translating message:', error);
      toast.error('Failed to translate message');
    } finally {
      setTranslatingMessageId(null);
    }
  }, 500);

  const deleteConversation = async (partnerId: string) => {
    if (!isVipUser) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUserId})`);

      if (error) throw error;
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  return {
    handleUnsendMessage,
    handleReplyToMessage,
    handleReactToMessage,
    translateMessage,
    deleteConversation,
    translatingMessageId
  };
};
