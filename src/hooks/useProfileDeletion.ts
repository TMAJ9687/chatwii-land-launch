
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useProfileDeletion = () => {
  const deleteUserProfile = async (userId: string): Promise<{success: boolean, error?: any}> => {
    try {
      // Step 1: Check the user's role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        toast.error('Failed to fetch profile for deletion.');
        return { success: false, error: profileError };
      }

      // Step 2: Skip deletion for admin and VIP users
      if (profile.role === 'admin' || profile.role === 'vip') {
        console.log(`Skipping deletion for ${profile.role} user: ${userId}`);
        return { success: true }; // No deletion needed
      }

      // Step 3: Delete files from storage (chat_images bucket)
      const { data: fileList, error: listError } = await supabase.storage
        .from('chat_images')
        .list('', { search: `${userId}_` }); // File names start with userId_

      if (listError) {
        console.error('Error listing storage files:', listError);
        toast.error('Failed to list storage files for cleanup.');
        return { success: false, error: listError };
      }

      if (fileList && fileList.length > 0) {
        const filePaths = fileList.map(file => file.name);
        const { error: deleteStorageError } = await supabase.storage
          .from('chat_images')
          .remove(filePaths);

        if (deleteStorageError) {
          console.error('Error deleting storage files:', deleteStorageError);
          toast.error('Failed to delete storage files.');
          return { success: false, error: deleteStorageError };
        }
      }

      // Step 4: Delete associated reports
      const { error: reportError } = await supabase
        .from('reports')
        .delete()
        .or(`reporter_id.eq.${userId},reported_id.eq.${userId}`);

      if (reportError) {
        console.error('Error deleting reports:', reportError);
        toast.error('Failed to clean up reports.');
        return { success: false, error: reportError };
      }

      // Step 5: Delete daily_photo_uploads records
      const { error: photoError } = await supabase
        .from('daily_photo_uploads')
        .delete()
        .eq('user_id', userId);

      if (photoError) {
        console.error('Error deleting daily_photo_uploads:', photoError);
        toast.error('Failed to clean up photo upload records.');
        return { success: false, error: photoError };
      }

      // Step 6: Delete the profile
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (deleteError) {
        console.error('Profile deletion error:', deleteError);
        toast.error('Failed to delete profile.');
        return { success: false, error: deleteError };
      }

      console.log(`Successfully deleted profile for user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error('Profile deletion error:', error);
      return { success: false, error };
    }
  };

  return { deleteUserProfile };
};
