
import { useState, useEffect } from 'react';
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
  is_current_user: boolean;
}

export const usePresence = (currentUserId: string | null) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!currentUserId) return;

    const presenceChannel = supabase.channel('online_users', {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    const handleSync = () => {
      const state = presenceChannel.presenceState();
      const users: PresenceUser[] = [];
      Object.values(state).forEach((arr: any) => {
        if (Array.isArray(arr)) {
          users.push(...arr.map(user => ({
            ...user,
            is_current_user: user.user_id === currentUserId
          })));
        }
      });
      setOnlineUsers(users);
    };

    const handleJoin = ({ newPresences }: { newPresences: any[] }) => {
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
      setOnlineUsers(prev =>
        prev.filter(user => !leftPresences.some(left => left.user_id === user.user_id))
      );
    };

    presenceChannel
      .on('presence', { event: 'sync' }, handleSync)
      .on('presence', { event: 'join' }, handleJoin)
      .on('presence', { event: 'leave' }, handleLeave)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && currentUserId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUserId)
            .single();

          if (profile) {
            await presenceChannel.track({
              user_id: currentUserId,
              nickname: profile.nickname,
              role: profile.role,
              avatar_url: profile.avatar_url,
              country: profile.country,
              gender: profile.gender,
              age: profile.age,
              vip_status: profile.vip_status,
              profile_theme: profile.profile_theme,
              is_current_user: true
            });
          }
        }
      });

    return () => {
      presenceChannel.untrack();
      supabase.removeChannel(presenceChannel);
    };
  }, [currentUserId]);

  return { onlineUsers };
};
