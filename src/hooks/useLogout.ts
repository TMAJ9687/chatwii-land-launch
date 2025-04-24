
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useProfileDeletion } from "./useProfileDeletion";

export const useLogout = (defaultRedirect: string = "/feedback") => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { deleteUserProfile } = useProfileDeletion();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      // Get current user and role before any deletion
      const { data: { user } } = await supabase.auth.getUser();
      let redirectPath = '/';
      let shouldDeleteProfile = false;

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          // Only redirect non-admin, non-vip users to feedback
          if (profile.role !== 'vip' && profile.role !== 'admin') {
            redirectPath = defaultRedirect;
            shouldDeleteProfile = profile.role === 'standard' || 
                                user.app_metadata?.provider === 'anonymous';
          }

          // Delete profile for standard and anonymous users
          if (shouldDeleteProfile) {
            const result = await deleteUserProfile(user.id);
            if (!result.success) {
              console.error('Profile deletion error:', result.error);
              toast.error('Failed to clean up profile on logout.');
            }
          }
        }
      }

      // Remove all channels after profile deletion to prevent further queries
      await supabase.removeAllChannels();
      
      // Sign out first so no more requests are made using the auth token
      const { error: signOutError } = await supabase.auth.signOut({
        scope: 'local'
      });
      
      if (signOutError) throw signOutError;
      
      // Navigate after successful sign out
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 100);
    } catch (error) {
      console.error('Logout process failed:', error);
      toast.error("An unexpected error occurred during logout");
      navigate('/', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return {
    handleLogout,
    isLoggingOut
  };
};
