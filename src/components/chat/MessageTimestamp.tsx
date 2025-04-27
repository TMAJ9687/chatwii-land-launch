
import React from 'react';
import { format } from 'date-fns';

interface MessageTimestampProps {
  timestamp: string;
  isCurrentUser: boolean;
}

export const MessageTimestamp: React.FC<MessageTimestampProps> = ({ timestamp, isCurrentUser }) => {
  return (
    <span className={`text-xs ${
      isCurrentUser
        ? 'text-primary-foreground/70'
        : 'text-muted-foreground'
    }`}>
      {format(new Date(timestamp), 'HH:mm')}
    </span>
  );
};
