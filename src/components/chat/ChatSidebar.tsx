
import React from 'react';
import { UserList } from '@/components/UserList';

interface ChatSidebarProps {
  onlineUsers?: any[];
  onUserSelect?: (userId: string) => void;
  selectedUserId?: string | null;
}

export const ChatSidebar = ({
  onlineUsers = [],
  onUserSelect,
  selectedUserId
}: ChatSidebarProps) => {
  return (
    <div className="w-72 border-r border-border bg-background p-4 h-full overflow-auto">
      <h2 className="text-lg font-medium mb-4">Online Users</h2>
      <UserList 
        users={onlineUsers} 
        onUserSelect={onUserSelect}
        selectedUserId={selectedUserId}
      />
    </div>
  );
};
