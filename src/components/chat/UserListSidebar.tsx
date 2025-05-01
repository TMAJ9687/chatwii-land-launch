
import React from 'react';
import { UserList } from '@/components/UserList';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { useChannelSetup } from '@/hooks/useChannelSetup';
import { useMessages } from '@/hooks/useMessages';

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
  
  // For passing to useChannelSetup as a placeholder - we don't need these values here
  const setDummyMessages = React.useCallback(() => {}, []);
  const dummyFetchMessages = React.useCallback(() => {}, []);
  
  // Get connection status and retry function
  const { isConnected, onRetryConnection } = useChannelSetup(
    currentUserId,
    selectedUserId,
    setDummyMessages,
    dummyFetchMessages
  );
  
  // Map connection status to string
  const connectionStatus = isConnected ? 'connected' : 'disconnected';
  
  return (
    <aside className="w-72 border-r border-border flex-shrink-0 h-full">
      <UserList 
        users={onlineUsers} 
        onUserSelect={onUserSelect} 
        selectedUserId={selectedUserId || undefined}
        connectionStatus={connectionStatus}
        onRetryConnection={onRetryConnection}
      />
    </aside>
  );
};
