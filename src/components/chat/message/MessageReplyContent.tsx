
import React from 'react';
import { MessageWithMedia } from '@/types/message';
import { cn } from '@/lib/utils';

interface MessageReplyContentProps {
  message: MessageWithMedia | null;
  isCurrentUser: boolean;
}

export const MessageReplyContent = ({
  message,
  isCurrentUser
}: MessageReplyContentProps) => {
  if (!message) return null;

  // Extract preview content
  let previewContent = '[Message]';
  if (message.content) {
    previewContent =
      message.content.length > 50
        ? message.content.substring(0, 50) + '...'
        : message.content;
  } else if (message.media) {
    previewContent = message.media.media_type === 'voice'
      ? '[Voice message]'
      : '[Image message]';
  }

  return (
    <div className={cn(
      "text-xs px-3 py-1 rounded-t-md opacity-75",
      isCurrentUser 
        ? "bg-primary/60 text-primary-foreground" 
        : "bg-muted/75 text-foreground"
    )}>
      <span className="font-semibold">Replying to:</span> {previewContent}
    </div>
  );
};
