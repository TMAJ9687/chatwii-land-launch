
import React from 'react';
import { MessageWithMedia } from '@/types/message';
import { cn } from '@/lib/utils';
import { MessageSquare, Image, Mic } from 'lucide-react';

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
  const isVoiceMessage = hasMedia && message.media?.media_type === 'voice';
  const isImageMessage = hasMedia && message.media?.media_type === 'image';
  
  const getMessagePreview = () => {
    if (isDeleted) {
      return <span className="italic">This message was deleted</span>;
    }
    
    if (isVoiceMessage) {
      return (
        <div className="flex items-center gap-1">
          <Mic className="h-3 w-3 flex-shrink-0" />
          <span>Voice message</span>
        </div>
      );
    }
    
    if (isImageMessage) {
      return (
        <div className="flex items-center gap-1">
          <Image className="h-3 w-3 flex-shrink-0" />
          <span>Image</span>
        </div>
      );
    }
    
    if (message.content) {
      return <span className="truncate">{message.content}</span>;
    }
    
    return <span className="italic">[Empty message]</span>;
  };
  
  return (
    <div
      className={cn(
        "flex items-center gap-1 mb-1 px-2 py-1 text-xs",
        "border-l-2 rounded-sm max-w-[90%]",
        isCurrentUser 
          ? "ml-auto bg-primary/10 border-primary/30" 
          : "mr-auto bg-muted/50 border-muted-foreground/30"
      )}
    >
      <MessageSquare className="h-3 w-3 flex-shrink-0" />
      {getMessagePreview()}
    </div>
  );
};
