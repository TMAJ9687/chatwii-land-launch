
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/profile';

export const useUserList = (onUserSelect: (userId: string) => void, selectedUserId?: string) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user ID
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
      }
    };

    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          nickname,
          country,
          gender,
          age,
          vip_status,
          role,
          visibility,
          avatar_url,
          profile_theme,
          user_interests (
            interests (name)
          )
        `)
        .order('role', { ascending: false }); // This will put 'vip' before 'standard' alphabetically

      if (error) {
        console.error('Error fetching online profiles:', error);
        return;
      }

      // Transform the data to include interests as strings
      const usersWithInterests = profiles
        .filter(profile => {
          // Show everyone except users with 'invisible' visibility
          // Exception: current user can always see themselves
          return profile.visibility !== 'invisible' || profile.id === currentUserId;
        })
        .map(profile => ({
          ...profile,
          interests: profile.user_interests?.map((ui: any) => ui.interests.name) || []
        }));

      // Sort users based on VIP status, country, and nickname
      const sortedUsers = sortUsers(usersWithInterests);
      setUsers(sortedUsers);
    };

    // Initial fetch of online users
    fetchOnlineUsers();

    // Set up real-time subscription
    const channel = supabase
      .channel('online_users')
      .on(
        'postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles' 
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              if (payload.new.visibility === 'online') {
                setUsers(currentUsers => {
                  const newUser: Profile = {
                    id: payload.new.id,
                    nickname: payload.new.nickname || '',
                    country: payload.new.country || '',
                    gender: payload.new.gender || '',
                    age: payload.new.age || 0,
                    vip_status: payload.new.vip_status || false,
                    role: payload.new.role || 'standard',
                    interests: [],
                    visibility: payload.new.visibility,
                    avatar_url: payload.new.avatar_url,
                    profile_theme: payload.new.profile_theme,
                  };
                  
                  // Prevent duplicates
                  if (!currentUsers.some(u => u.id === newUser.id)) {
                    const updatedUsers = [...currentUsers, newUser];
                    return sortUsers(updatedUsers);
                  }
                  return currentUsers;
                });
              }
              break;
            case 'UPDATE':
              setUsers(currentUsers => {
                // Handle visibility changes
                if (payload.new.visibility !== 'online' && payload.new.id !== currentUserId) {
                  return sortUsers(currentUsers.filter(u => u.id !== payload.new.id));
                }
                
                // Update user details if already in list
                const updatedUsers = currentUsers.map(user => {
                  if (user.id === payload.new.id) {
                    return {
                      ...user,
                      nickname: payload.new.nickname || user.nickname,
                      country: payload.new.country || user.country,
                      gender: payload.new.gender || user.gender,
                      age: payload.new.age || user.age,
                      vip_status: payload.new.vip_status || user.vip_status,
                      role: payload.new.role || user.role,
                      visibility: payload.new.visibility,
                      avatar_url: payload.new.avatar_url,
                      profile_theme: payload.new.profile_theme,
                    };
                  }
                  return user;
                });
                
                return sortUsers(updatedUsers);
              });
              break;
            case 'DELETE':
              setUsers(currentUsers => 
                sortUsers(currentUsers.filter(u => u.id !== payload.old.id))
              );
              break;
          }
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // Helper function to sort users
  const sortUsers = (users: Profile[]) => {
    return [...users].sort((a, b) => {
      // VIPs first
      if ((a.role === 'vip' || a.vip_status) && !(b.role === 'vip' || b.vip_status)) return -1;
      if (!(a.role === 'vip' || a.vip_status) && (b.role === 'vip' || b.vip_status)) return 1;

      // If both are VIPs, sort by nickname
      if ((a.role === 'vip' || a.vip_status) && (b.role === 'vip' || b.vip_status)) {
        return a.nickname.localeCompare(b.nickname);
      }

      // For standard users, sort by country then nickname
      if (a.country !== b.country) {
        return (a.country || '').localeCompare(b.country || '');
      }
      return a.nickname.localeCompare(b.nickname);
    });
  };

  return {
    users,
    showFilters,
    setShowFilters,
    onUserSelect,
    selectedUserId
  };
};
