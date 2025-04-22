
import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { toast } from 'sonner';
import { EmojiClickData } from 'emoji-picker-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  hasConsecutiveSameLetters, 
  hasConsecutiveNumbers, 
  hasLinkOrPhone, 
  getCharLimit 
} from '@/utils/messageValidation';

// Rate limit: maximum number of messages
const MAX_MESSAGES = 10;
// Rate limit: time window in seconds
const TIME_WINDOW = 10;
// Duplicate message cooldown in seconds
const DUPLICATE_COOLDOWN = 60;

interface UseMessageInputProps {
  onSendMessage: (content: string) => void;
}

export const useMessageInput = ({ onSendMessage }: UseMessageInputProps) => {
  const [message, setMessage] = useState('');
  const [isUserVip, setIsUserVip] = useState(false);
  const [lastSentMessage, setLastSentMessage] = useState<{content: string, timestamp: number} | null>(null);
  const [messageTimestamps, setMessageTimestamps] = useState<number[]>([]);
  const [charLimit, setCharLimit] = useState(getCharLimit(false));
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch user role on component mount
  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('role, vip_status')
          .eq('id', session.user.id)
          .single();
        
        const isVip = data?.role === 'vip' || data?.vip_status === true;
        setIsUserVip(isVip);
        setCharLimit(getCharLimit(isVip));
      }
    };

    fetchUserRole();
  }, []);

  // Check for rate limiting
  const isRateLimited = (): boolean => {
    const now = Date.now();
    const windowStart = now - (TIME_WINDOW * 1000);
    
    // Count messages sent within the time window
    const recentMessages = messageTimestamps.filter(timestamp => timestamp > windowStart);
    return recentMessages.length >= MAX_MESSAGES;
  };

  // Check for duplicate message
  const isDuplicateMessage = (content: string): boolean => {
    if (!lastSentMessage) return false;
    
    const now = Date.now();
    const timeSinceLastMessage = now - lastSentMessage.timestamp;
    
    return content === lastSentMessage.content && 
           timeSinceLastMessage < (DUPLICATE_COOLDOWN * 1000);
  };

  const handleSend = () => {
    if (!message.trim()) return;
    
    // Check message length for all users
    if (message.length > charLimit) {
      toast.error(`Message exceeds ${charLimit} character limit`);
      return;
    }

    // Check for consecutive same letters (applies to both standard and VIP)
    if (hasConsecutiveSameLetters(message)) {
      toast.error("Messages cannot contain more than 3 consecutive same letters");
      return;
    }

    // For standard users, apply additional restrictions
    if (!isUserVip) {
      // Check for consecutive numbers
      if (hasConsecutiveNumbers(message)) {
        toast.error("Messages cannot contain more than 3 consecutive numbers");
        return;
      }

      // Check for links or phone numbers
      if (hasLinkOrPhone(message)) {
        toast.error("Links and phone numbers are not allowed");
        return;
      }
    }

    // Check for duplicate message (applies to all users)
    if (isDuplicateMessage(message)) {
      toast.error("Please wait before sending the same message again");
      return;
    }

    // Check for rate limiting (applies to all users)
    if (isRateLimited()) {
      toast.error(`You're sending messages too quickly. Please wait a moment.`);
      return;
    }

    // Record this message for rate limiting
    const now = Date.now();
    setMessageTimestamps(prev => [...prev, now]);
    
    // Record last sent message for duplicate detection
    setLastSentMessage({ content: message.trim(), timestamp: now });
    
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
