
import React from 'react';
import { MessageWithMedia } from '@/types/message';

interface MessageBubbleWrapperProps {
  message: MessageWithMedia;
  isCurrentUser: boolean;
  children: React.ReactNode;
}

export const MessageBubbleWrapper = ({ 
  message, 
  isCurrentUser, 
  children 
}: MessageBubbleWrapperProps) => {
  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} relative group mb-2`}>
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}
      >
        {children}
      </div>
    </div>
  );
};
