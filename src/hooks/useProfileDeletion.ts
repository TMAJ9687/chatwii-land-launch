
import { supabase } from '@/lib/supabase';

export const useProfileDeletion = () => {
  const deleteUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Profile deletion error:', error);
      return { success: false, error };
    }
  };

  return { deleteUserProfile };
};
