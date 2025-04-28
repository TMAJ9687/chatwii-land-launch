
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
    }, 3000); // Force logout after 3 seconds if still processing (reduced from 5s)

    try {
      const userId = localStorage.getItem('firebase_user_id');
      const role = localStorage.getItem('firebase_user_role') || 'standard';
      const provider = localStorage.getItem('firebase_user_provider');
      const shouldDeleteProfile = role === 'standard' || provider === 'anonymous';

      // Start non-blocking profile deletion if needed
      if (userId && shouldDeleteProfile) {
        // Don't wait or block the main logout flow - completely detached operation
        setTimeout(() => {
          deleteUserProfile(userId).catch(error => {
            console.warn('Async profile deletion error:', error);
          });
        }, 0);
      }
      
      // Only wait for fast operations with short timeouts
      try {
        // Close all Firebase database connections first with timeout
        await Promise.race([
          closeDbConnection(),
          new Promise(resolve => setTimeout(resolve, 1000)) // 1s max
        ]);
        
        // Remove presence with timeout
        if (userId) {
          await Promise.race([
            removeUserPresence(userId),
            new Promise(resolve => setTimeout(resolve, 1000)) // 1s max
          ]);
        }
      } catch (error) {
        console.warn("Non-critical logout operation timed out:", error);
      }

      // Sign out the user
      try {
        await Promise.race([
          signOutUser(),
          new Promise(resolve => setTimeout(resolve, 1500)) // 1.5s max
        ]);
      } catch (error) {
        console.warn("Error or timeout signing out:", error);
      }

      // Clean up localStorage immediately
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Clear the force logout timeout since we're done
      clearTimeout(forceLogoutTimeout);
      
      // Navigate to feedback page immediately
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
