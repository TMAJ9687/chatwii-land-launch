
import { useState, useCallback } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, set, serverTimestamp, onDisconnect } from 'firebase/database';
import { toast } from 'sonner';
import { MOCK_VIP_USER } from '@/utils/mockUsers';
import { getUserProfile } from '@/lib/firebase';
import { useFirebaseListener } from '@/hooks/useFirebaseListener';

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

  // Process the presence data
  const handlePresenceUpdate = useCallback((data: any) => {
    if (!data) {
      setOnlineUsers([MOCK_VIP_USER]);
      return;
    }

    const users: PresenceUser[] = [];
    
    // Convert object to array
    Object.keys(data).forEach((userId) => {
      const userData = data[userId];
      if (userData) {
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
  }, [currentUserId]);

  // Setup presence listener
  useFirebaseListener(
    'presence',
    handlePresenceUpdate,
    (error) => console.error('Presence system error:', error),
    !!currentUserId,
    'presence-system'
  );

  // Initialize user's own presence
  useCallback(async () => {
    if (!currentUserId) return;

    try {
      // Get user profile data from Firestore to use in presence
      const userProfile = await getUserProfile(currentUserId);
      
      const myPresenceRef = ref(realtimeDb, `presence/${currentUserId}`);
      
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
    } catch (error) {
      console.error('Error initializing presence:', error);
      toast.error('Failed to connect to presence system');
    }
  }, [currentUserId]);

  return { onlineUsers };
};
