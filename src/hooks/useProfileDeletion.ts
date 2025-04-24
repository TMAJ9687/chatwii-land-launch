
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useProfileDeletion = () => {
  const deleteUserProfile = async (userId: string) => {
    try {
      // Update the profile to mark it as deleted instead of changing the nickname
      // This allows the nickname to be reused in the future
      const { error } = await supabase
        .from('profiles')
        .update({ 
          visibility: 'offline',
          deleted_at: new Date().toISOString() // Mark when the profile was deleted
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
