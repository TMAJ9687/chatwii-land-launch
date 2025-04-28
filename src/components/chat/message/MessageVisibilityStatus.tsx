
import React from 'react';
import { MessageStatus } from '../MessageStatus';
import { MessageTimestamp } from '../MessageTimestamp';

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
  return (
    <div className="flex items-center justify-between mt-1">
      <MessageTimestamp
        timestamp={timestamp}
        isCurrentUser={isCurrentUser}
      />
      {isCurrentUser && isVipUser && <MessageStatus isRead={isRead} />}
    </div>
  );
};
