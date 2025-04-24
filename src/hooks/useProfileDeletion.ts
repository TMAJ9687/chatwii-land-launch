
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export const useProfileDeletion = () => {
  const verifyProfileDeletion = async (userId: string): Promise<boolean> => {
    try {
      // Verify the profile was correctly updated
      const { data, error } = await supabase
        .from('profiles')
        .select('visibility, deleted_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Verification error:', error);
        return false;
      }

      // Check if the profile has been marked as deleted
      return data.visibility === 'offline' && data.deleted_at !== null;
    } catch (error) {
      console.error('Profile verification failed:', error);
      return false;
    }
  };

  const deleteUserProfile = async (userId: string) => {
    try {
      // Generate a unique placeholder to replace the nickname
      // This frees up the original nickname for future use
      const deletedNicknameSuffix = uuidv4().substring(0, 8);
      
      // Update the profile to mark it as deleted and free up the nickname
      const { error } = await supabase
        .from('profiles')
        .update({ 
          visibility: 'offline',
          deleted_at: new Date().toISOString(),
          nickname: `deleted-${deletedNicknameSuffix}` // Free original nickname with unique placeholder
        })
        .eq('id', userId);

      if (error) {
        console.error('Profile deletion error:', error);
        toast.error('Failed to update profile.');
        return { success: false, error };
      }
      
      // Verify the deletion was successful
      const isVerified = await verifyProfileDeletion(userId);
      
      if (!isVerified) {
        console.error('Profile deletion verification failed');
        return { 
          success: false, 
          error: new Error('Profile deletion verification failed') 
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Profile deletion error:', error);
      return { success: false, error };
    }
  };

  return { deleteUserProfile };
};
