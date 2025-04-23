
import { Flag, Ban, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatActionsProps {
  isBlocked: boolean;
  onShowReportPopup: () => void;
  onBlockUser: () => void;
}

export const ChatActions = ({ 
  isBlocked, 
  onShowReportPopup, 
  onBlockUser 
}: ChatActionsProps) => {
  return (
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
        <DropdownMenuItem onClick={onShowReportPopup}>
          <Flag className="h-4 w-4 mr-2" /> Report User
        </DropdownMenuItem>
        
        {!isBlocked && (
          <DropdownMenuItem onClick={onBlockUser}>
            <Ban className="h-4 w-4 mr-2" /> Block User
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
