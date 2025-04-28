
import { MoreHorizontal, ReplyIcon, SmileIcon, Trash2, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageWithMedia } from '@/types/message';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmojiPicker } from './EmojiPicker';
import { useState, useCallback } from 'react';

interface MessageActionsProps {
  message: MessageWithMedia;
  isCurrentUser: boolean;
  isVipUser: boolean;
  onUnsend: () => void;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onTranslate: () => void;
  translating?: boolean;
}

export const MessageActions = ({
  message,
  isCurrentUser,
  isVipUser,
  onUnsend,
  onReply,
  onReact,
  onTranslate,
  translating = false,
}: MessageActionsProps) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleReactClick = useCallback(() => {
    setShowEmojiPicker(true);
  }, []);
  
  const handleEmojiSelect = useCallback((emoji: string) => {
    onReact(emoji);
    setShowEmojiPicker(false);
  }, [onReact]);
  
  const handleClose = useCallback(() => {
    setShowEmojiPicker(false);
  }, []);

  if (!isVipUser) return null;

  // Only show translate option if the message has content and is not in English
  const showTranslate = message.content && 
    (!message.language_code || message.language_code !== 'en');

  return (
    <div className="absolute right-0 top-0 flex items-center gap-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={handleReactClick}
      >
        <SmileIcon className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={onReply}
      >
        <ReplyIcon className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {showTranslate && (
            <DropdownMenuItem onClick={onTranslate} disabled={translating}>
              <Languages className="h-4 w-4 mr-2" />
              {translating ? "Translating..." : "Translate"}
            </DropdownMenuItem>
          )}
          {isCurrentUser && (
            <DropdownMenuItem onClick={onUnsend} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Unsend
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {showEmojiPicker && (
        <EmojiPicker
          onEmojiSelect={handleEmojiSelect}
          onClose={handleClose}
        />
      )}
    </div>
  );
};
