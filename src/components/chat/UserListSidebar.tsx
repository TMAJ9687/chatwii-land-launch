
import React from 'react';
import { UserList } from '@/components/UserList';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { useConnectionMonitor } from '@/hooks/useConnectionMonitor';
import { useChatConnection } from '@/hooks/chat/useChatConnection';
import { OnlineUser } from '@/hooks/useOnlineUsers';

interface UserListSidebarProps {
  onUserSelect: (userId: string) => void;
  selectedUserId: string | null;
  currentUserId: string | null;
}

export const UserListSidebar: React.FC<UserListSidebarProps> = ({
  onUserSelect,
  selectedUserId,
  currentUserId
}) => {
  // Get online users from our new hook
  const { 
    onlineUsers, 
    isLoading, 
    error, 
    hasUsers 
  } = useOnlineUsers({ 
    currentUserId,
    includeMockUsers: true
  });
  
  // Monitor connection status
  const { isConnected, reconnect } = useChatConnection(true);
  
  // Convert connection status for the UserList component
  const connectionStatus = isLoading 
    ? 'connecting'
    : isConnected 
      ? 'connected' 
      : 'disconnected';

  return (
    <aside className="w-full max-w-xs border-r border-border">
      <UserList
        users={onlineUsers}
        onUserSelect={onUserSelect}
        selectedUserId={selectedUserId ?? undefined}
        connectionStatus={connectionStatus}
        onRetryConnection={reconnect}
      />
    </aside>
  );
};
