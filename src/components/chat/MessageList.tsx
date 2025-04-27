
import { useRef, useEffect } from 'react';
import { MessageWithMedia } from '@/types/message';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

interface MessageListProps {
  messages: MessageWithMedia[];
  currentUserId: string;
  onImageClick: (url: string) => void;
  revealedImages: Set<string>; // Changed from Set<number> to Set<string>
  toggleImageReveal: (messageId: string) => void;
  isTyping?: boolean;
  isVipUser?: boolean;
}

export const MessageList = ({ 
  messages, 
  currentUserId, 
  onImageClick,
  revealedImages,
  toggleImageReveal,
  isTyping = false,
  isVipUser = false
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          currentUserId={currentUserId}
          onImageClick={onImageClick}
          revealedImages={revealedImages}
          toggleImageReveal={toggleImageReveal}
          isVipUser={isVipUser}
        />
      ))}
      
      {isTyping && isVipUser && (
        <TypingIndicator />
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};
