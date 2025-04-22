
import { useEffect, useRef } from 'react';
import { format } from 'date-fns';

interface Message {
  id: number;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
}

interface ChatAreaProps {
  messages: Message[];
  currentUserId: string;
}

export const ChatArea = ({ messages, currentUserId }: ChatAreaProps) => {
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
        <div
          key={message.id}
          className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[70%] rounded-lg p-3 ${
              message.sender_id === currentUserId
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            <p className="break-words">{message.content}</p>
            <span className={`text-xs ${
              message.sender_id === currentUserId
                ? 'text-primary-foreground/70'
                : 'text-muted-foreground'
            }`}>
              {format(new Date(message.created_at), 'HH:mm')}
            </span>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
