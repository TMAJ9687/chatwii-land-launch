
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserListItem } from "@/components/UserListItem";
import { FilterPopup } from "@/components/FilterPopup";
import { FilterState, DEFAULT_FILTERS } from "@/types/filters";
import { useState, useMemo, useEffect } from "react";
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { supabase } from "@/lib/supabase";

interface UserListProps {
  users: any[];
  onUserSelect: (userId: string) => void;
  selectedUserId?: string;
}

export const UserList = ({ users, onUserSelect, selectedUserId }: UserListProps) => {
  const { blockedUsers, unblockUser, fetchBlockedUsers } = useBlockedUsers();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [userInterests, setUserInterests] = useState<Record<string, string[]>>({});

  // Fetch interests for all users
  useEffect(() => {
    if (users.length === 0) return;

    const fetchInterests = async () => {
      try {
        const userIds = users.map(user => user.user_id);
        
        // Get all interests from user_interests table for these users
        const { data, error } = await supabase
          .from('user_interests')
          .select(`
            user_id,
            interest_id,
            interests (name)
          `)
          .in('user_id', userIds);
        
        if (error) {
          console.error('Error fetching interests:', error);
          return;
        }
        
        // Group interests by user
        const interestsByUser: Record<string, string[]> = {};
        
        data.forEach(item => {
          const userId = item.user_id;
          const interestName = item.interests?.name;
          
          if (interestName) {
            if (!interestsByUser[userId]) {
              interestsByUser[userId] = [];
            }
            interestsByUser[userId].push(interestName);
          }
        });
        
        setUserInterests(interestsByUser);
      } catch (err) {
        console.error('Error processing interests:', err);
      }
    };
    
    fetchInterests();
  }, [users]);

  // Filter out current user and apply user filters
  const filteredUsers = useMemo(() => {
    return users
      .filter(user => !user.is_current_user)
      .filter(user => {
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
  }, [users, filters]);

  const hasActiveFilters = useMemo(() => {
    return filters.selectedGenders.length > 0 ||
      filters.selectedCountries.length > 0 ||
      filters.ageRange.min !== DEFAULT_FILTERS.ageRange.min ||
      filters.ageRange.max !== DEFAULT_FILTERS.ageRange.max;
  }, [filters]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      if ((a.role === 'vip' || a.vip_status) && !(b.role === 'vip' || b.vip_status)) return -1;
      if (!(a.role === 'vip' || a.vip_status) && (b.role === 'vip' || b.vip_status)) return 1;
      if ((a.role === 'vip' || a.vip_status) && (b.role === 'vip' || b.vip_status)) {
        return (a.nickname || '').localeCompare(b.nickname || '');
      }
      if (a.role === 'bot' && b.role !== 'bot' && !b.vip_status) return -1;
      if (a.role !== 'bot' && b.role === 'bot' && !a.vip_status) return 1;
      if ((a.country || '') !== (b.country || '')) {
        return (a.country || '').localeCompare(b.country || '');
      }
      return (a.nickname || '').localeCompare(b.nickname || '');
    });
  }, [filteredUsers]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleUserSelection = (userId: string) => {
    // Safety check to prevent self-selection
    const user = users.find(u => u.user_id === userId);
    if (user && !user.is_current_user) {
      onUserSelect(userId);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    if (unblockUser) {
      await unblockUser(userId, localStorage.getItem('userId'));
    }
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
            interests={userInterests[user.user_id] || []}
            isSelected={selectedUserId === user.user_id}
            onClick={() => handleUserSelection(user.user_id)}
            avatar={user.avatar_url}
            profileTheme={user.profile_theme}
            isBlocked={blockedUsers.includes(user.user_id)}
            onUnblock={
              blockedUsers.includes(user.user_id)
                ? () => handleUnblockUser(user.user_id)
                : undefined
            }
            role={user.role}
            isCurrentUser={false}
          />
        ))}
      </div>
    </div>
  );
};
