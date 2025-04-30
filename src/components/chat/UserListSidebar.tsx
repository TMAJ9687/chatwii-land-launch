
import React from 'react';
import { UserList } from '@/components/UserList';

// Define proper online user type that matches what UserList expects
interface OnlineUser {
  user_id: string;
  nickname: string;
  gender: string;
  age: number;
  country: string;
  role?: string;
  vip_status?: boolean;
  avatar_url?: string;
  profile_theme?: string;
  is_current_user?: boolean;
  // These fields were added in usePresence but missing in the type definition
  avatarInitial?: string;
  avatarBgColor?: string;
  avatarTextColor?: string;
  flagEmoji?: string;
}

interface UserListSidebarProps {
  onlineUsers: OnlineUser[];
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
