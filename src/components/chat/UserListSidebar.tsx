
import React from 'react';
import { UserList } from '@/components/UserList';

interface UserListSidebarProps {
  onlineUsers: Array<{
    user_id: string;
    nickname: string;
    [key: string]: any;
  }>;
  onUserSelect: (userId: string) => void;
  selectedUserId: string | null;
}

export const UserListSidebar: React.FC<UserListSidebarProps> = ({
  onlineUsers,
  onUserSelect,
  selectedUserId
}) => {
  return (
    <aside className="w-full max-w-xs border-r border-border">
      <UserList
        users={onlineUsers}
        onUserSelect={onUserSelect}
        selectedUserId={selectedUserId ?? undefined}
      />
    </aside>
  );
};
