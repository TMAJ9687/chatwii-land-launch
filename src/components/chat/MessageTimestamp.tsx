
import React, { useMemo } from 'react';
import { format } from 'date-fns';

interface MessageTimestampProps {
  timestamp: string;
  isCurrentUser: boolean;
}

export const MessageTimestamp: React.FC<MessageTimestampProps> = ({ timestamp, isCurrentUser }) => {
  // Use useMemo to avoid unnecessary re-formatting on every render
  const formattedTime = useMemo(() => {
    try {
      return format(new Date(timestamp), 'HH:mm');
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '--:--';
    }
  }, [timestamp]);

  return (
    <span className={`text-xs ${
      isCurrentUser
        ? 'text-primary-foreground/70'
        : 'text-muted-foreground'
    }`}>
      {formattedTime}
    </span>
  );
};
