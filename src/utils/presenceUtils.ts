
import { ref, set, serverTimestamp, onDisconnect, onValue } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/client';
import { toast } from 'sonner';
import { getAvatarInitial, getAvatarColors } from '@/utils/userUtils';
import { getCountryCode, getFlagEmoji } from '@/utils/countryTools';

// Enhanced presence utilities with proper cleanup and error handling
export const updateUserPresence = async (userId: string, profile: any) => {
  if (!userId) {
    console.error("Cannot update presence: No user ID provided");
    return null;
  }

  try {
    console.log(`Setting up presence for ${userId}`, profile);
    const userStatusRef = ref(realtimeDb, `presence/${userId}`);
    const connectedRef = ref(realtimeDb, '.info/connected');

    // Setup presence handling
    const unsub = onValue(connectedRef, async (snapshot) => {
      if (!snapshot.val()) {
        console.log("Not connected to Firebase");
        return;
      }
      
      console.log(`Connected to Firebase, setting up presence for ${userId}`);

      try {
        // Calculate avatar and flag properties
        const avatarInitial = getAvatarInitial(profile?.nickname || 'Anonymous');
        const colors = getAvatarColors(userId);
        const countryCode = getCountryCode(profile?.country || '');
        const flagEmoji = getFlagEmoji(countryCode || '');

        // Register cleanup on disconnect - ONLY on the user's presence node, NOT on the .info/connected node
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
          is_current_user: true,
          avatarInitial,
          avatarBgColor: colors.bg,
          avatarTextColor: colors.text,
          flagEmoji
        });
        console.log(`Presence successfully set for ${userId}`);
      } catch (error) {
        console.error('Failed to set up presence:', error);
        toast.error('Could not update your online status');
      }
    }, (error) => {
      // Error handler for onValue
      console.error('Error connecting to presence system:', error);
      toast.error('Failed to connect to chat system');
    });

    return userStatusRef;
  } catch (error) {
    console.error('Failed to update user presence:', error);
    toast.error('Failed to update your online status');
    return null;
  }
};

export const removeUserPresence = async (userId: string) => {
  if (!userId) {
    console.warn("Cannot remove presence: No user ID provided");
    return false;
  }

  try {
    console.log(`Removing presence for ${userId}`);
    const userPresenceRef = ref(realtimeDb, `presence/${userId}`);

    // Cancel the onDisconnect operation first, with error handling
    try {
      await onDisconnect(userPresenceRef).cancel();
      console.log(`Cancelled onDisconnect for ${userId}`);
    } catch (error) {
      // If this fails with permission error, it's usually because the user is already logged out
      // or the session has expired, so we can safely continue with logout
      console.warn('Error canceling presence disconnect, continuing with logout:', error);
      return true; // Continue with logout flow even if this fails
    }

    // Then try to remove the presence
    try {
      await set(userPresenceRef, null);
      console.log(`Successfully removed presence for ${userId}`);
      return true;
    } catch (error) {
      // Silently handle permission errors during logout
      // This is expected if the user's session has already expired
      console.warn('Presence removal failed, continuing with logout:', error);
      return true; // Continue with logout flow even if this fails
    }
  } catch (error) {
    console.warn('Presence system error, continuing with logout:', error);
    return true; // Continue with logout flow
  }
};
