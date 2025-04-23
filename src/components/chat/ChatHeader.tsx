
import { X, MoreVertical, Flag, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatHeaderProps {
  nickname: string;
  onClose?: () => void;
  onReportUser: () => void;
  onBlockUser: () => void;
  isBlocked: boolean;
}

export const ChatHeader = ({
  nickname,
  onClose,
  onReportUser,
  onBlockUser,
  isBlocked,
}: ChatHeaderProps) => {
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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onReportUser}>
              <Flag className="h-4 w-4 mr-2" /> Report User
            </DropdownMenuItem>
            
            {!isBlocked && (
              <DropdownMenuItem onClick={onBlockUser}>
                <Ban className="h-4 w-4 mr-2" /> Block User
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
