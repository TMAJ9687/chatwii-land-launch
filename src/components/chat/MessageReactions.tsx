
import React from 'react';
import { MessageReaction } from '@/types/message';

interface MessageReactionsProps {
  reactions: MessageReaction[] | null;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({ reactions }) => {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="flex flex-wrap mt-1 gap-1">
      {reactions.map((reaction, index) => (
        <span 
          key={`${reaction.id || index}-${reaction.emoji}`}
          className="inline-block bg-background/20 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-xs"
        >
          {reaction.emoji}
        </span>
      ))}
    </div>
  );
};
