
import React from 'react';
import { CheckCheck, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';

interface MessageVisibilityStatusProps {
  timestamp: string;
  isRead: boolean;
  isCurrentUser: boolean;
  isVipUser: boolean;
}

export const MessageVisibilityStatus: React.FC<MessageVisibilityStatusProps> = ({
  timestamp,
  isRead,
  isCurrentUser,
  isVipUser
}) => {
  // Format the timestamp for display
  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      
      if (isNaN(date.getTime())) {
        return "";
      }
      
      if (isToday(date)) {
        return format(date, 'h:mm a');
      } else if (isYesterday(date)) {
        return `Yesterday ${format(date, 'h:mm a')}`;
      } else {
        return format(date, 'MMM d, h:mm a');
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return "";
    }
  };
  
  const formattedTime = formatMessageTime(timestamp);
  
  return (
    <div className={cn(
      "text-[10px] flex items-center mt-1",
      isCurrentUser ? "justify-end" : "justify-start"
    )}>
      <span className="text-muted-foreground">
        {formattedTime}
      </span>
      
      {isCurrentUser && isVipUser && (
        <span className="ml-1 text-muted-foreground">
          {isRead ? (
            <CheckCheck className="h-3 w-3 inline" />
          ) : (
            <Check className="h-3 w-3 inline" />
          )}
        </span>
      )}
    </div>
  );
};
