
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface MessageValidationResult {
  valid: boolean;  // Changed from isValid
  message: string;
}

export const useMessageValidation = (isVip: boolean = false) => {
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);
  const [lastMessageContent, setLastMessageContent] = useState<string>('');
  const [messageCount, setMessageCount] = useState<number>(0);
  const [warningCount, setWarningCount] = useState<number>(0);

  const validateMessage = useCallback((content: string, profanityList?: string[]): MessageValidationResult => {
    // Empty message check
    if (!content || content.trim().length === 0) {
      return { 
        valid: false, 
        message: 'Message cannot be empty' 
      };
    }

    // Length check
    if (content.length > 1000) {
      return { 
        valid: false, 
        message: 'Message is too long (max 1000 characters)' 
      };
    }

    // Profanity check
    if (profanityList && profanityList.length > 0) {
      const contentLower = content.toLowerCase();
      for (const word of profanityList) {
        if (contentLower.includes(word.toLowerCase())) {
          return { 
            valid: false, 
            message: 'Message contains inappropriate language' 
          };
        }
      }
    }

    // Spam protection - duplicate message
    if (content === lastMessageContent) {
      return { 
        valid: false, 
        message: 'Please don\'t send the same message repeatedly' 
      };
    }

    // Spam protection - rate limiting
    const now = Date.now();
    const timeSinceLastMessage = now - lastMessageTime;
    
    // Non-VIP users have stricter rate limiting
    if (!isVip && timeSinceLastMessage < 1000) {
      return { 
        valid: false, 
        message: 'You\'re sending messages too quickly' 
      };
    }

    return { valid: true, message: '' };
  }, [lastMessageTime, lastMessageContent, isVip]);

  const recordMessage = useCallback((content: string) => {
    const now = Date.now();
    setLastMessageTime(now);
    setLastMessageContent(content);
    setMessageCount(prev => prev + 1);
  }, []);

  return { 
    validateMessage, 
    recordMessage, 
    messageCount 
  };
};
