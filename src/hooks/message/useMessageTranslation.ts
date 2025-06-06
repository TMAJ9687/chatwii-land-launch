
import { useState } from 'react';
import { updateDocument } from '@/lib/firebase';
import { toast } from 'sonner';
import { MessageWithMedia } from '@/types/message';
import { debounce } from 'lodash';

export const useMessageTranslation = (currentUserId: string, isVipUser: boolean) => {
  const [translatingMessageId, setTranslatingMessageId] = useState<string | null>(null);

  const translateMessage = debounce(async (message: MessageWithMedia) => {
    if (!isVipUser || !message.content) return;
    
    try {
      setTranslatingMessageId(message.id);
      
      const apiUrl = new URL('https://api.mymemory.translated.net/get');
      apiUrl.searchParams.append('q', message.content);
      apiUrl.searchParams.append('langpair', 'auto|en');
      apiUrl.searchParams.append('de', 'temp@chatwii.com');
      
      const translationResponse = await fetch(apiUrl.toString());
      if (!translationResponse.ok) throw new Error('Translation failed');
      
      const data = await translationResponse.json();
      
      if (data.responseStatus !== 200 || !data.responseData) {
        throw new Error('Invalid translation response');
      }
      
      const translatedText = data.responseData.translatedText;
      const detectedLanguage = data.responseData.detectedLanguage || 'auto';
      
      await updateDocument('messages', message.id, {
        translated_content: translatedText,
        language_code: detectedLanguage
      });

      toast.success('Message translated');
    } catch (error) {
      console.error('Error translating message:', error);
      toast.error('Failed to translate message');
    } finally {
      setTranslatingMessageId(null);
    }
  }, 500);

  return {
    translateMessage,
    translatingMessageId
  };
};
