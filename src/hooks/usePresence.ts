
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface PresenceUser {
  user_id: string;
  nickname: string;
  role: string;
  avatar_url: string | null;
  country: string | null;
  gender: string | null;
  age: number | null;
  vip_status: boolean;
  profile_theme?: string;
  interests?: string[];
  is_current_user: boolean;
}

export const usePresence = (currentUserId: string | null) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchUserData = async () => {
      try {
        // Get current user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUserId)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          return null;
        }

        // Get user's interests
        const { data: userInterests, error: interestsError } = await supabase
          .from('user_interests')
          .select(`
            interest_id,
            interests (name)
          `)
          .eq('user_id', currentUserId);

        if (interestsError) {
          console.error('Error fetching user interests:', interestsError);
        }

        const interests = userInterests?.map(item => item.interests?.name).filter(Boolean) || [];

        return {
          ...profile,
          interests
        };
      } catch (error) {
        console.error('Error in fetchUserData:', error);
        return null;
      }
    };

    const setupPresence = async () => {
      const userData = await fetchUserData();
      if (!userData) return;

      const channel = supabase.channel('online_users', {
        config: {
          presence: {
            key: currentUserId,
          },
        },
      });

      const handleSync = () => {
        console.log('Presence sync event in usePresence hook');
        const state = channel.presenceState();
        const users: PresenceUser[] = [];
        
        Object.values(state).forEach((arr: any) => {
          if (Array.isArray(arr)) {
            users.push(...arr.map(user => ({
              ...user,
              is_current_user: user.user_id === currentUserId
            })));
          }
        });
        
        console.log('Online users after sync:', users.length);
        setOnlineUsers(users);
      };

      const handleJoin = ({ newPresences }: { newPresences: any[] }) => {
        console.log('Presence join event in usePresence hook:', newPresences.length);
        setOnlineUsers(prev => {
          const existingIds = new Set(prev.map(u => u.user_id));
          const newOnes = newPresences.map(p => ({
            ...p,
            is_current_user: p.user_id === currentUserId
          })).filter(p => !existingIds.has(p.user_id));
          return [...prev, ...newOnes];
        });
      };

      const handleLeave = ({ leftPresences }: { leftPresences: any[] }) => {
        console.log('Presence leave event in usePresence hook:', leftPresences.length);
        setOnlineUsers(prev =>
          prev.filter(user => !leftPresences.some(left => left.user_id === user.user_id))
        );
      };

      channel
        .on('presence', { event: 'sync' }, handleSync)
        .on('presence', { event: 'join' }, handleJoin)
        .on('presence', { event: 'leave' }, handleLeave)
        .subscribe(async (status) => {
          console.log('Presence channel subscription status:', status);
          
          if (status === 'SUBSCRIBED' && currentUserId) {
            try {
              console.log('Tracking presence for current user:', currentUserId);
              await channel.track({
                user_id: currentUserId,
                nickname: userData.nickname || 'Anonymous',
                role: userData.role || 'standard',
                avatar_url: userData.avatar_url,
                country: userData.country,
                gender: userData.gender,
                age: userData.age,
                vip_status: !!userData.vip_status,
                profile_theme: userData.profile_theme,
                interests: userData.interests || [],
                is_current_user: true
              });
            } catch (error) {
              console.error('Error tracking presence:', error);
            }
          }
        });

      channelRef.current = channel;
    };

    setupPresence();

    return () => {
      if (channelRef.current) {
        console.log('Cleaning up presence channel');
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUserId]);

  return { onlineUsers };
};
