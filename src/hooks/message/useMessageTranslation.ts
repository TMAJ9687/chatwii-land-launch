
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { updateDocument } from '@/lib/firebase';
import { MessageWithMedia } from '@/types/message';
import { createLogger } from '@/utils/logger';

const logger = createLogger('messageTranslation');

// Language codes for translation
export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ar', label: 'Arabic' },
  { value: 'ru', label: 'Russian' }
];

export const useMessageTranslation = (currentUserId: string, isVipUser: boolean) => {
  const [translatingMessageId, setTranslatingMessageId] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<string>('en'); // Default to English
  
  // Detect language from text
  const detectLanguage = async (text: string): Promise<string> => {
    // For now, simplified detection - would use a real API in production
    // This is a placeholder implementation
    const hasChineseOrJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(text);
    const hasCyrillic = /[\u0400-\u04FF]/.test(text);
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    
    if (hasChineseOrJapanese) return 'zh';
    if (hasCyrillic) return 'ru';
    if (hasArabic) return 'ar';
    
    // Default to English for now
    return 'en';
  };

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
      // Detect source language
      const sourceLanguage = await detectLanguage(message.content);
      
      // Skip translation if already in target language
      if (sourceLanguage === targetLanguage) {
        toast.info(`Message appears to already be in ${targetLanguage}`);
        setTranslatingMessageId(null);
        return;
      }
      
      // In a real implementation, we would call a translation API here
      // For now, we'll use a simulation
      logger.debug(`Translating from ${sourceLanguage} to ${targetLanguage}: ${message.content}`);
      
      // PLACEHOLDER: In production, replace with actual API call
      // Simulated API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock translated text (in production, use a real translation API)
      const translatedText = `[Translated to ${targetLanguage}] ${message.content}`;
      
      // Update the message with translated content
      await updateDocument('messages', message.id, {
        translated_content: translatedText,
        language_code: sourceLanguage
      });
      
      toast.success('Message translated');
    } catch (error) {
      logger.error('Error translating message:', error);
      toast.error('Failed to translate message');
    } finally {
      setTranslatingMessageId(null);
    }
  }, [isVipUser, targetLanguage]);
  
  return {
    translateMessage,
    translatingMessageId,
    targetLanguage,
    setTargetLanguage,
    availableLanguages: LANGUAGE_OPTIONS
  };
};
