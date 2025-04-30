
import React from 'react';
import { MessageWithMedia } from '@/types/message';
import { cn } from '@/lib/utils';
import { MessageReplyContent } from './MessageReplyContent';

interface MessageBubbleWrapperProps {
  message: MessageWithMedia;
  isCurrentUser: boolean;
  replyMessage: MessageWithMedia | null;
  children: React.ReactNode;
}

export const MessageBubbleWrapper: React.FC<MessageBubbleWrapperProps> = ({
  message,
  isCurrentUser,
  replyMessage,
  children
}) => {
  const isDeleted = !!message.deleted_at;
  
  return (
    <div 
      className={cn(
        "flex mb-4", 
        isCurrentUser ? "justify-end" : "justify-start"
      )}
      data-message-id={message.id}
    >
      <div
        className={cn(
          "rounded-lg px-3 py-2 max-w-[80%]",
          isCurrentUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted",
          isDeleted && "opacity-60"
        )}
      >
        {/* Display replied message if this is a reply */}
        {message.reply_to && replyMessage && (
          <MessageReplyContent 
            message={replyMessage} 
            isCurrentUser={isCurrentUser} 
          />
        )}
        
        {/* Message content and children components */}
        {children}
      </div>
    </div>
  );
};
