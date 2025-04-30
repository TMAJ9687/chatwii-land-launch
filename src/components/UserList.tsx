import React, { useState, useMemo, useEffect, useCallback } from 'react'; // Ensure React is imported
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserListItem } from '@/components/UserListItem'; // Import updated UserListItem
import { FilterPopup } from '@/components/FilterPopup';
import { FilterState, DEFAULT_FILTERS, Gender } from '@/types/filters'; // Import the Gender type from filters.ts
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFlagEmoji, getCountryCode } from '@/utils/countryTools'; // Import getFlagEmoji

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
  // Added properties
  avatarInitial?: string;
  avatarBgColor?: string;
  avatarTextColor?: string;
  flagEmoji?: string;
}
// --- End of User type ---

interface UserListProps {
  users: OnlineUser[]; // Use the more detailed OnlineUser type
  onUserSelect: (userId: string) => void;
  selectedUserId?: string;
}

// Helper function to get avatar initial from nickname
const getAvatarInitial = (nickname: string): string => {
  return nickname ? nickname.charAt(0).toUpperCase() : '?';
};

// Helper function to get consistent avatar colors based on user ID
const getAvatarColors = (userId: string): { bg: string, text: string } => {
  // Create a simple hash from the user ID
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Define color sets (background and text colors that work well together)
  const colorSets = [
    { bg: 'bg-purple-100', text: 'text-purple-600' },
    { bg: 'bg-blue-100', text: 'text-blue-600' },
    { bg: 'bg-green-100', text: 'text-green-600' },
    { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    { bg: 'bg-red-100', text: 'text-red-600' },
    { bg: 'bg-pink-100', text: 'text-pink-600' },
    { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  ];
  
  // Use the hash to select a color set
  const colorIndex = hash % colorSets.length;
  return colorSets[colorIndex];
};

export const UserList: React.FC<UserListProps> = ({ users, onUserSelect, selectedUserId }) => {
  const { blockedUsers, unblockUser } = useBlockedUsers();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [userInterests, setUserInterests] = useState<Record<string, string[]>>({});

  // Debug: Log props on mount and when they change
  useEffect(() => {
    console.log('UserList Component:', {
      users: users.length,
      selectedUserId,
      blockedUsers: blockedUsers.length,
    });
    
    // More detailed debug for the first few users
    if (users.length > 0) {
      console.log('Sample users:', users.slice(0, 3));
    }
  }, [users, selectedUserId, blockedUsers]);

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

  // --- Filtering logic with type-safe gender check ---
  const filteredUsers = useMemo(() => {
    console.log('Filtering users:', users.length);
    
    return users
      .filter(user => {
        // Log to debug user filtering
        if (!user) {
          console.warn('Found undefined or null user in users array');
          return false;
        }
        
        if (!user.user_id) {
          console.warn('Found user without user_id:', user);
          return false;
        }
        
        // Skip current user
        if (user.is_current_user) {
          console.log('Filtering out current user:', user.user_id);
          return false;
        }
        
        return true;
      })
      .filter(user => {
        if (!user) return false; // Basic check
        
        // Fixed type issue: use type safe comparison for gender
        // Check if the user's gender is in the selected genders array
        if (filters.selectedGenders.length > 0) {
          // No need for casting since we updated the Gender type to include string
          if (!filters.selectedGenders.includes(user.gender)) {
            return false;
          }
        }
        
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

  // --- Process users to add required UserListItem props ---
  const processedUsers = useMemo(() => {
    console.log('Processing filtered users:', filteredUsers.length);
    return filteredUsers.map(user => {
      // Use existing properties if available or generate them
      const avatarInitial = user.avatarInitial ?? getAvatarInitial(user.nickname);
      const colors = user.avatarBgColor && user.avatarTextColor
        ? { bg: user.avatarBgColor, text: user.avatarTextColor }
        : getAvatarColors(user.user_id);
      
      // Get country code and flag emoji if not already provided
      const countryCode = getCountryCode(user.country);
      const flagEmoji = user.flagEmoji ?? getFlagEmoji(countryCode);
      
      return {
        ...user,
        avatarInitial,
        avatarBgColor: colors.bg,
        avatarTextColor: colors.text,
        flagEmoji: flagEmoji || '🏳️' // Fallback to neutral flag if no emoji found
      };
    });
  }, [filteredUsers]);

  // --- Sorting logic with processed users ---
  const sortedUsers = useMemo(() => {
    console.log('Sorting processed users:', processedUsers.length);
    return [...processedUsers].sort((a, b) => {
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
  }, [processedUsers]);
  // --- End of sorting ---

  // --- Handlers (keep as is) ---
  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const handleUserSelection = useCallback((userId: string) => {
    console.log('User selected:', userId);
    const user = users.find(u => u.user_id === userId);
    if (user && !user.is_current_user) {
      onUserSelect(userId);
    } else if (user?.is_current_user) {
      console.log('Cannot select current user');
    } else {
      console.warn('User not found in users list:', userId);
    }
  }, [users, onUserSelect]);

  const handleUnblockUser = useCallback(async (userId: string) => {
    // Assuming current user ID is stored in localStorage or obtained differently
    const currentUserId = localStorage.getItem('userId');
    console.log('Unblocking user:', userId, 'Current user:', currentUserId);
    
    if (unblockUser && currentUserId) {
      await unblockUser(userId, currentUserId);
      // Optionally refetch or update user list state here
      console.log('User unblocked successfully');
    } else {
        console.warn("Cannot unblock: unblockUser function or currentUserId missing.");
    }
  }, [unblockUser]);
  // --- End of handlers ---

  // --- Render ---
  return (
    // Use a container that allows the placeholder effect
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

      {/* User List Area with Placeholder */}
      {/* Apply max-width, mx-auto, and relative positioning here */}
      <div className="flex-1 overflow-y-auto relative max-w-xs mx-auto w-full py-2">
          {/* Placeholder Background */}
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 z-0 ml-2 mr-2 top-2 bottom-2"></div>

          {/* Actual List (relative, z-10, space-y-3) */}
          <div className="relative z-10 space-y-3">
              {sortedUsers.length > 0 ? (
                  sortedUsers.map(user => (
                      <UserListItem
                          key={user.user_id}
                          // --- Pass required props ---
                          name={user.nickname}
                          gender={user.gender}
                          age={user.age}
                          country={user.country}
                          flagEmoji={user.flagEmoji || '🏳️'}
                          isVip={user.role === 'vip' || user.vip_status}
                          interests={userInterests[user.user_id] || []}
                          isSelected={selectedUserId === user.user_id}
                          onClick={() => handleUserSelection(user.user_id)}
                          avatarUrl={user.avatar_url}
                          avatarInitial={user.avatarInitial || getAvatarInitial(user.nickname)}
                          avatarBgColor={user.avatarBgColor || getAvatarColors(user.user_id).bg}
                          avatarTextColor={user.avatarTextColor || getAvatarColors(user.user_id).text}
                          isBlocked={blockedUsers.includes(user.user_id)}
                          onUnblock={
                              blockedUsers.includes(user.user_id)
                              ? () => handleUnblockUser(user.user_id)
                              : undefined
                          }
                          // --- End of props ---
                      />
                  ))
              ) : (
                  <div className="text-center text-gray-500 py-10 px-4 relative z-10">
                      {users.length > 0 ? 'No users match the current filters.' : 'No online users found.'}
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
