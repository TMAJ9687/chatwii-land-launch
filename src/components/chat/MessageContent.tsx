
import React from 'react';
import { MessageWithMedia } from '@/types/message';

interface MessageContentProps {
  message: MessageWithMedia;
  isCurrentUser: boolean;
}

export const MessageContent: React.FC<MessageContentProps> = ({ message, isCurrentUser }) => {
  if (!message.content && !message.deleted_at) return null;

  if (message.deleted_at) {
    return <p className="italic text-sm opacity-70">Message removed</p>;
  }

  // Handle error messages with special formatting
  if (message.content.includes('Error:') || message.content.includes('Failed to')) {
    return (
      <div>
        <p className="break-words text-red-600 dark:text-red-400">{message.content}</p>
        {message.translated_content && (
          <p className="text-sm opacity-70 mt-1 italic">
            {message.translated_content}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="break-words">{message.content}</p>
      {message.translated_content && (
        <p className="text-sm opacity-70 mt-1 italic">
          {message.translated_content}
        </p>
      )}
    </div>
  );
};
