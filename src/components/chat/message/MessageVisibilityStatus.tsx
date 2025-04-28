
import React from 'react';

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
  isVipUser
}) => {
  // Format the timestamp for display
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return ''; // Return empty string if there's an error
    }
  };

  return (
    <div className="text-xs text-gray-500 mt-1 flex justify-end items-center gap-1">
      {formatTime(timestamp)}
      
      {isCurrentUser && isVipUser && (
        <span className={isRead ? "text-blue-500" : "text-gray-400"}>
          {isRead ? "• Read" : "• Sent"}
        </span>
      )}
    </div>
  );
};
