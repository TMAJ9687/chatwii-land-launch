
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { MOCK_VIP_USER } from '@/utils/mockUsers';

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
  const adminChannelRef = useRef<any>(null);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchUserData = async () => {
      try {
        // Check if the ID looks like a Firebase ID (not a UUID)
        const isFirebaseId = currentUserId.length > 20 && !currentUserId.includes('-');
        
        // If it's a Firebase ID, return a basic profile since we can't query Supabase
        if (isFirebaseId) {
          console.log('Using Firebase ID, returning basic profile');
          return {
            nickname: 'User',
            role: 'standard',
            avatar_url: null,
            country: null,
            gender: null,
            age: null,
            vip_status: false,
            profile_theme: 'default',
            interests: []
          };
        }
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUserId)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          return null;
        }

        return {
          ...profile,
          interests: [] // We'll fetch interests separately for valid UUIDs only
        };
      } catch (error) {
        console.error('Error in fetchUserData:', error);
        return null;
      }
    };

    const setupPresence = async () => {
      try {
        const userData = await fetchUserData();
        if (!userData) {
          console.error('Could not fetch user data for presence');
          return;
        }

        // Create a unique channel name that includes the user ID
        const channelName = `online_users_${Date.now()}`;
        console.log('Setting up presence channel:', channelName);

        const channel = supabase.channel(channelName, {
          config: {
            presence: {
              key: currentUserId,
            },
          },
        });

        const handleSync = () => {
          console.log('Presence sync event');
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
          
          // Add mock VIP user if not already present
          if (!users.some(u => u.user_id === MOCK_VIP_USER.user_id)) {
            users.push(MOCK_VIP_USER);
          }
          
          console.log('Online users after sync:', users);
          setOnlineUsers(users);
        };

        const handleJoin = ({ newPresences }: { newPresences: any[] }) => {
          console.log('Presence join event:', newPresences);
          setOnlineUsers(prev => {
            const existingIds = new Set(prev.map(u => u.user_id));
            const newOnes = newPresences.map(p => ({
              ...p,
              is_current_user: p.user_id === currentUserId
            })).filter(p => !existingIds.has(p.user_id));
            
            return existingIds.has(MOCK_VIP_USER.user_id) 
              ? [...prev, ...newOnes]
              : [...prev, ...newOnes, MOCK_VIP_USER];
          });
        };

        const handleLeave = ({ leftPresences }: { leftPresences: any[] }) => {
          console.log('Presence leave event:', leftPresences);
          setOnlineUsers(prev => 
            prev.filter(user => 
              !leftPresences.some(left => left.user_id === user.user_id) || 
              user.user_id === MOCK_VIP_USER.user_id
            )
          );
        };

        channel
          .on('presence', { event: 'sync' }, handleSync)
          .on('presence', { event: 'join' }, handleJoin)
          .on('presence', { event: 'leave' }, handleLeave)
          .subscribe(async (status) => {
            console.log('Channel subscription status:', status);
            
            if (status === 'SUBSCRIBED') {
              try {
                const presenceData = {
                  user_id: currentUserId,
                  nickname: userData.nickname || 'Anonymous',
                  role: userData.role || 'standard',
                  avatar_url: userData.avatar_url,
                  country: userData.country,
                  gender: userData.gender,
                  age: userData.age,
                  vip_status: !!userData.vip_status,
                  profile_theme: userData.profile_theme || 'default',
                  interests: userData.interests,
                  is_current_user: true
                };

                console.log('Tracking presence with data:', presenceData);
                await channel.track(presenceData);
              } catch (error) {
                console.error('Error tracking presence:', error);
                toast.error('Failed to update online status');
              }
            }
          });

        channelRef.current = channel;

        // Listen for admin actions
        const adminActionChannel = supabase.channel(`admin-actions-${currentUserId}`);
        
        adminActionChannel
          .on('broadcast', { event: 'kick' }, () => {
            console.log('User kicked');
            toast.error('You have been kicked by an administrator');
            if (channelRef.current) {
              channelRef.current.unsubscribe();
            }
            window.location.href = '/';
          })
          .on('broadcast', { event: 'ban' }, (payload) => {
            console.log('User banned:', payload);
            toast.error(`You have been banned by an administrator${payload?.reason ? `: ${payload.reason}` : ''}`);
            if (channelRef.current) {
              channelRef.current.unsubscribe();
            }
            window.location.href = '/';
          })
          .subscribe();

        adminChannelRef.current = adminActionChannel;

      } catch (error) {
        console.error('Error in setupPresence:', error);
        toast.error('Failed to connect to presence system');
      }
    };

    setupPresence();

    return () => {
      if (channelRef.current) {
        console.log('Cleaning up presence channel');
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (adminChannelRef.current) {
        console.log('Cleaning up admin channel');
        supabase.removeChannel(adminChannelRef.current);
        adminChannelRef.current = null;
      }
    };
  }, [currentUserId]);

  return { onlineUsers };
};
