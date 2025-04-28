import { ref, set, serverTimestamp, onDisconnect, onValue, update } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/client';
import { UserProfile } from '@/integrations/firebase/auth';

export const updateUserPresence = async (userId, profile) => {
  if (!userId) return;

  const userStatusRef = ref(realtimeDb, `presence/${userId}`);
  const connectedRef = ref(realtimeDb, '.info/connected');

  onValue(connectedRef, async (snapshot) => {
    if (!snapshot.val()) return;

    await onDisconnect(userStatusRef).remove();

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
};

export const removeUserPresence = async (userId) => {
  if (!userId) return;
  const userPresenceRef = ref(realtimeDb, `presence/${userId}`);

  try {
    await onDisconnect(userPresenceRef).cancel();
    await set(userPresenceRef, null);
  } catch (error) {
    console.error('Presence removal failed:', error);
  }
};