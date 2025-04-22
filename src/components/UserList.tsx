import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserListItem } from "@/components/UserListItem";
import { useUserList } from "@/hooks/useUserList";
import { FilterPopup } from "@/components/FilterPopup";
import { FilterState, DEFAULT_FILTERS } from "@/types/filters";
import { useState, useMemo } from "react";
import { useBlockedUsers } from '@/hooks/useBlockedUsers';

interface UserListProps {
  onUserSelect: (userId: string) => void;
  selectedUserId?: string;
}

export const UserList = ({ onUserSelect, selectedUserId }: UserListProps) => {
  const { users } = useUserList(onUserSelect, selectedUserId);
  const { blockedUsers, unblockUser } = useBlockedUsers();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const hasActiveFilters = useMemo(() => {
    return filters.selectedGenders.length > 0 ||
           filters.selectedCountries.length > 0 ||
           filters.ageRange.min !== DEFAULT_FILTERS.ageRange.min ||
           filters.ageRange.max !== DEFAULT_FILTERS.ageRange.max;
  }, [filters]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Gender filter
      if (filters.selectedGenders.length > 0 && !filters.selectedGenders.includes(user.gender as any)) {
        return false;
      }

      // Age filter
      if (user.age < filters.ageRange.min || user.age > filters.ageRange.max) {
        return false;
      }

      // Country filter
      if (filters.selectedCountries.length > 0 && !filters.selectedCountries.includes(user.country)) {
        return false;
      }

      return true;
    });
  }, [users, filters, blockedUsers]);

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
      {/* Header with filter */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          People ({filteredUsers.length})
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

      {/* User list */}
      <div className="overflow-y-auto flex-1">
        {filteredUsers.map((user) => (
          <UserListItem
            key={user.id}
            name={user.nickname}
            gender={user.gender}
            age={user.age}
            country={user.country}
            isVip={user.role === 'vip' || user.vip_status}
            interests={user.interests}
            isSelected={selectedUserId === user.id}
            onClick={() => onUserSelect(user.id)}
            avatar={user.avatar_url}
            profileTheme={user.profile_theme}
            isBlocked={blockedUsers.includes(user.id)}
            onUnblock={
              blockedUsers.includes(user.id) 
                ? () => unblockUser(user.id)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
};
