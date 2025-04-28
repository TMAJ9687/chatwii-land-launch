
import React from 'react';
import { MessageWithMedia } from '@/types/message';
import { cn } from '@/lib/utils';

interface ReplyPreviewProps {
  replyMessage: MessageWithMedia | null;
  isCurrentUser: boolean;
}

export const ReplyPreview = ({ replyMessage, isCurrentUser }: ReplyPreviewProps) => {
  if (!replyMessage) {
    return (
      <div className={cn(
        "text-xs p-1 mb-1 rounded italic opacity-75",
        isCurrentUser ? "bg-primary/30 text-primary-foreground" : "bg-muted"
      )}>
        Reply to a message
      </div>
    );
  }

  let previewContent = 'Message';
  if (replyMessage.content) {
    previewContent = replyMessage.content.length > 30
      ? `${replyMessage.content.substring(0, 30)}...`
      : replyMessage.content;
  }
  else if (replyMessage.media) {
    previewContent = replyMessage.media.media_type === 'voice' ? 'Voice message' : 'Image';
  }

  return (
    <div className={cn(
      "text-xs p-1 mb-1 rounded italic",
      isCurrentUser ? "bg-primary/30 text-primary-foreground" : "bg-muted"
    )}>
      <span>↩️ {previewContent}</span>
    </div>
  );
};
