
import React from 'react';
import { MessageWithMedia } from '@/types/message';
import { cn } from '@/lib/utils';

interface ReplyPreviewProps {
  replyMessage: MessageWithMedia | null;
  isCurrentUser: boolean;
}

export const ReplyPreview = ({ replyMessage, isCurrentUser }: ReplyPreviewProps) => {
  // Default message for no reply
  if (!replyMessage) {
    return (
      <div className={cn(
        "text-xs p-1.5 mb-1 rounded italic opacity-80",
        isCurrentUser ? "bg-primary/30 text-primary-foreground" : "bg-muted"
      )}>
        Reply to a message
      </div>
    );
  }

  // Get appropriate preview based on message type
  const getPreviewContent = () => {
    if (replyMessage.content) {
      return replyMessage.content.length > 30
        ? `${replyMessage.content.substring(0, 30)}...`
        : replyMessage.content;
    } 
    
    if (replyMessage.media) {
      return replyMessage.media.media_type === 'voice' 
        ? 'Voice message' 
        : 'Image';
    }
    
    return 'Message';
  };

  const previewContent = getPreviewContent();

  return (
    <div className={cn(
      "text-xs p-1.5 mb-1 rounded italic flex items-center",
      isCurrentUser ? "bg-primary/30 text-primary-foreground" : "bg-muted"
    )}>
      <span className="mr-1">↩️</span>
      <span className="truncate">{previewContent}</span>
    </div>
  );
};
