
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserListItem } from "@/components/UserListItem";

interface Profile {
  id: string;
  nickname: string;
  country: string;
  gender: string;
  age: number;
  vip_status: boolean;
  interests: string[];
  visibility: string;
}

interface UserListProps {
  onUserSelect: (userId: string) => void;
  selectedUserId?: string;
}

export const UserList = ({ onUserSelect, selectedUserId }: UserListProps) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [showFilters, setShowFilters] = useState(false);

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
          visibility,
          user_interests (
            interests (name)
          )
        `)
        .eq('visibility', 'online')
        .order('nickname');

      if (error) {
        console.error('Error fetching online profiles:', error);
        return;
      }

      // Transform the data to include interests as strings
      const usersWithInterests = profiles.map(profile => ({
        ...profile,
        interests: profile.user_interests?.map((ui: any) => ui.interests.name) || []
      }));

      setUsers(usersWithInterests);
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
                    interests: [],  // We'll need to fetch interests separately if needed
                    visibility: payload.new.visibility
                  };
                  
                  // Prevent duplicates
                  if (!currentUsers.some(u => u.id === newUser.id)) {
                    return [...currentUsers, newUser];
                  }
                  return currentUsers;
                });
              }
              break;
            case 'UPDATE':
              setUsers(currentUsers => {
                // If user goes offline, remove from list
                if (payload.new.visibility !== 'online') {
                  return currentUsers.filter(u => u.id !== payload.new.id);
                }
                
                // Update user details if already in list
                return currentUsers.map(user => {
                  if (user.id === payload.new.id) {
                    return {
                      ...user,
                      nickname: payload.new.nickname || user.nickname,
                      country: payload.new.country || user.country,
                      gender: payload.new.gender || user.gender,
                      age: payload.new.age || user.age,
                      vip_status: payload.new.vip_status || user.vip_status,
                      visibility: payload.new.visibility
                    };
                  }
                  return user;
                });
              });
              break;
            case 'DELETE':
              setUsers(currentUsers => 
                currentUsers.filter(u => u.id !== payload.old.id)
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
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header with filter */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          People ({users.length})
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setShowFilters(!showFilters)}
          className="rounded-full"
        >
          <Filter className="h-5 w-5" />
        </Button>
      </div>

      {/* User list */}
      <div className="overflow-y-auto flex-1">
        {users.map((user) => (
          <UserListItem
            key={user.id}
            name={user.nickname}
            gender={user.gender}
            age={user.age}
            country={user.country}
            isVip={user.vip_status}
            interests={user.interests}
            isSelected={selectedUserId === user.id}
            onClick={() => onUserSelect(user.id)}
          />
        ))}
      </div>
    </div>
  );
};
