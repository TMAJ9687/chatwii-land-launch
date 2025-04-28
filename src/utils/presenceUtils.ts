
import { ref, set, serverTimestamp, onDisconnect, onValue } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/client';

// Enhanced presence utilities with proper cleanup and error handling
export const updateUserPresence = async (userId: string, profile: any) => {
  if (!userId) return null;

  try {
    const userStatusRef = ref(realtimeDb, `presence/${userId}`);
    const connectedRef = ref(realtimeDb, '.info/connected');

    // Setup presence handling
    const unsub = onValue(connectedRef, async (snapshot) => {
      if (!snapshot.val()) return;

      try {
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
      } catch (error) {
        console.warn('Failed to set up presence:', error);
      }
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

    // Cancel the onDisconnect operation first, with error handling
    try {
      await onDisconnect(userPresenceRef).cancel();
    } catch (error) {
      console.warn('Error canceling presence disconnect, continuing with logout:', error);
      // Continue with logout process even if this fails
    }

    // Then try to remove the presence
    try {
      await set(userPresenceRef, null);
      return true;
    } catch (error) {
      // Just log but consider it successful for logout flow
      console.warn('Presence removal failed due to permissions, continuing with logout:', error);
      return true; // Return true to not block logout flow
    }
  } catch (error) {
    console.warn('Presence system error, continuing with logout:', error);
    return true; // Return true to not block logout flow
  }
};
