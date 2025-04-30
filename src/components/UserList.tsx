
import React, { useState, useMemo } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserListItem } from '@/components/UserListItem';
import { FilterPopup } from '@/components/FilterPopup';
import { FilterState, DEFAULT_FILTERS } from '@/types/filters';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { OnlineUser } from '@/hooks/useOnlineUsers';
import { ConnectionStatusDisplay } from '@/components/chat/ConnectionStatusDisplay';

interface UserListProps {
  users: OnlineUser[];
  onUserSelect: (userId: string) => void;
  selectedUserId?: string;
  connectionStatus?: 'connected' | 'connecting' | 'disconnected';
  onRetryConnection?: () => void;
}

export const UserList: React.FC<UserListProps> = ({ 
  users, 
  onUserSelect, 
  selectedUserId,
  connectionStatus = 'connected',
  onRetryConnection
}) => {
  const { blockedUsers, unblockUser } = useBlockedUsers();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  
  // Active filters badge logic
  const hasActiveFilters = useMemo(() => {
    return (
      filters.selectedGenders.length > 0 ||
      filters.selectedCountries.length > 0 ||
      filters.ageRange.min !== DEFAULT_FILTERS.ageRange.min ||
      filters.ageRange.max !== DEFAULT_FILTERS.ageRange.max
    );
  }, [filters]);

  // Filtering logic
  const filteredUsers = useMemo(() => {
    return users
      .filter(user => !user.is_current_user)
      .filter(user => {
        if (filters.selectedGenders.length > 0 && !filters.selectedGenders.includes(user.gender)) return false;
        if ((user.age ?? 0) < filters.ageRange.min || (user.age ?? 0) > filters.ageRange.max) return false;
        if (filters.selectedCountries.length > 0 && !filters.selectedCountries.includes(user.country)) return false;
        return true;
      });
  }, [users, filters]);

  // Sorting logic - VIP first, then bots, then by country/name
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const aIsVip = a.role === 'vip' || a.vip_status;
      const bIsVip = b.role === 'vip' || b.vip_status;
      if (aIsVip && !bIsVip) return -1;
      if (!aIsVip && bIsVip) return 1;
      if (a.role === 'bot' && b.role !== 'bot') return -1;
      if (a.role !== 'bot' && b.role === 'bot') return 1;
      return (a.nickname || '').localeCompare(b.nickname || '');
    });
  }, [filteredUsers]);

  // Filter handler
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // User selection handler
  const handleUserSelection = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    if (user && !user.is_current_user) {
      onUserSelect(userId);
    }
  };

  // Unblock user handler
  const handleUnblockUser = async (userId: string) => {
    const currentUserId = localStorage.getItem('userId');
    if (unblockUser && currentUserId) {
      await unblockUser(userId, currentUserId);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header with Filter Button */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Online users ({sortedUsers.length})
        </span>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-full relative text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Show filters"
          >
            <Filter className="h-5 w-5" />
            {hasActiveFilters && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-900" />
            )}
          </Button>
          {showFilters && (
            <FilterPopup
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              onClickOutside={() => setShowFilters(false)}
            />
          )}
        </div>
      </div>

      {/* User List Area */}
      <div className="flex-1 overflow-y-auto relative max-w-xs mx-auto w-full py-2">
        {/* Connection Status (shows only when needed) */}
        {(connectionStatus !== 'connected' || sortedUsers.length === 0) && (
          <ConnectionStatusDisplay 
            status={connectionStatus} 
            usersCount={sortedUsers.length}
            onRetry={onRetryConnection}
          />
        )}

        {/* Placeholder Background */}
        <div className="absolute inset-x-0 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 z-0 ml-2 mr-2 top-1 bottom-1"></div>

        {/* Actual List */}
        <div className="relative z-10 space-y-3">
          {sortedUsers.map(user => (
            <UserListItem
              key={user.user_id}
              name={user.nickname}
              gender={user.gender}
              age={user.age}
              country={user.country}
              flagEmoji={user.flagEmoji}
              isVip={user.role === 'vip' || user.vip_status}
              interests={[]} // We'll fetch these separately
              isSelected={selectedUserId === user.user_id}
              onClick={() => handleUserSelection(user.user_id)}
              avatarUrl={user.avatar_url}
              avatarInitial={user.avatarInitial}
              avatarBgColor={user.avatarBgColor}
              avatarTextColor={user.avatarTextColor}
              isBlocked={blockedUsers.includes(user.user_id)}
              onUnblock={
                blockedUsers.includes(user.user_id)
                ? () => handleUnblockUser(user.user_id)
                : undefined
              }
            />
          ))}

          {/* Empty state */}
          {sortedUsers.length === 0 && connectionStatus === 'connected' && (
            <div className="text-center text-gray-500 py-10 px-4 relative z-10">
              No users match the current filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
