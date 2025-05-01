
import React from 'react';
import { UserList } from '@/components/UserList';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { useChatConnection } from '@/hooks/chat/useChatConnection';

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
  // Get online users
  const { onlineUsers } = useOnlineUsers();
  
  // Get connection status
  const { isConnected, reconnect } = useChatConnection();
  
  // Map connection status to string
  const connectionStatus = isConnected ? 'connected' : 'disconnected';
  
  return (
    <aside className="w-72 border-r border-border flex-shrink-0 h-full">
      <UserList 
        users={onlineUsers} 
        onUserSelect={onUserSelect} 
        selectedUserId={selectedUserId || undefined}
        connectionStatus={connectionStatus}
        onRetryConnection={reconnect}
      />
    </aside>
  );
};
