
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfileDeletion } from "./useProfileDeletion";

export const useLogout = (defaultRedirect: string = "/feedback") => {
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
      
      // Default redirect to home for admins
      let redirectPath = '/';
      
      // Only change redirect for non-admin users
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
          
        // Only redirect non-admin, non-vip users to feedback
        if (profile?.role !== 'vip' && profile?.role !== 'admin') {
          redirectPath = defaultRedirect;
        }

        // Delete profile for standard and anonymous users
        if (profile?.role === 'standard' || user.app_metadata?.provider === 'anonymous') {
          const result = await deleteUserProfile(user.id);
          
          if (!result.success) {
            console.error('Profile deletion error:', result.error);
            toast.error('Failed to clean up profile on logout.');
          }
        }
      }

      // Sign out first so no more requests are made using the auth token
      const { error: signOutError } = await supabase.auth.signOut({
        scope: 'local' // Only sign out from this browser session
      });
      
      if (signOutError) throw signOutError;
      
      // Navigate after successful sign out
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 100); // Short timeout to ensure other operations can complete
    } catch (error) {
      console.error('Logout process failed:', error);
      toast.error("An unexpected error occurred during logout");
      navigate('/', { replace: true }); // Always navigate to home on error
    } finally {
      setIsLoggingOut(false);
    }
  };

  return {
    handleLogout,
    isLoggingOut
  };
};
