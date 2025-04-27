
import { useState, useEffect, useRef } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, onValue, set, serverTimestamp, onDisconnect } from 'firebase/database';
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
  const userPresenceRef = useRef<any>(null);

  useEffect(() => {
    if (!currentUserId) return;

    const presenceRef = ref(realtimeDb, 'presence');
    const myPresenceRef = ref(realtimeDb, `presence/${currentUserId}`);

    try {
      // Set up disconnect hook
      onDisconnect(myPresenceRef).remove();

      // Listen for presence changes
      const unsubscribe = onValue(presenceRef, (snapshot) => {
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

        if (!users.some(u => u.user_id === MOCK_VIP_USER.user_id)) {
          users.push(MOCK_VIP_USER);
        }

        setOnlineUsers(users);
      });

      // Set initial presence
      set(myPresenceRef, {
        user_id: currentUserId,
        nickname: 'Anonymous',
        role: 'standard',
        avatar_url: null,
        country: null,
        gender: null,
        age: null,
        vip_status: false,
        last_seen: serverTimestamp(),
        is_current_user: true
      });

      return () => {
        unsubscribe();
        if (myPresenceRef) {
          set(myPresenceRef, null);
        }
      };
    } catch (error) {
      console.error('Error in presence system:', error);
      toast.error('Failed to connect to presence system');
    }
  }, [currentUserId]);

  return { onlineUsers };
};
