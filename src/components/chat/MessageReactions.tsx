
import React from 'react';
import { MessageReaction } from '@/types/message';
import { cn } from '@/lib/utils';

interface MessageReactionsProps {
  reactions?: MessageReaction[];
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({ reactions = [] }) => {
  if (!reactions || reactions.length === 0) return null;

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!reaction.emoji) return acc;
    
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = { count: 1, userIds: [reaction.user_id] };
    } else {
      acc[reaction.emoji].count++;
      acc[reaction.emoji].userIds.push(reaction.user_id);
    }
    return acc;
  }, {} as Record<string, { count: number, userIds: string[] }>);

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(groupedReactions).map(([emoji, data]) => (
        <div 
          key={emoji}
          className={cn(
            "flex items-center text-xs px-1.5 py-0.5 rounded-full",
            "bg-muted/60 hover:bg-muted/80 transition-colors"
          )}
          title={`${data.count} ${data.count === 1 ? 'reaction' : 'reactions'}`}
        >
          <span className="mr-1">{emoji}</span>
          {data.count > 1 && <span className="text-muted-foreground">{data.count}</span>}
        </div>
      ))}
    </div>
  );
};
