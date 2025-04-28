import { useState, useEffect, useRef } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, onValue, set, serverTimestamp, onDisconnect } from 'firebase/database';
import { toast } from 'sonner';
import { MOCK_VIP_USER } from '@/utils/mockUsers';
import { getUserProfile } from '@/lib/firebase';

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

  // --- Handle presence setup/cleanup ---
  useEffect(() => {
    if (!currentUserId) return;

    let unsubPresenceListener: (() => void) | undefined;

    // Setup user presence in database and presence listener
    const setupPresence = async () => {
      try {
        // Fetch user profile
        const userProfile = await getUserProfile(currentUserId);

        // Reference for user's own presence
        const myPresenceRef = ref(realtimeDb, `presence/${currentUserId}`);

        // Remove presence on disconnect
        onDisconnect(myPresenceRef).remove();

        // Set initial presence data
        await set(myPresenceRef, {
          user_id: currentUserId,
          nickname: userProfile?.nickname || 'Anonymous',
          role: userProfile?.role || 'standard',
          avatar_url: userProfile?.avatar_url || null,
          country: userProfile?.country || null,
          gender: userProfile?.gender || null,
          age: userProfile?.age || null,
          vip_status: userProfile?.vip_status || false,
          last_seen: serverTimestamp(),
          is_current_user: true
        });

        userPresenceRef.current = myPresenceRef;

        // Listen for global presence updates
        const presenceRef = ref(realtimeDb, 'presence');
        unsubPresenceListener = onValue(presenceRef, (snapshot) => {
          const users: PresenceUser[] = [];
          if (!snapshot.exists()) {
            setOnlineUsers([MOCK_VIP_USER]);
            return;
          }
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
          // Always include mock VIP user
          if (!users.some(u => u.user_id === MOCK_VIP_USER.user_id)) {
            users.push(MOCK_VIP_USER);
          }
          setOnlineUsers(users);
        });

      } catch (error) {
        console.error('Error in presence system:', error);
        toast.error('Failed to connect to presence system');
      }
    };

    setupPresence();

    // Cleanup on unmount
    return () => {
      if (userPresenceRef.current) {
        set(userPresenceRef.current, null);
      }
      if (typeof unsubPresenceListener === 'function') {
        unsubPresenceListener();
      }
    };
  }, [currentUserId]);

  return { onlineUsers };
};
