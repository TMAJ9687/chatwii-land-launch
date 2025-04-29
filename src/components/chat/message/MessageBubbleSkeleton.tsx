
import React from 'react';

interface MessageBubbleSkeletonProps {
  isCurrentUser: boolean;
}

export const MessageBubbleSkeleton: React.FC<MessageBubbleSkeletonProps> = ({ isCurrentUser }) => {
  const alignmentClasses = isCurrentUser
    ? 'ml-auto bg-primary/20'
    : 'mr-auto bg-muted/60';

  return (
    <div className={`animate-pulse flex flex-col w-4/5 max-w-md rounded-lg p-3 mb-2 ${alignmentClasses}`}>
      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-muted rounded w-1/2 mb-1"></div>
      <div className="h-3 bg-muted rounded w-5/6 mb-1"></div>
      <div className="h-3 bg-muted rounded w-2/3"></div>
      <div className="flex justify-between mt-2">
        <div className="h-2 bg-muted rounded w-1/5"></div>
        <div className="h-2 bg-muted rounded w-1/5"></div>
      </div>
    </div>
  );
};
