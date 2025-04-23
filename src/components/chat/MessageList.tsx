
import { useRef, useEffect } from 'react';
import { MessageWithMedia } from '@/types/message';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: MessageWithMedia[];
  currentUserId: string;
  onImageClick: (url: string) => void;
  revealedImages: Set<number>;
  toggleImageReveal: (messageId: number) => void;
}

export const MessageList = ({ 
  messages, 
  currentUserId, 
  onImageClick,
  revealedImages,
  toggleImageReveal
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
