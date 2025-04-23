import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserListItem } from "@/components/UserListItem";
import { FilterPopup } from "@/components/FilterPopup";
import { FilterState, DEFAULT_FILTERS } from "@/types/filters";
import { useState, useMemo } from "react";
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { toast } from "sonner";

interface UserListProps {
  users: any[];
  onUserSelect: (userId: string) => void;
  selectedUserId?: string;
}

export const UserList = ({ users, onUserSelect, selectedUserId }: UserListProps) => {
  const { blockedUsers, unblockUser } = useBlockedUsers();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const currentUserId = useMemo(() => {
    const currentUser = users.find(user => user.is_current_user);
    return currentUser?.user_id;
  }, [users]);

  const handleUserSelect = (userId: string) => {
    if (userId === currentUserId) {
      return;
    }
    onUserSelect(userId);
  };

  const hasActiveFilters = useMemo(() => {
    return filters.selectedGenders.length > 0 ||
      filters.selectedCountries.length > 0 ||
      filters.ageRange.min !== DEFAULT_FILTERS.ageRange.min ||
      filters.ageRange.max !== DEFAULT_FILTERS.ageRange.max;
  }, [filters]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (filters.selectedGenders.length > 0 && !filters.selectedGenders.includes(user.gender as any)) {
        return false;
      }
      if ((user.age ?? 0) < filters.ageRange.min || (user.age ?? 0) > filters.ageRange.max) {
        return false;
      }
      if (filters.selectedCountries.length > 0 && !filters.selectedCountries.includes(user.country)) {
        return false;
      }
      return true;
    });
  }, [users, filters, blockedUsers]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers]
      .sort((a, b) => {
        if ((a.role === 'vip' || a.vip_status) && !(b.role === 'vip' || b.vip_status)) return -1;
        if (!(a.role === 'vip' || a.vip_status) && (b.role === 'vip' || b.vip_status)) return 1;
        if ((a.role === 'vip' || a.vip_status) && (b.role === 'vip' || b.vip_status)) {
          return (a.nickname || '').localeCompare(b.nickname || '');
        }
        if (a.role === 'bot' && b.role !== 'bot' && !b.vip_status) return -1;
        if ((a.role !== 'bot' && b.role === 'bot' && !a.vip_status)) return 1;
        if ((a.country || '') !== (b.country || '')) {
          return (a.country || '').localeCompare(b.country || '');
        }
        return (a.nickname || '').localeCompare(b.nickname || '');
      });
  }, [filteredUsers, currentUserId]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Online users ({sortedUsers.length})
        </span>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-full relative"
          >
            <Filter className="h-5 w-5" />
            {hasActiveFilters && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
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
      <div className="overflow-y-auto flex-1">
        {sortedUsers.map((user) => (
          <UserListItem
            key={user.user_id}
            name={user.nickname}
            gender={user.gender}
            age={user.age}
            country={user.country}
            isVip={user.role === 'vip' || user.vip_status}
            interests={user.interests || []}
            isSelected={selectedUserId === user.user_id}
            onClick={() => handleUserSelect(user.user_id)}
            avatar={user.avatar_url}
            profileTheme={user.profile_theme}
            isBlocked={blockedUsers.includes(user.user_id)}
            onUnblock={
              blockedUsers.includes(user.user_id)
                ? () => unblockUser(user.user_id)
                : undefined
            }
            role={user.role}
            isCurrentUser={user.user_id === currentUserId}
          />
        ))}
      </div>
    </div>
  );
};
