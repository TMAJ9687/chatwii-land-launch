
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfileDeletion } from "./useProfileDeletion";

export const useLogout = (redirectTo: string = "/feedback") => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { deleteUserProfile } = useProfileDeletion();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Get current user before signing out
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { success, error } = await deleteUserProfile(user.id);
        if (!success) {
          toast.error("Could not fully remove profile, but proceeding with logout");
        }
      }

      // Sign out after profile deletion attempt
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
