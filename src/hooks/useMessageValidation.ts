
import { useState } from "react";
import { 
  hasConsecutiveSameLetters, 
  hasConsecutiveNumbers, 
  hasLinkOrPhone, 
  getCharLimit 
} from "@/utils/messageValidation";

// Rate limit: maximum number of messages
const MAX_MESSAGES = 10;
// Rate limit: time window in seconds
const TIME_WINDOW = 10;
// Duplicate message cooldown in seconds
const DUPLICATE_COOLDOWN = 60;

export function useMessageValidation(isUserVip: boolean = false) {
  const [lastSentMessage, setLastSentMessage] = useState<{content: string, timestamp: number} | null>(null);
  const [messageTimestamps, setMessageTimestamps] = useState<number[]>([]);
  const [charLimit] = useState(getCharLimit(isUserVip));
  
  const validateMessage = (message: string, chatProfanityList: string[] = []) => {
    if (!message.trim()) {
      return { valid: false, message: "Message cannot be empty" };
    }
    
    // Check message length for all users
    if (message.length > charLimit) {
      return { valid: false, message: `Message exceeds ${charLimit} character limit` };
    }

    // Check for consecutive same letters (applies to both standard and VIP)
    if (hasConsecutiveSameLetters(message)) {
      return { valid: false, message: "Messages cannot contain more than 3 consecutive same letters" };
    }

    // For standard users, apply additional restrictions
    if (!isUserVip) {
      // Check for consecutive numbers
      if (hasConsecutiveNumbers(message)) {
        return { valid: false, message: "Messages cannot contain more than 3 consecutive numbers" };
      }

      // Check for links or phone numbers
      if (hasLinkOrPhone(message)) {
        return { valid: false, message: "Links and phone numbers are not allowed" };
      }
    }

    // Chat profanity filter (all users)
    if (chatProfanityList.some(word => message.toLowerCase().includes(word))) {
      return { valid: false, message: "Your message contains banned words" };
    }

    // Check for duplicate message (applies to all users)
    if (isDuplicateMessage(message)) {
      return { valid: false, message: "Please wait before sending the same message again" };
    }

    // Check for rate limiting (applies to all users)
    if (isRateLimited()) {
      return { valid: false, message: "You're sending messages too quickly. Please wait a moment." };
    }
    
    return { valid: true, message: "" };
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
  
  const recordMessage = (content: string) => {
    // Record this message for rate limiting
    const now = Date.now();
    setMessageTimestamps(prev => [...prev, now]);
    
    // Record last sent message for duplicate detection
    setLastSentMessage({ content: content.trim(), timestamp: now });
  };
  
  return { validateMessage, recordMessage };
}
