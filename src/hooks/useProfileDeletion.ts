
import { supabase } from '@/lib/supabase';

export const useProfileDeletion = () => {
  const deleteUserProfile = async (userId: string) => {
    try {
      const { error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (deleteProfileError) {
        throw deleteProfileError;
      }

      return { success: true };
    } catch (error) {
      console.error('Profile deletion error:', error);
      return { success: false, error };
    }
  };

  return { deleteUserProfile };
};
