
import React from 'react';
import { MessageWithMedia } from '@/types/message';
import { cn } from '@/lib/utils';
import { createLogger } from '@/utils/logger';

const logger = createLogger('MessageReplyContent');

interface MessageReplyContentProps {
  message: MessageWithMedia; 
  isCurrentUser: boolean;
}

export const MessageReplyContent: React.FC<MessageReplyContentProps> = ({ message, isCurrentUser }) => {
  if (!message) {
    logger.warn('Reply message not found');
    return null;
  }

  return (
    <div 
      className={cn(
        "p-2 mb-2 text-xs border-l-2 rounded",
        isCurrentUser
          ? "border-l-primary-foreground/50 bg-primary-foreground/10"
          : "border-l-muted-foreground/50 bg-muted-foreground/10"
      )}
    >
      <div className="line-clamp-2">
        {message.content || (message.media ? '[Image]' : '[Message not available]')}
      </div>
    </div>
  );
};
