
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { MessageWithMedia } from '@/types/message';

interface ReplyComposerProps {
  originalMessage: MessageWithMedia | null;
  onSendReply: (content: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export const ReplyComposer = ({
  originalMessage,
  onSendReply,
  onCancel,
  disabled = false,
}: ReplyComposerProps) => {
  const [content, setContent] = useState('');

  if (!originalMessage) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSendReply(content);
      setContent('');
    }
  };

  let previewContent = '[Message]';
  if (originalMessage.content) {
    previewContent =
      originalMessage.content.length > 50
        ? originalMessage.content.substring(0, 50) + '...'
        : originalMessage.content;
  } else if (originalMessage.media) {
    previewContent = '[Media message]';
  }

  return (
    <div className="p-3 bg-muted/60 border-t border-border">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">Replying to message</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-6 w-6 p-0"
          disabled={disabled}
          aria-label="Cancel reply"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-sm text-muted-foreground mb-3 italic">
        "{previewContent}"
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Type your reply..."
          className="flex-1"
          autoFocus
          disabled={disabled}
        />
        <Button type="submit" disabled={!content.trim() || disabled}>
          Send
        </Button>
      </form>
    </div>
  );
};
