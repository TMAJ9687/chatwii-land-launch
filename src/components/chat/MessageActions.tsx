
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
import { useState } from 'react';

interface MessageActionsProps {
  message: MessageWithMedia;
  isCurrentUser: boolean;
  isVipUser: boolean;
  onUnsend: () => void;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onTranslate: () => void;
}

export const MessageActions = ({
  message,
  isCurrentUser,
  isVipUser,
  onUnsend,
  onReply,
  onReact,
  onTranslate,
}: MessageActionsProps) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  if (!isVipUser) return null;

  return (
    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-0 flex items-center gap-1 p-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={() => setShowEmojiPicker(true)}
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
          {message.language_code && (
            <DropdownMenuItem onClick={onTranslate}>
              <Languages className="h-4 w-4 mr-2" />
              Translate
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
          onEmojiSelect={(emoji) => {
            onReact(emoji);
            setShowEmojiPicker(false);
          }}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  );
};
