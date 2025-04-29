
import React, { useState } from 'react';
import { MessageWithMedia } from '@/types/message';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ReplyComposerProps {
  originalMessage: MessageWithMedia;
  onSendReply: (content: string, imageUrl?: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export const ReplyComposer: React.FC<ReplyComposerProps> = ({
  originalMessage,
  onSendReply,
  onCancel,
  disabled = false
}) => {
  const [replyText, setReplyText] = useState('');
  
  const handleSendReply = () => {
    if (replyText.trim()) {
      onSendReply(replyText);
      setReplyText('');
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };
  
  const getPreviewContent = () => {
    if (originalMessage.deleted_at) {
      return <span className="italic text-muted-foreground">Message was deleted</span>;
    }
    
    if (originalMessage.media) {
      if (originalMessage.media.media_type === 'image') {
        return <span className="text-muted-foreground">Image</span>;
      }
      if (originalMessage.media.media_type === 'voice') {
        return <span className="text-muted-foreground">Voice message</span>;
      }
    }
    
    return <span className="truncate">{originalMessage.content}</span>;
  };

  return (
    <div className="p-2 border-t">
      <div className="mb-2 pl-2 border-l-2 border-primary/50 rounded flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground mb-1">Replying to message</span>
          <div className="text-sm max-w-[300px]">
            {getPreviewContent()}
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply..."
            onKeyPress={handleKeyPress}
            disabled={disabled}
          />
        </div>
        <Button
          onClick={handleSendReply}
          disabled={disabled || !replyText.trim()}
        >
          Reply
        </Button>
      </div>
    </div>
  );
};
