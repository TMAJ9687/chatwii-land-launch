
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { updateDocument } from '@/lib/firebase';
import { MessageWithMedia } from '@/types/message';

export const useMessageTranslation = (currentUserId: string, isVipUser: boolean) => {
  const [translatingMessageId, setTranslatingMessageId] = useState<string | null>(null);
  
  // Translate a message
  const translateMessage = useCallback(async (message: MessageWithMedia) => {
    if (!isVipUser) {
      toast.error('Only VIP users can translate messages');
      return;
    }
    
    // Skip if already translated
    if (message.translated_content) {
      toast.info('Message already translated');
      return;
    }
    
    setTranslatingMessageId(message.id);
    
    try {
      // Mock translation for demo purposes
      const translatedText = `[Translated] ${message.content}`;
      
      // Update the message with translated content
      await updateDocument('messages', message.id, {
        translated_content: translatedText,
        language_code: 'en' // Assuming we translate to English
      });
      
      toast.success('Message translated');
    } catch (error) {
      console.error('Error translating message:', error);
      toast.error('Failed to translate message');
    } finally {
      setTranslatingMessageId(null);
    }
  }, [isVipUser]);
  
  return {
    translateMessage,
    translatingMessageId
  };
};
