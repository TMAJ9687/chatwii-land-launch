
import React from 'react';
import { MessageWithMedia } from '@/types/message';
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

interface MessageReplyContentProps {
  message: MessageWithMedia;
  isCurrentUser: boolean;
}

export const MessageReplyContent: React.FC<MessageReplyContentProps> = ({
  message,
  isCurrentUser
}) => {
  const hasMedia = !!message.media;
  const isDeleted = !!message.deleted_at;
  
  return (
    <div
      className={cn(
        "flex items-center gap-1 mb-1 px-2 py-1 text-xs",
        "border-l-2 rounded-sm max-w-[90%]",
        isCurrentUser ? "ml-auto bg-primary/10 border-primary/30" : "mr-auto bg-muted/50 border-muted-foreground/30"
      )}
    >
      <MessageSquare className="h-3 w-3 flex-shrink-0" />
      <span className="truncate">
        {isDeleted ? (
          <span className="italic">This message was deleted</span>
        ) : hasMedia && !message.content ? (
          <span>[Image]</span>
        ) : message.content || "[Empty message]"}
      </span>
    </div>
  );
};
