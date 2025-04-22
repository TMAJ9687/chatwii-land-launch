
import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Smile } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { toast } from 'sonner';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { supabase } from '@/integrations/supabase/client';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
}

// Maximum character limit for standard users
const STANDARD_CHAR_LIMIT = 120;
// Maximum character limit for VIP users
const VIP_CHAR_LIMIT = 200;
// Rate limit: maximum number of messages
const MAX_MESSAGES = 10;
// Rate limit: time window in seconds
const TIME_WINDOW = 10;
// Duplicate message cooldown in seconds
const DUPLICATE_COOLDOWN = 60;

export const MessageInput = ({ onSendMessage }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [isUserVip, setIsUserVip] = useState(false);
  const [lastSentMessage, setLastSentMessage] = useState<{content: string, timestamp: number} | null>(null);
  const [messageTimestamps, setMessageTimestamps] = useState<number[]>([]);
  const [charLimit, setCharLimit] = useState(STANDARD_CHAR_LIMIT);
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
        setCharLimit(isVip ? VIP_CHAR_LIMIT : STANDARD_CHAR_LIMIT);
      }
    };

    fetchUserRole();
  }, []);

  // Check for consecutive same letters (applies to both standard and VIP)
  const hasConsecutiveSameLetters = (text: string): boolean => {
    return /(.)\1\1\1/.test(text); // More than 3 consecutive same letters
  };

  // Check for consecutive numbers
  const hasConsecutiveNumbers = (text: string): boolean => {
    return /\d{4,}/.test(text);
  };

  // Check for links or phone numbers (only applies to standard users)
  const hasLinkOrPhone = (text: string): boolean => {
    // Check for URLs (http, https, www)
    const urlPattern = /(https?:\/\/|www\.)[^\s]+/i;
    // Check for phone number patterns (simplistic check)
    const phonePattern = /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
    
    return urlPattern.test(text) || phonePattern.test(text);
  };

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

    const currentCharLimit = isUserVip ? VIP_CHAR_LIMIT : STANDARD_CHAR_LIMIT;
    
    // Check message length for all users
    if (message.length > currentCharLimit) {
      toast.error(`Message exceeds ${currentCharLimit} character limit`);
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

  return (
    <div className="p-4 border-t border-border flex gap-2 items-center bg-background">
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
          >
            <Smile className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" sideOffset={5} align="start">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </PopoverContent>
      </Popover>
      
      <div className="flex-1 relative">
        <Input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="pr-16" // Make room for the character counter
          maxLength={charLimit}
        />
        <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
          message.length > charLimit ? 'text-destructive' : 'text-muted-foreground'
        }`}>
          {message.length}/{charLimit}
        </div>
      </div>
      
      <Button 
        onClick={handleSend}
        size="icon"
        className="rounded-full"
        disabled={!message.trim() || message.length > charLimit}
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
};
