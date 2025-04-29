
import React from 'react';

export const MessageInputPlaceholder: React.FC = () => {
  return (
    <div className="p-2 border-t">
      <div className="p-3 bg-muted/50 rounded text-center text-muted-foreground">
        This is a demo user. You cannot send messages.
      </div>
    </div>
  );
};
