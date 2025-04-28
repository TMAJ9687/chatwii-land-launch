
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

  useEffect(() => {
    if (!currentUserId) return;

    const presenceRef = ref(realtimeDb, 'presence');
    const myPresenceRef = ref(realtimeDb, `presence/${currentUserId}`);

    const setupPresence = async () => {
      try {
        // Get user profile data from Firestore to use in presence
        const userProfile = await getUserProfile(currentUserId);
        
        // Set up disconnect hook to remove presence when user disconnects
        onDisconnect(myPresenceRef).remove();

        // Set initial presence with user profile data
        set(myPresenceRef, {
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

          // Always include mock VIP user
          if (!users.some(u => u.user_id === MOCK_VIP_USER.user_id)) {
            users.push(MOCK_VIP_USER);
          }

          setOnlineUsers(users);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error in presence system:', error);
        toast.error('Failed to connect to presence system');
      }
    };

    const unsubPromise = setupPresence();
    
    return () => {
      // Clean up presence on unmount
      if (userPresenceRef.current) {
        set(userPresenceRef.current, null);
      }
      
      unsubPromise.then(unsubFunc => {
        if (typeof unsubFunc === 'function') {
          unsubFunc();
        }
      }).catch(err => {
        console.error('Error cleaning up presence subscription:', err);
      });
    };
  }, [currentUserId]);

  return { onlineUsers };
};
