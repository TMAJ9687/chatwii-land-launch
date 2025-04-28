
import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { toast } from 'sonner';
import { EmojiClickData } from 'emoji-picker-react';
import { getCharLimit } from '@/utils/messageValidation';
import { useMessageValidation } from '@/hooks/useMessageValidation';
import { useProfanityList } from '@/hooks/useProfanityList';

interface UseMessageInputProps {
  onSendMessage: (content: string) => void;
}

export const useMessageInput = ({ onSendMessage }: UseMessageInputProps) => {
  const [message, setMessage] = useState('');
  const [isUserVip, setIsUserVip] = useState(false);
  const [charLimit, setCharLimit] = useState(getCharLimit(false));
  const { profanityList: chatProfanityList } = useProfanityList('chat');
  const { validateMessage, recordMessage } = useMessageValidation(isUserVip);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock implementation for fetching user role
  useEffect(() => {
    setIsUserVip(false);
    setCharLimit(getCharLimit(false));
  }, []);

  const handleSend = () => {
    if (!message.trim()) return;
    
    // Validate the message
    const { valid, message: errorMessage } = validateMessage(message, chatProfanityList);
    if (!valid) {
      toast.error(errorMessage);
      return;
    }
    
    // Record this message for rate limiting and duplicate detection
    recordMessage(message);
    
    onSendMessage(message.trim());
    setMessage('');
  };

  const handleTextSend = () => {
    console.log('Text-only message being sent');
    handleSend();
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    const cursorPosition = inputRef.current?.selectionStart || message.length;
    const newMessage = 
      message.slice(0, cursorPosition) + 
      emoji + 
      message.slice(cursorPosition);
    
    setMessage(newMessage);
    
    // Focus back on input after emoji selection
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.selectionStart = cursorPosition + emoji.length;
        inputRef.current.selectionEnd = cursorPosition + emoji.length;
      }
    }, 10);
  };

  return {
    message,
    setMessage,
    charLimit,
    isUserVip,
    inputRef,
    handleSend,
    handleTextSend,
    handleKeyPress,
    handleEmojiClick
  };
};
