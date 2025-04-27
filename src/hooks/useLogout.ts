
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOutUser } from "@/lib/firebase";
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
      // Get current user ID before logout
      const userId = localStorage.getItem('firebase_user_id');
      let redirectPath = '/';
      let shouldDeleteProfile = false;

      if (userId) {
        // Get role from localStorage
        const role = localStorage.getItem('firebase_user_role') || 'standard';
        
        if (role !== 'vip' && role !== 'admin') {
          redirectPath = defaultRedirect;
          shouldDeleteProfile = role === 'standard' || 
                              localStorage.getItem('firebase_user_provider') === 'anonymous';
        }

        // Delete profile for standard and anonymous users only
        if (shouldDeleteProfile) {
          const result = await deleteUserProfile(userId);
          if (!result.success) {
            console.error('Profile deletion error:', result.error);
            toast.error('Failed to clean up profile on logout.');
          }
        }
      }

      // Sign out from Firebase
      await signOutUser();

      // Clear local storage (VIP registration data still needs to be cleared)
      localStorage.removeItem('vip_registration_email');
      localStorage.removeItem('vip_registration_nickname');
      localStorage.removeItem('firebase_user_id');
      localStorage.removeItem('firebase_user_role');
      localStorage.removeItem('firebase_user_provider');
      
      // Clear all for non-VIP users
      if (shouldDeleteProfile) {
        window.localStorage.clear();
      }

      // Reload to clean up any hanging state in memory
      setTimeout(() => {
        window.location.replace(redirectPath);
      }, 100);
    } catch (error) {
      console.error('Logout process failed:', error);
      toast.error("An unexpected error occurred during logout");
      window.location.replace('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return {
    handleLogout,
    isLoggingOut
  };
};
