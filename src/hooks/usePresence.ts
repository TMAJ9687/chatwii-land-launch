
import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { onValue, ref, set, onDisconnect, push, remove, serverTimestamp } from 'firebase/database';
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
  const userPresenceRef = useRef<any>(null);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchUserData = async () => {
      try {
        // Use Firebase to fetch user profile if needed
        // For now, we'll create a basic structure
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

        // Set up Firebase Realtime Database references
        const presenceRef = ref(db, 'presence');
        const myPresenceRef = ref(db, `presence/${currentUserId}`);

        // User went offline
        onDisconnect(myPresenceRef).remove();

        // Listen for all online users
        onValue(presenceRef, (snapshot) => {
          if (!snapshot.exists()) {
            setOnlineUsers([MOCK_VIP_USER]);
            return;
          }

          const users: PresenceUser[] = [];
          snapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();
            const userId = childSnapshot.key;
            
            if (userData && userId) {
              users.push({
                ...userData,
                user_id: userId,
                is_current_user: userId === currentUserId
              });
            }
          });

          // Add mock VIP user if not already present
          if (!users.some(u => u.user_id === MOCK_VIP_USER.user_id)) {
            users.push(MOCK_VIP_USER);
          }

          console.log('Online users:', users);
          setOnlineUsers(users);
        });

        // Set my presence data
        set(myPresenceRef, {
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
          last_seen: serverTimestamp(),
          is_current_user: true
        });

        userPresenceRef.current = myPresenceRef;

        // Handle admin actions through a different mechanism
        // For now, we'll set up a basic structure
        console.log('Presence system initialized with Firebase');
      } catch (error) {
        console.error('Error in setupPresence:', error);
        toast.error('Failed to connect to presence system');
      }
    };

    setupPresence();

    return () => {
      if (userPresenceRef.current) {
        console.log('Cleaning up presence');
        remove(userPresenceRef.current);
        userPresenceRef.current = null;
      }
    };
  }, [currentUserId]);

  return { onlineUsers };
};
