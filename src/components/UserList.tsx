import { useState, useMemo, useEffect, useCallback } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserListItem } from "@/components/UserListItem";
import { FilterPopup } from "@/components/FilterPopup";
import { FilterState, DEFAULT_FILTERS } from "@/types/filters";
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface UserListProps {
  users: any[];
  onUserSelect: (userId: string) => void;
  selectedUserId?: string;
}

export const UserList = ({ users, onUserSelect, selectedUserId }: UserListProps) => {
  const { blockedUsers, unblockUser } = useBlockedUsers();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [userInterests, setUserInterests] = useState<Record<string, string[]>>({});

  // Fetch user interests from Firestore for each user (one query per user, may optimize in the future)
  useEffect(() => {
    if (!users.length) return;

    let isMounted = true;

    const fetchInterests = async () => {
      const interestsByUser: Record<string, string[]> = {};
      try {
        await Promise.all(users.map(async user => {
          const interestsRef = collection(db, 'user_interests');
          const q = query(interestsRef, where('user_id', '==', user.user_id));
          const snapshot = await getDocs(q);
          const interests: string[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            if (data.interest_name) interests.push(data.interest_name);
          });
          interestsByUser[user.user_id] = interests;
        }));
        if (isMounted) setUserInterests(interestsByUser);
      } catch (err) {
        console.error("Error fetching interests:", err);
        if (isMounted) setUserInterests({});
      }
    };

    fetchInterests();
    return () => { isMounted = false; };
  }, [users]);

  // Filter users based on selected filters
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

  // Active filters badge
  const hasActiveFilters = useMemo(() => {
    return (
      filters.selectedGenders.length > 0 ||
      filters.selectedCountries.length > 0 ||
      filters.ageRange.min !== DEFAULT_FILTERS.ageRange.min ||
      filters.ageRange.max !== DEFAULT_FILTERS.ageRange.max
    );
  }, [filters]);

  // Sort users for display
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      // VIP users first, then bots, then by country, then by nickname
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

  // Handlers
  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const handleUserSelection = useCallback((userId: string) => {
    const user = users.find(u => u.user_id === userId);
    if (user && !user.is_current_user) {
      onUserSelect(userId);
    }
  }, [users, onUserSelect]);

  const handleUnblockUser = useCallback(async (userId: string) => {
    if (unblockUser) {
      await unblockUser(userId, localStorage.getItem('userId'));
    }
  }, [unblockUser]);

  // Render
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
            aria-label="Show filters"
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
        {sortedUsers.map(user => (
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
