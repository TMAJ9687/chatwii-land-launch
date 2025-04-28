
import { useState } from 'react';

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
      
      console.log('Bot response:', response);
      
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
