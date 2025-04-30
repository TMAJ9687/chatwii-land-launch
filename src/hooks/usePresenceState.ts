
import { useState, useEffect, useRef } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, onValue, set, serverTimestamp, onDisconnect, DatabaseReference } from 'firebase/database';
import { toast } from 'sonner';
import { getAvatarInitial, getAvatarColors } from '@/utils/userUtils';
import { getFlagEmoji, getCountryCode } from '@/utils/countryTools';
import { getUserProfile } from '@/lib/firebase';

// Define basic user types only in this file
interface PresenceUser {
  user_id: string;
  nickname: string;
  role?: string;
  avatar_url?: string | null;
  country?: string | null;
  gender?: string | null;
  age?: number | null;
  vip_status?: boolean;
  is_current_user?: boolean;
  avatarInitial: string;
  avatarBgColor: string;
  avatarTextColor: string;
  flagEmoji: string;
}

/**
 * Hook to handle a user's online presence state in Firebase Realtime Database
 */
export const usePresenceState = (userId: string | null) => {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const presenceRef = useRef<DatabaseReference | null>(null);

  useEffect(() => {
    if (!userId) return;
    
    const setupPresence = async () => {
      try {
        // Fetch user profile from Firestore
        const profile = await getUserProfile(userId);
        if (!profile) {
          console.warn('No profile found for user:', userId);
          setError('Unable to load user profile');
          return;
        }

        // Calculate avatar properties
        const avatarColors = getAvatarColors(userId);
        const avatarInitial = getAvatarInitial(profile.nickname || '');
        const countryCode = getCountryCode(profile.country || '');
        const flagEmoji = getFlagEmoji(countryCode);

        // Set up presence in Realtime DB
        const userPresenceRef = ref(realtimeDb, `presence/${userId}`);
        presenceRef.current = userPresenceRef;
        
        // Setup cleanup on disconnect
        await onDisconnect(userPresenceRef).remove();
        
        // Update user presence
        const presenceData = {
          user_id: userId,
          nickname: profile.nickname || 'Anonymous',
          role: profile.role || 'standard',
          avatar_url: profile.avatar_url || null,
          country: profile.country || null,
          gender: profile.gender || null,
          age: profile.age || null,
          vip_status: profile.vip_status || false,
          last_seen: serverTimestamp(),
          is_current_user: true,
          avatarInitial,
          avatarBgColor: avatarColors.bg,
          avatarTextColor: avatarColors.text,
          flagEmoji: flagEmoji || '🏳️'
        };
        
        await set(userPresenceRef, presenceData);
        
        // Monitor connection state to update lastSeen
        const connectedRef = ref(realtimeDb, '.info/connected');
        onValue(connectedRef, (snapshot) => {
          const connected = !!snapshot.val();
          setIsOnline(connected);
          if (connected) {
            setLastSeen(new Date());
          }
        });
        
        setError(null);
      } catch (err) {
        console.error('Error setting up presence:', err);
        setError(`Failed to update presence: ${err instanceof Error ? err.message : String(err)}`);
        toast.error('Failed to update online status');
      }
    };
    
    setupPresence();
    
    // Cleanup
    return () => {
      if (presenceRef.current) {
        // Cancel onDisconnect operations
        onDisconnect(presenceRef.current).cancel()
          .catch(err => console.warn('Error canceling disconnect:', err));
          
        // Remove the presence
        set(presenceRef.current, null)
          .catch(err => console.warn('Error removing presence:', err));
        
        presenceRef.current = null;
      }
    };
  }, [userId]);

  return { isOnline, lastSeen, error };
};
