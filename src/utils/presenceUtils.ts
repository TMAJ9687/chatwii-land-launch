
import { ref, set, serverTimestamp, onDisconnect, onValue } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/client';
import { UserProfile } from '@/integrations/firebase/auth';

/**
 * Updates a user's presence in the Firebase Realtime Database
 * with proper cleanup on disconnection
 */
export const updateUserPresence = async (userId: string, profile: UserProfile | null) => {
  if (!userId) return null;

  try {
    // Create references for presence
    const userStatusRef = ref(realtimeDb, `presence/${userId}`);
    const connectedRef = ref(realtimeDb, '.info/connected');
    
    // Listen for connection state
    onValue(connectedRef, async (snapshot) => {
      // Only proceed if we're connected
      if (snapshot.val() === false) {
        return;
      }
      
      // When we disconnect, remove this device from user's presence
      await onDisconnect(userStatusRef).remove();
      
      // Set the user's presence with their profile data
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
    throw error;
  }
};

/**
 * Manually removes a user's presence from the Firebase Realtime Database
 * This is called when a user logs out
 */
export const removeUserPresence = async (userId: string) => {
  if (!userId) return;

  const userPresenceRef = ref(realtimeDb, `presence/${userId}`);
  
  try {
    // Remove the onDisconnect operation first
    await onDisconnect(userPresenceRef).cancel();
    
    // Then remove the presence data
    await set(userPresenceRef, null);
  } catch (error) {
    console.error('Failed to remove user presence:', error);
  }
};

/**
 * Updates a user's status to 'away' when they become inactive
 */
export const updateUserStatusToAway = async (userId: string) => {
  if (!userId) return;

  const userPresenceRef = ref(realtimeDb, `presence/${userId}`);
  
  try {
    await set(userPresenceRef, {
      status: 'away',
      last_seen: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Failed to update user status to away:', error);
  }
};

/**
 * Updates a user's status back to 'online' when they become active again
 */
export const updateUserStatusToOnline = async (userId: string) => {
  if (!userId) return;

  const userPresenceRef = ref(realtimeDb, `presence/${userId}`);
  
  try {
    await set(userPresenceRef, {
      status: 'online',
      last_seen: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Failed to update user status to online:', error);
  }
};
