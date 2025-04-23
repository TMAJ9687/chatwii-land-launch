
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
    if (isLoggingOut) return; // Prevent multiple logout attempts
    
    setIsLoggingOut(true);
    try {
      // First, cancel any ongoing subscriptions
      await supabase.removeAllChannels();
      
      // Get current user before signing out
      const { data: { user } } = await supabase.auth.getUser();

      // Sign out first so no more requests are made using the auth token
      const { error: signOutError } = await supabase.auth.signOut({
        scope: 'local' // Only sign out from this browser session
      });
      
      if (signOutError) throw signOutError;

      // For anonymous users, mark the profile as deleted to free up the nickname
      if (user && user.app_metadata?.provider === 'anonymous') {
        await deleteUserProfile(user.id).catch(error => {
          console.error('Profile deletion error:', error);
          // Not throwing here to ensure navigation still happens
        });
      }
      
      // Navigate after successful sign out
      setTimeout(() => {
        navigate(redirectTo, { replace: true });
      }, 100); // Short timeout to ensure other operations can complete
    } catch (error) {
      console.error('Logout process failed:', error);
      toast.error("An unexpected error occurred during logout");
      navigate(redirectTo, { replace: true }); // Navigate anyway to prevent user being stuck
    } finally {
      setIsLoggingOut(false);
    }
  };

  return {
    handleLogout,
    isLoggingOut
  };
};
