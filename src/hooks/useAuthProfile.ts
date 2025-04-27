
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  subscribeToAuthChanges, 
  getUserProfile
} from '@/lib/firebase';

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

    const checkAuthAndLoadProfile = async () => {
      try {
        // Subscribe to auth changes
        const unsubscribe = subscribeToAuthChanges(async (user) => {
          if (cancelled) return;

          if (!user) {
            setCurrentUserId(null);
            setProfile(null);
            navigate('/');
            setLoading(false);
            return;
          }

          setCurrentUserId(user.uid);

          // Get user profile from Firestore
          const userProfile = await getUserProfile(user.uid);

          if (cancelled) return;

          if (userProfile) {
            setIsVipUser(userProfile.vip_status || userProfile.role === 'vip');
            setCurrentUserRole(userProfile.role || 'standard');
            setProfile(userProfile as UserProfile);
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
      // Handle the promise correctly
      unsubPromise.then(unsubFunc => {
        if (typeof unsubFunc === 'function') {
          unsubFunc();
        }
      }).catch(err => {
        console.error('Error cleaning up auth subscription:', err);
      });
    };
  }, [navigate]);

  return {
    currentUserId,
    currentUserRole,
    isVipUser,
    profile,
    loading
  };
};
