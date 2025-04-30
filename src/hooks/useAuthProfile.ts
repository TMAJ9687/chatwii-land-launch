
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  subscribeToAuthChanges, 
  getUserProfile
} from '@/lib/firebase';
import { updateUserPresence, removeUserPresence } from '@/utils/presenceUtils';
import { storeCurrentUserId } from '@/utils/channelUtils';

// Define the UserProfile type inline
interface UserProfile {
  id: string;
  displayName?: string;
  nickname?: string;
  email?: string;
  photoURL?: string;
  role: 'standard' | 'vip' | 'admin' | 'bot';
  vip_status?: boolean;
  created_at?: any;
  updated_at?: any;
  banned?: boolean;
  ban_reason?: string;
  banned_until?: any;
}

export const useAuthProfile = () => {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('standard');
  const [isVipUser, setIsVipUser] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let presenceRef: any = null;

    const checkAuthAndLoadProfile = async () => {
      try {
        // Subscribe to auth changes - now using Firebase's auth listener
        const unsubscribe = subscribeToAuthChanges(async (user) => {
          if (cancelled) return;

          if (!user) {
            // Clean up presence if user was previously logged in
            if (currentUserId) {
              await removeUserPresence(currentUserId);
              storeCurrentUserId(null);
            }
            
            setCurrentUserId(null);
            setProfile(null);
            navigate('/');
            setLoading(false);
            return;
          }

          setCurrentUserId(user.uid);
          storeCurrentUserId(user.uid);
          console.log('User authenticated:', user.uid);

          // Get user profile from Firestore
          const userProfile = await getUserProfile(user.uid);
          console.log('User profile loaded:', userProfile);

          if (cancelled) return;

          if (userProfile) {
            setIsVipUser(userProfile.vip_status || userProfile.role === 'vip');
            setCurrentUserRole(userProfile.role || 'standard');
            setProfile(userProfile as UserProfile);
            
            // Update user presence with profile data
            try {
              presenceRef = await updateUserPresence(user.uid, userProfile);
              console.log('User presence updated');
            } catch (error) {
              console.error('Failed to update presence:', error);
            }
          } else {
            setCurrentUserId(null);
            setProfile(null);
            navigate('/');
          }
          
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error loading profile:', error);
        if (!cancelled) {
          setCurrentUserId(null);
          setProfile(null);
          setLoading(false);
        }
        return () => {};
      }
    };

    const unsubPromise = checkAuthAndLoadProfile();
    
    return () => { 
      cancelled = true; 
      // Clean up presence reference
      if (presenceRef) {
        removeUserPresence(currentUserId || '');
      }
      
      // Handle the promise correctly
      unsubPromise.then(unsubFunc => {
        if (typeof unsubFunc === 'function') {
          unsubFunc();
        }
      }).catch(err => {
        console.error('Error cleaning up auth subscription:', err);
      });
    };
  }, [navigate, currentUserId]);

  return {
    currentUserId,
    currentUserRole,
    isVipUser,
    profile,
    loading
  };
};
