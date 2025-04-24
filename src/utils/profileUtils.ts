
import { supabase } from '@/integrations/supabase/client';

/**
 * Directly checks if a nickname is available in the database
 * This is useful for debugging nickname availability issues
 */
export const checkNicknameAvailability = async (nickname: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('is_nickname_available', { 
      check_nickname: nickname 
    });
    
    if (error) {
      console.error('Error checking nickname availability:', error);
      return false;
    }
    
    return !!data; // Convert to boolean
  } catch (error) {
    console.error('Failed to check nickname availability:', error);
    return false;
  }
};
