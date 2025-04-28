
import React from 'react';
import { MessageWithMedia } from '@/types/message';

interface MessageBubbleWrapperProps {
  message: MessageWithMedia;
  isCurrentUser: boolean;
  children: React.ReactNode;
}

export const MessageBubbleWrapper: React.FC<MessageBubbleWrapperProps> = ({ 
  message, 
  isCurrentUser, 
  children 
}) => {
  const isDeleted = message.deleted_at !== undefined && message.deleted_at !== null;
  
  return (
    <div
      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
      id={`message-${message.id}`}
    >
      <div
        className={`max-w-[80%] ${
          isDeleted 
            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 italic"
            : isCurrentUser
            ? "bg-blue-500 text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        } rounded-2xl px-4 py-2 relative`}
      >
        {children}
      </div>
    </div>
  );
};
