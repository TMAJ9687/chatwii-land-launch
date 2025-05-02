
import { useState, useCallback, useEffect } from 'react';
import { auth, getUserProfile } from '@/lib/firebase';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export function useAuthVerification() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [userId, setUserId] = useState<string | null>(null);
  
  const verifyAuth = useCallback(async () => {
    setAuthStatus('loading');
    
    try {
      // First check local storage for user ID
      const storedUserId = localStorage.getItem('firebase_user_id');
      
      if (!storedUserId) {
        console.log("No user ID found in localStorage");
        setAuthStatus('unauthenticated');
        setUserId(null);
        return false;
      }
      
      // Double-check with Firebase auth object
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.log("No auth.currentUser, waiting for auth state to initialize...");
        
        // Wait for auth state to initialize (give it a short timeout)
        const authPromise = new Promise<boolean>((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            if (user && user.uid === storedUserId) {
              console.log("Auth initialized, user confirmed:", user.uid);
              setUserId(user.uid);
              setAuthStatus('authenticated');
              resolve(true);
            } else {
              console.log("Auth initialized, no matching user");
              setUserId(null);
              setAuthStatus('unauthenticated');
              resolve(false);
            }
          });
        });
        
        // Set a timeout to avoid hanging indefinitely
        const timeoutPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => {
            console.log("Auth check timed out, using localStorage as fallback");
            setUserId(storedUserId);
            setAuthStatus('authenticated');
            resolve(true);
          }, 2000);
        });
        
        return await Promise.race([authPromise, timeoutPromise]);
      }
      
      // If current user doesn't match stored ID, there's an inconsistency
      if (currentUser.uid !== storedUserId) {
        console.warn("User ID mismatch between localStorage and auth:", {
          localStorage: storedUserId,
          authUser: currentUser.uid
        });
        
        // Use the auth user ID as it's more trustworthy
        localStorage.setItem('firebase_user_id', currentUser.uid);
        setUserId(currentUser.uid);
      } else {
        setUserId(storedUserId);
      }
      
      // Finally, verify that user has a profile
      try {
        const profile = await getUserProfile(currentUser.uid);
        if (!profile) {
          console.log("No profile found for user:", currentUser.uid);
          // We still consider them authenticated, just without a complete profile
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        // Don't fail authentication just because profile fetch failed
      }
      
      setAuthStatus('authenticated');
      return true;
    } catch (error) {
      console.error("Auth verification error:", error);
      setAuthStatus('unauthenticated');
      setUserId(null);
      return false;
    }
  }, []);
  
  // Initialize on mount
  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  return {
    authStatus,
    userId,
    verifyAuth,
    isAuthenticated: authStatus === 'authenticated'
  };
}
