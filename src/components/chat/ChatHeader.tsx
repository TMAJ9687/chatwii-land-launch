
import { X, MoreVertical, Flag, Ban, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ChatHeaderProps {
  nickname: string;
  onClose?: () => void;
  onReportUser: () => void;
  onBlockUser: () => void;
  onDeleteConversation: () => void;
  isBlocked: boolean;
  isVipUser: boolean;
}

export const ChatHeader = ({
  nickname,
  onClose,
  onReportUser,
  onBlockUser,
  onDeleteConversation,
  isBlocked,
  isVipUser,
}: ChatHeaderProps) => {
  return (
    <div className="p-4 border-b flex items-center justify-between bg-background">
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
              <Flag className="h-4 w-4 mr-2" />
              Report User
            </DropdownMenuItem>
            
            {!isBlocked && (
              <DropdownMenuItem onClick={onBlockUser}>
                <Ban className="h-4 w-4 mr-2" />
                Block User
              </DropdownMenuItem>
            )}

            {isVipUser && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash className="h-4 w-4 mr-2" />
                    Delete Conversation
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this conversation? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDeleteConversation} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
