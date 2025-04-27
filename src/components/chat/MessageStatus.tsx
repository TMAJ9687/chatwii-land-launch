
import React from 'react';

interface MessageStatusProps {
  isRead: boolean | undefined;
}

export const MessageStatus: React.FC<MessageStatusProps> = ({ isRead }) => {
  return (
    <span className="text-xs text-muted-foreground ml-2">
      {isRead ? 'Read' : 'Sent'}
    </span>
  );
};
