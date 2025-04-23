
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const useProfileDeletion = () => {
  const deleteUserProfile = async (userId: string) => {
    try {
      // First delete user interests as they depend on the profile
      const { error: deleteInterestsError } = await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', userId);

      if (deleteInterestsError) {
        console.error('Error deleting user interests:', deleteInterestsError);
      }

      // Then delete the profile
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
