
import React from 'react';
import { MessageWithMedia } from '@/types/message';
import { cn } from '@/lib/utils';
import { MessageReplyContent } from './MessageReplyContent';

interface MessageBubbleWrapperProps {
  message: MessageWithMedia;
  replyMessage: MessageWithMedia | null;
  isCurrentUser: boolean;
  children: React.ReactNode;
}

export const MessageBubbleWrapper: React.FC<MessageBubbleWrapperProps> = ({
  message,
  replyMessage,
  isCurrentUser,
  children
}) => {
  // Determine if the message was deleted
  const isDeleted = !!message.deleted_at;
  
  return (
    <div
      className={cn(
        "group relative flex flex-col w-full max-w-[80%] mb-2",
        isCurrentUser ? "items-end ml-auto" : "items-start mr-auto"
      )}
    >
      {message.reply_to && replyMessage && (
        <MessageReplyContent 
          message={replyMessage} 
          isCurrentUser={isCurrentUser} 
        />
      )}
      
      <div
        className={cn(
          "px-4 py-2 rounded-lg break-words",
          isCurrentUser
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-muted rounded-bl-none",
          isDeleted && "opacity-50"
        )}
      >
        {children}
      </div>
    </div>
  );
};
