
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { MessageWithMedia } from '@/types/message';
import { debounce } from 'lodash';

export const useMessageActions = (currentUserId: string, isVipUser: boolean) => {
  const [translatingMessageId, setTranslatingMessageId] = useState<number | null>(null);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyToMessageId, setReplyToMessageId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState<string>('');

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

  const handleReplyToMessage = async (messageId: number, content: string) => {
    if (!isVipUser || !content) return;
    
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
      toast.success('Reply sent');
      
      // Reset reply state
      cancelReply();
    } catch (error) {
      console.error('Error replying to message:', error);
      toast.error('Failed to send reply');
    }
  };

  const handleReactToMessage = async (messageId: number, emoji: string) => {
    if (!isVipUser) return;

    try {
      // First try to update any existing reaction by this user on this message
      const { data: existingReaction } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', currentUserId)
        .maybeSingle();
        
      if (existingReaction) {
        // Update existing reaction
        const { error } = await supabase
          .from('message_reactions')
          .update({ emoji })
          .eq('id', existingReaction.id);
          
        if (error) throw error;
      } else {
        // Insert new reaction
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

  const translateMessage = debounce(async (message: MessageWithMedia) => {
    if (!isVipUser || !message.content) return;
    
    try {
      setTranslatingMessageId(message.id);
      
      // Using a more reliable translation service that doesn't require API keys
      const response = await fetch('https://api.mymemory.translated.net/get', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        // Using query parameters instead of body for GET request
        // Add a fake email to increase rate limit (can be replaced with user's email in production)
        // The langpair parameter auto-detects source language and translates to English
      });

      const apiUrl = new URL('https://api.mymemory.translated.net/get');
      apiUrl.searchParams.append('q', message.content);
      apiUrl.searchParams.append('langpair', 'auto|en');
      apiUrl.searchParams.append('de', 'temp@chatwii.com'); // Add a dummy email to increase rate limit
      
      const response = await fetch(apiUrl.toString());
      if (!response.ok) throw new Error('Translation failed');
      
      const data = await response.json();
      
      if (data.responseStatus !== 200 || !data.responseData) {
        throw new Error('Invalid translation response');
      }
      
      const translatedText = data.responseData.translatedText;
      const detectedLanguage = data.responseData.detectedLanguage || 'auto';
      
      const { error } = await supabase
        .from('messages')
        .update({
          translated_content: translatedText,
          language_code: detectedLanguage
        })
        .eq('id', message.id);

      if (error) throw error;
      toast.success('Message translated');
    } catch (error) {
      console.error('Error translating message:', error);
      toast.error('Failed to translate message');
    } finally {
      setTranslatingMessageId(null);
    }
  }, 500);

  const deleteConversation = async (partnerId: string) => {
    if (!isVipUser || isDeletingConversation) return;

    try {
      setIsDeletingConversation(true);
      toast.loading('Deleting conversation...');
      
      // First, delete messages sent by current user to partner
      const { error: error1 } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('sender_id', currentUserId)
        .eq('receiver_id', partnerId);
        
      if (error1) throw error1;
      
      // Then, delete messages received by current user from partner
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
    startReply,
    cancelReply,
    setReplyContent,
    handleReplyToMessage,
    handleReactToMessage,
    translateMessage,
    deleteConversation,
    translatingMessageId,
    isDeletingConversation,
    isReplying,
    replyToMessageId,
    replyContent
  };
};
