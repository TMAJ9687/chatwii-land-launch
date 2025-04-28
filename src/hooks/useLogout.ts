import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOutUser } from "@/lib/firebase";
import { toast } from "sonner";
import { useProfileDeletion } from "./useProfileDeletion";
import { removeUserPresence } from '@/utils/presenceUtils';

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

      const cleanupTasks = [signOutUser()];

      if (userId && shouldDeleteProfile) {
        cleanupTasks.push(Promise.race([
          deleteUserProfile(userId),
          new Promise((_, reject) => setTimeout(() => reject('Profile deletion timeout'), 5000))
        ]));
        cleanupTasks.push(removeUserPresence(userId));
      }

      await Promise.allSettled(cleanupTasks);

      ['vip_registration_email', 'vip_registration_nickname', 'firebase_user_id', 'firebase_user_role', 'firebase_user_provider']
        .forEach(localStorage.removeItem);

      setTimeout(() => window.location.replace(defaultRedirect), 100);
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