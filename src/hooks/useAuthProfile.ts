
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

export const useAuthProfile = () => {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('standard');
  const [isVipUser, setIsVipUser] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkAuthAndLoadProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setCurrentUserId(null);
          setProfile(null);
          navigate('/');
          return;
        }

        setCurrentUserId(session.user.id);

        const { data: dbProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (cancelled) return;

        if (!error && dbProfile) {
          setIsVipUser(dbProfile.vip_status || dbProfile.role === 'vip');
          setCurrentUserRole(dbProfile.role || 'standard');
          setProfile(dbProfile);
        } else {
          setCurrentUserId(null);
          setProfile(null);
          await supabase.auth.signOut();
          navigate('/');
          return;
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        if (!cancelled) {
          setCurrentUserId(null);
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    checkAuthAndLoadProfile();
    return () => { cancelled = true; };
  }, [navigate]);

  return {
    currentUserId,
    currentUserRole,
    isVipUser,
    profile,
    loading
  };
};
