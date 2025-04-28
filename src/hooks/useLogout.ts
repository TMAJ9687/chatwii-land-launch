
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

    // Set a timeout to force logout if it takes too long
    const forceLogoutTimeout = setTimeout(() => {
      console.warn("Logout operation timed out - forcing logout");
      localStorage.removeItem('firebase_user_id');
      localStorage.removeItem('firebase_user_role');
      localStorage.removeItem('firebase_user_provider');
      localStorage.removeItem('vip_registration_email');
      localStorage.removeItem('vip_registration_nickname');
      window.location.replace(defaultRedirect);
    }, 5000); // Force logout after 5 seconds if still processing

    try {
      const userId = localStorage.getItem('firebase_user_id');
      const role = localStorage.getItem('firebase_user_role') || 'standard';
      const provider = localStorage.getItem('firebase_user_provider');
      const shouldDeleteProfile = role === 'standard' || provider === 'anonymous';

      // Run all cleanup operations in parallel where possible
      const promises = [];
      
      // First, remove user presence to stop realtime updates
      if (userId) {
        promises.push(
          removeUserPresence(userId).catch(error => {
            console.warn('Failed to remove presence:', error);
            return null; // Allow operation to continue
          })
        );
      }

      // Then clean up user profile if needed, but don't wait if it fails
      if (userId && shouldDeleteProfile) {
        // Don't wait for profile deletion to complete, just start it
        deleteUserProfile(userId).catch(error => {
          console.warn('Profile deletion error - continuing with logout:', error);
        });
      }

      // Wait for presence removal (with timeout)
      await Promise.all(
        promises.map(promise => 
          Promise.race([
            promise, 
            new Promise(resolve => setTimeout(resolve, 1000))
          ])
        )
      );
      
      // Close all Firebase database connections first
      try {
        await closeDbConnection();
      } catch (error) {
        console.warn("Error closing database connections:", error);
      }

      // Sign out the user
      try {
        await signOutUser();
      } catch (error) {
        console.warn("Error signing out:", error);
      }

      // Clean up localStorage immediately
      ['vip_registration_email', 'vip_registration_nickname', 'firebase_user_id', 'firebase_user_role', 'firebase_user_provider']
        .forEach(key => localStorage.removeItem(key));

      // Clear the force logout timeout since we're done
      clearTimeout(forceLogoutTimeout);
      
      // Navigate to feedback page immediately
      window.location.replace(defaultRedirect);
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("An error occurred during logout. Redirecting...");
      
      // Even with errors, clean up and redirect
      ['vip_registration_email', 'vip_registration_nickname', 'firebase_user_id', 'firebase_user_role', 'firebase_user_provider']
        .forEach(key => localStorage.removeItem(key));
        
      clearTimeout(forceLogoutTimeout);
      window.location.replace('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return { handleLogout, isLoggingOut };
};
