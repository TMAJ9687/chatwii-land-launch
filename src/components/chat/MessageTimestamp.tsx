
import React from 'react';
import { Timestamp } from 'firebase/firestore';
import { formatTimestamp } from './message/MessageTimeFormatter';

interface MessageTimestampProps {
  timestamp: string | Date | Timestamp;
  isCurrentUser: boolean;
}

export const MessageTimestamp: React.FC<MessageTimestampProps> = ({ timestamp, isCurrentUser }) => {
  const formattedTime = formatTimestamp(timestamp);
  
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
