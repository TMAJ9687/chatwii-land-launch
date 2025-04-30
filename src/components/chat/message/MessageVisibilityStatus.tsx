
import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { format } from 'date-fns';

interface MessageVisibilityStatusProps {
  timestamp: string;
  isRead: boolean;
  isCurrentUser: boolean;
  isVipUser?: boolean;
}

export const MessageVisibilityStatus: React.FC<MessageVisibilityStatusProps> = ({
  timestamp,
  isRead,
  isCurrentUser,
  isVipUser = false
}) => {
  // Format timestamp for display
  const formattedTime = () => {
    try {
      return format(new Date(timestamp), 'h:mm a');
    } catch (e) {
      return ''; // Return empty string if timestamp is invalid
    }
  };
  
  // Only show read status for current user's messages and if they're a VIP
  const showReadStatus = isCurrentUser && isVipUser;
  
  return (
    <div className="flex items-center justify-end gap-1 mt-1">
      <span className="text-[10px] text-muted-foreground">
        {formattedTime()}
      </span>
      
      {showReadStatus && (
        <span className={cn(
          "ml-1", 
          isRead ? "text-green-500" : "text-muted-foreground/40"
        )}>
          <Check className="h-3 w-3" />
        </span>
      )}
    </div>
  );
};
