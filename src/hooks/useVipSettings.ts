
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ProfileTheme, VisibilityStatus } from '@/types/profile';

interface ProfileData {
  avatar_url: string;
  profile_theme: ProfileTheme;
  visibility: VisibilityStatus;
  country: string;
  gender: string; // Added gender property
}

export const useVipSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    avatar_url: '',
    profile_theme: 'default',
    visibility: 'online',
    country: '',
    gender: 'male', // Default gender
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/vip/login');
        return;
      }
      
      // Fetch user profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
        navigate('/chat');
        return;
      }
      
      // Check if user is a VIP
      if (!profile.vip_status) {
        toast.error('This page is for VIP users only');
        navigate('/chat');
        return;
      }
      
      // Set profile data
      setProfileData({
        avatar_url: profile.avatar_url || '',
        profile_theme: (profile.profile_theme as ProfileTheme) || 'default',
        visibility: (profile.visibility as VisibilityStatus) || 'online',
        country: profile.country || '',
        gender: profile.gender || 'male', // Add gender with a default value if not present
      });
      
      setLoading(false);
    };
    
    checkAuth();
  }, [navigate]);
  
  const handleSave = async () => {
    setSaving(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/vip/login');
      return;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({
        avatar_url: profileData.avatar_url,
        profile_theme: profileData.profile_theme,
        visibility: profileData.visibility,
        country: profileData.country,
        // Don't update gender here as it's not editable in the VIP settings
      })
      .eq('id', session.user.id);
    
    if (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to save settings');
      setSaving(false);
      return;
    }
    
    toast.success('Settings saved successfully');
    setSaving(false);
  };
  
  const handleVisibilityChange = (checked: boolean) => {
    setProfileData(prev => ({
      ...prev,
      visibility: checked ? 'online' : 'invisible',
    }));
  };

  return {
    profileData,
    setProfileData,
    loading,
    saving,
    handleSave,
    handleVisibilityChange
  };
};
