
import { useBlockedUsers } from '@/hooks/useBlockedUsers';

// This hook is now for blocked/unblocked only with OnlineUser array.
export const useUserList = (_onUserSelect: (userId: string) => void, _selectedUserId?: string) => {
  // No network, no data fetch, just pass through for compatibility.
  const { blockedUsers, unblockUser } = useBlockedUsers();

  return {
    blockedUsers,
    unblockUser
  };
};
