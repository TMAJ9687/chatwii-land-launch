
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
        // Delete the profile first
        const { success, error } = await deleteUserProfile(user.id);
        
        if (!success && error) {
          console.error('Profile deletion error:', error);
          toast.error("Could not fully delete profile");
          return;
        }
      }

      // Sign out after successful profile deletion
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      
      // Clean up all Supabase subscriptions
      await supabase.removeAllChannels();
      
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
