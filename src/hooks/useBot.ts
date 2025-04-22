
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useBot = () => {
  const [isBotResponding, setIsBotResponding] = useState(false);

  const generateBotResponse = (originalMessage: string): string => {
    const responses = [
      "Hi there! Thanks for your message.",
      "I understand.",
      "That's interesting!",
      `You said: ${originalMessage}`,
      "Thanks for reaching out!",
      "I appreciate your message.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleBotResponse = async (
    botId: string,
    userId: string,
    originalMessage: string
  ) => {
    try {
      setIsBotResponding(true);
      
      // Random delay between 3-9 seconds
      const delay = Math.floor(Math.random() * (9000 - 3000 + 1) + 3000);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const response = generateBotResponse(originalMessage);
      
      const { error } = await supabase
        .from('messages')
        .insert({
          content: response,
          sender_id: botId,
          receiver_id: userId,
          is_read: false,
        });
      
      if (error) {
        console.error('Error sending bot response:', error);
        throw error;
      }
      
    } catch (error) {
      console.error('Bot response error:', error);
    } finally {
      setIsBotResponding(false);
    }
  };

  return {
    handleBotResponse,
    isBotResponding
  };
};
