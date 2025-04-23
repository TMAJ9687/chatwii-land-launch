
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useLogout = (redirectTo: string = "/feedback") => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        console.log('Attempting to delete profile for user:', user.id);
        
        // Forcefully remove the user's entire profile
        const { error: deleteProfileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);

        if (deleteProfileError) {
          console.error('Error deleting profile:', deleteProfileError);
          // Continue with logout even if profile deletion fails
          toast.error("Could not fully remove profile, but proceeding with logout");
        }

        // Delete user interests
        const { error: deleteInterestsError } = await supabase
          .from('user_interests')
          .delete()
          .eq('user_id', user.id);

        if (deleteInterestsError) {
          console.error('Error deleting user interests:', deleteInterestsError);
        }
      }

      // Sign out
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      
      navigate(redirectTo);
    } catch (error) {
      console.error('Logout process failed:', error);
      toast.error("An unexpected error occurred during logout");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return {
    handleLogout,
    isLoggingOut
  };
};
