
import { ref, set, serverTimestamp, onDisconnect, onValue, update } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/client';
import { UserProfile } from '@/integrations/firebase/auth';

// Enhanced presence utilities with proper cleanup
export const updateUserPresence = async (userId: string, profile: any) => {
  if (!userId) return null;

  try {
    const userStatusRef = ref(realtimeDb, `presence/${userId}`);
    const connectedRef = ref(realtimeDb, '.info/connected');

    // Setup presence handling
    const unsub = onValue(connectedRef, async (snapshot) => {
      if (!snapshot.val()) return;

      // Register cleanup on disconnect
      await onDisconnect(userStatusRef).remove();

      // Update user status to online
      await set(userStatusRef, {
        user_id: userId,
        nickname: profile?.nickname || 'Anonymous',
        role: profile?.role || 'standard',
        avatar_url: profile?.avatar_url || null,
        country: profile?.country || null,
        gender: profile?.gender || null,
        age: profile?.age || null,
        vip_status: profile?.vip_status || false,
        last_seen: serverTimestamp(),
        status: 'online',
        is_current_user: true
      });
    });

    return userStatusRef;
  } catch (error) {
    console.error('Failed to update user presence:', error);
    return null;
  }
};

export const removeUserPresence = async (userId: string) => {
  if (!userId) return false;

  try {
    const userPresenceRef = ref(realtimeDb, `presence/${userId}`);

    // Cancel the onDisconnect operation first
    try {
      await onDisconnect(userPresenceRef).cancel();
    } catch (error) {
      console.warn('Error canceling presence disconnect:', error);
    }

    // Then remove the presence immediately
    await set(userPresenceRef, null);
    return true;
  } catch (error) {
    console.error('Presence removal failed:', error);
    return false;
  }
};
