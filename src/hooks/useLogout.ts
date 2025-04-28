
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOutUser } from "@/lib/firebase";
import { toast } from "sonner";
import { useProfileDeletion } from "./useProfileDeletion";
import { removeUserPresence } from '@/utils/presenceUtils';
import { closeDbConnection } from '@/integrations/firebase/client';

export const useLogout = (defaultRedirect = "/feedback") => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { deleteUserProfile } = useProfileDeletion();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      const userId = localStorage.getItem('firebase_user_id');
      const role = localStorage.getItem('firebase_user_role') || 'standard';
      const provider = localStorage.getItem('firebase_user_provider');
      const shouldDeleteProfile = role === 'standard' || provider === 'anonymous';

      // Run operations in parallel where possible
      const promises = [];
      
      // First, remove user presence to stop realtime updates
      if (userId) {
        promises.push(removeUserPresence(userId));
      }

      // Then clean up user profile if needed
      if (userId && shouldDeleteProfile) {
        promises.push(
          deleteUserProfile(userId).catch(error => {
            console.error('Profile deletion error:', error);
          })
        );
      }

      // Wait for presence removal and profile deletion (with timeout)
      await Promise.all(promises);
      
      // Close all Firebase database connections first
      await closeDbConnection();

      // Sign out the user
      await signOutUser();

      // Clean up localStorage
      ['vip_registration_email', 'vip_registration_nickname', 'firebase_user_id', 'firebase_user_role', 'firebase_user_provider']
        .forEach(key => localStorage.removeItem(key));

      // Navigate to feedback page immediately
      window.location.replace(defaultRedirect);
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("An unexpected error occurred during logout");
      window.location.replace('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return { handleLogout, isLoggingOut };
};
