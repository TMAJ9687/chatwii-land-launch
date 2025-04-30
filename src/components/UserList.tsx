import React, { useState, useMemo, useEffect, useCallback } from 'react'; // Ensure React is imported
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserListItem } from '@/components/UserListItem'; // Import updated UserListItem
import { FilterPopup } from '@/components/FilterPopup';
import { FilterState, DEFAULT_FILTERS } from '@/types/filters';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFlagEmoji } from '@/utils/countryTools'; // Assuming you have a utility for emoji flags

// --- Define a more complete User type (adjust based on your actual data) ---
interface OnlineUser {
  user_id: string;
  nickname: string;
  gender: string;
  age: number;
  country: string;
  role?: string;
  vip_status?: boolean;
  avatar_url?: string;
  profile_theme?: string; // Keep if used elsewhere, otherwise remove
  is_current_user?: boolean;
  // Add fields needed for the new UserListItem props
  avatarInitial: string; // e.g., 'E'
  avatarBgColor: string; // e.g., 'bg-purple-100'
  avatarTextColor: string; // e.g., 'text-purple-600'
  flagEmoji: string; // e.g., '🇧🇮'
}
// --- End of User type ---

interface UserListProps {
  users: OnlineUser[]; // Use the more detailed OnlineUser type
  onUserSelect: (userId: string) => void;
  selectedUserId?: string;
  connectionStatus: string; // Add connectionStatus prop
  onRetryConnection: () => void; // Add retry connection prop
}

export const UserList: React.FC<UserListProps> = ({ 
  users, 
  onUserSelect, 
  selectedUserId,
  connectionStatus,
  onRetryConnection
}) => {
  const { blockedUsers, unblockUser } = useBlockedUsers();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [userInterests, setUserInterests] = useState<Record<string, string[]>>({});

  // --- Fetching interests logic (keep as is) ---
  useEffect(() => {
    if (!users.length) return;
    let isMounted = true;
    const fetchInterests = async () => {
      const interestsByUser: Record<string, string[]> = {};
      try {
        await Promise.all(users.map(async user => {
          // Ensure user_id exists before querying
          if (!user || !user.user_id) return;
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
  // --- End of fetching interests ---

  // --- Filtering logic (keep as is) ---
  const filteredUsers = useMemo(() => {
    return users
      .filter(user => !user.is_current_user) // Ensure user exists
      .filter(user => {
        if (!user) return false; // Basic check
        if (filters.selectedGenders.length > 0 && !filters.selectedGenders.includes(user.gender)) return false;
        if ((user.age ?? 0) < filters.ageRange.min || (user.age ?? 0) > filters.ageRange.max) return false;
        if (filters.selectedCountries.length > 0 && !filters.selectedCountries.includes(user.country)) return false;
        return true;
      });
  }, [users, filters]);
  // --- End of filtering ---

  // --- Active filters badge logic (keep as is) ---
   const hasActiveFilters = useMemo(() => {
     return (
       filters.selectedGenders.length > 0 ||
       filters.selectedCountries.length > 0 ||
       filters.ageRange.min !== DEFAULT_FILTERS.ageRange.min ||
       filters.ageRange.max !== DEFAULT_FILTERS.ageRange.max
     );
   }, [filters]);
  // --- End of active filters ---

  // --- Sorting logic (keep as is) ---
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      // VIP users first, then bots, then by country, then by nickname
      const aIsVip = a.role === 'vip' || a.vip_status;
      const bIsVip = b.role === 'vip' || b.vip_status;
      if (aIsVip && !bIsVip) return -1;
      if (!aIsVip && bIsVip) return 1;
      // If both are VIP or both are not VIP, continue sorting
      if (a.role === 'bot' && b.role !== 'bot') return -1; // Bots after VIPs
      if (a.role !== 'bot' && b.role === 'bot') return 1;
      // Fallback sorting if needed (e.g., by name)
      return (a.nickname || '').localeCompare(b.nickname || '');
    });
  }, [filteredUsers]);
  // --- End of sorting ---

  // --- Handlers (keep as is) ---
  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
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
    // Assuming current user ID is stored in localStorage or obtained differently
    const currentUserId = localStorage.getItem('userId');
    if (unblockUser && currentUserId) {
      await unblockUser(userId, currentUserId);
      // Optionally refetch or update user list state here
    } else {
        console.warn("Cannot unblock: unblockUser function or currentUserId missing.");
    }
  }, [unblockUser]);
  // --- End of handlers ---

  // --- Render ---
  return (
    // Use a container that allows the placeholder effect
    // Added dark mode background
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header with Filter Button */}
      {/* Added dark mode variants */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Online users ({sortedUsers.length})
        </span>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            // Added dark mode variants
            className="rounded-full relative text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Show filters"
          >
            <Filter className="h-5 w-5" />
            {hasActiveFilters && (
              // Added dark mode variant for filter dot border
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-900" />
            )}
          </Button>
          {showFilters && (
            <FilterPopup
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              onClickOutside={() => setShowFilters(false)}
              // Pass dark mode state to FilterPopup if it needs to adapt
            />
          )}
        </div>
      </div>

      {/* User List Area with Placeholder */}
      {/* Apply max-width, mx-auto, and relative positioning here */}
      {/* Keep py-2 on the outer container to give space for the placeholder's top/bottom */}
      <div className="flex-1 overflow-y-auto relative max-w-xs mx-auto w-full py-2">
          {/* Placeholder Background */}
          {/* Added dark mode variants */}
          <div className="absolute inset-x-0 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 z-0 ml-2 mr-2 top-1 bottom-1"></div>

          {/* Actual List (relative, z-10, space-y-3) */}
          {/* Removed py-2 from here, it's now on the parent */}
          <div className="relative z-10 space-y-3">
              {sortedUsers.map(user => (
                  <UserListItem
                      key={user.user_id}
                      // --- Pass required props ---
                      name={user.nickname}
                      gender={user.gender}
                      age={user.age}
                      country={user.country}
                      flagEmoji={user.flagEmoji} // Make sure this is in your user data
                      isVip={user.role === 'vip' || user.vip_status}
                      interests={userInterests[user.user_id] || []}
                      isSelected={selectedUserId === user.user_id}
                      onClick={() => handleUserSelection(user.user_id)}
                      avatarUrl={user.avatar_url}
                      avatarInitial={user.avatarInitial} // Make sure this is in your user data
                      avatarBgColor={user.avatarBgColor} // Make sure this is in your user data
                      avatarTextColor={user.avatarTextColor} // Make sure this is in your user data
                      isBlocked={blockedUsers.includes(user.user_id)}
                      onUnblock={
                          blockedUsers.includes(user.user_id)
                          ? () => handleUnblockUser(user.user_id)
                          : undefined
                      }
                      // --- End of props ---
                  />
              ))}
              {/* Add loading/empty states if needed */}
              {/* Added dark mode text color */}
              {sortedUsers.length === 0 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-10 px-4 relative z-10">
                      No users match the current filters.
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
