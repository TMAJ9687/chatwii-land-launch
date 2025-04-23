
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { ChatActions } from './ChatActions';

interface ChatAreaHeaderProps {
  nickname: string;
  isBlocked: boolean;
  onClose?: () => void;
  onShowReportPopup: () => void;
  onBlockUser: () => void;
}

export const ChatAreaHeader = ({
  nickname,
  isBlocked,
  onClose,
  onShowReportPopup,
  onBlockUser
}: ChatAreaHeaderProps) => {
  return (
    <div className="p-4 border-b flex items-center justify-between">
      <h2 className="font-medium">{nickname}</h2>
      <div className="flex items-center gap-2">
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        <ChatActions
          isBlocked={isBlocked}
          onShowReportPopup={onShowReportPopup}
          onBlockUser={onBlockUser}
        />
      </div>
    </div>
  );
};
