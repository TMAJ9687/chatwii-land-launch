
import { useState, useCallback } from "react";
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

  // Define shared keys to remove at the hook level so both functions can access it
  const keysToRemove = [
    'firebase_user_id',
    'firebase_user_role',
    'firebase_user_provider',
    'vip_registration_email',
    'vip_registration_nickname'
  ];

  // Hard force logout - for emergency situations
  const forceLogout = useCallback(() => {
    console.warn("FORCE LOGOUT: Clearing all state and redirecting");
    
    // Close Firebase connections without waiting
    try {
      closeDbConnection();
    } catch (e) {
      console.error("Error during force connection close:", e);
    }
    
    // Clear all related localStorage items
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Redirect immediately
    window.location.replace(defaultRedirect);
  }, [defaultRedirect, keysToRemove]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    // Set a timeout to force logout if it takes too long - even shorter now
    const forceLogoutTimeout = setTimeout(() => {
      console.warn("Logout operation timed out - forcing logout");
      forceLogout();
    }, 2000); // Force logout after 2 seconds if still processing

    try {
      const userId = localStorage.getItem('firebase_user_id');
      const role = localStorage.getItem('firebase_user_role') || 'standard';
      const provider = localStorage.getItem('firebase_user_provider');
      
      // Clean up localStorage immediately to prevent any further API calls with old credentials
      console.log("Clearing localStorage");
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // First, ensure DB connection is closed properly
      console.log("Starting Firebase connection closure");
      try {
        await Promise.race([
          closeDbConnection(),
          new Promise(resolve => setTimeout(resolve, 800)) // 800ms max timeout
        ]);
      } catch (err) {
        console.warn("Error closing DB connection, continuing with logout:", err);
      }
      
      // Then remove presence - if we get permission errors, that's ok
      if (userId) {
        console.log("Removing user presence");
        try {
          await Promise.race([
            removeUserPresence(userId),
            new Promise(resolve => setTimeout(resolve, 800)) // 800ms max timeout
          ]);
        } catch (err) {
          console.warn("Error removing presence, continuing with logout:", err);
        }
      }
      
      // Sign out the user - do this last
      console.log("Signing out");
      try {
        await Promise.race([
          signOutUser(),
          new Promise(resolve => setTimeout(resolve, 1000)) // 1s max timeout
        ]);
      } catch (err) {
        console.warn("Error during sign out, forcing redirect:", err);
      }
      
      // Handle profile deletion in the background
      const shouldDeleteProfile = role === 'standard' || provider === 'anonymous';
      if (userId && shouldDeleteProfile) {
        // Start a completely detached operation that won't block logout
        setTimeout(() => {
          deleteUserProfile(userId).catch(error => {
            console.warn('Background profile deletion error:', error);
          });
        }, 0);
      }

      // Clear the force logout timeout since we're done
      clearTimeout(forceLogoutTimeout);
      
      // Navigate to feedback page immediately
      console.log("Logout successful, redirecting");
      window.location.replace(defaultRedirect);
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("An error occurred during logout. Redirecting...");
      
      // Force logout anyway
      forceLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return { handleLogout, isLoggingOut };
};
