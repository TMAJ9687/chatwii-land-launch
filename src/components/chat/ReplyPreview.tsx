
import React from 'react';
import { MessageWithMedia } from '@/types/message';

interface ReplyPreviewProps {
  replyMessage: MessageWithMedia | null;
  isCurrentUser: boolean;
}

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({ replyMessage, isCurrentUser }) => {
  if (!replyMessage) return null;

  return (
    <div className={`text-sm opacity-80 mb-2 pb-1 border-b ${
      isCurrentUser
        ? 'border-primary-foreground/20'
        : 'border-muted-foreground/20'
    }`}>
      <div className="font-medium mb-0.5">↪️ Reply to</div>
      <div className="truncate">
        {replyMessage.content || (replyMessage.media ? '[Media message]' : '[Message]')}
      </div>
    </div>
  );
};
