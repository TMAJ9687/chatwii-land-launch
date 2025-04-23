
import { supabase } from '@/lib/supabase';

export const useProfileDeletion = () => {
  const deleteUserProfile = async (userId: string) => {
    try {
      // We'll just mark the profile as deleted instead of actually deleting it
      // This prevents errors with references to the profile
      const { error } = await supabase
        .from('profiles')
        .update({ 
          visibility: 'offline',
          nickname: `deleted_${Date.now()}_${userId.substring(0, 8)}` // Make nickname unique
        })
        .eq('id', userId);

      if (error) {
        console.error('Profile update error:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Profile deletion error:', error);
      return { success: false, error };
    }
  };

  return { deleteUserProfile };
};
