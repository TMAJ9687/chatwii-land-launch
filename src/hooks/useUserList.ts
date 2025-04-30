
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { useState, useEffect } from 'react';
import { notificationService } from '@/services/notificationService';

// Enhanced hook for user list management
export const useUserList = (_onUserSelect: (userId: string) => void, _selectedUserId?: string) => {
  const { blockedUsers, unblockUser } = useBlockedUsers();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  
  // Log connection status on mount to help with debugging
  useEffect(() => {
    notificationService.debug('UserList component mounted');
    
    // Set initial connection status after a short delay
    const timer = setTimeout(() => {
      setConnectionStatus('connected');
      notificationService.debug('UserList connection status set to connected');
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      notificationService.debug('UserList component unmounted');
    };
  }, []);

  return {
    blockedUsers,
    unblockUser,
    connectionStatus
  };
};
