
import { ref, set, serverTimestamp, onDisconnect } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/client';
import { UserProfile } from '@/integrations/firebase/auth';

/**
 * Updates a user's presence in the Firebase Realtime Database
 */
export const updateUserPresence = async (userId: string, profile: UserProfile | null) => {
  if (!userId) return;

  const userPresenceRef = ref(realtimeDb, `presence/${userId}`);

  try {
    // Set up disconnect hook
    onDisconnect(userPresenceRef).remove();

    // Update presence with current profile data
    await set(userPresenceRef, {
      user_id: userId,
      nickname: profile?.nickname || 'Anonymous',
      role: profile?.role || 'standard',
      avatar_url: profile?.avatar_url || null,
      country: profile?.country || null,
      gender: profile?.gender || null,
      age: profile?.age || null,
      vip_status: profile?.vip_status || false,
      last_seen: serverTimestamp(),
      is_current_user: true
    });
    
    return userPresenceRef;
  } catch (error) {
    console.error('Failed to update user presence:', error);
    throw error;
  }
};

/**
 * Removes a user's presence from the Firebase Realtime Database
 */
export const removeUserPresence = async (userId: string) => {
  if (!userId) return;

  const userPresenceRef = ref(realtimeDb, `presence/${userId}`);
  
  try {
    await set(userPresenceRef, null);
  } catch (error) {
    console.error('Failed to remove user presence:', error);
  }
};
