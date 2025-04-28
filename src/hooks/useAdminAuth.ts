
import { useState, useEffect } from 'react';
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from 'firebase/firestore';
import { toast } from "sonner";

export const useAdminAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          setIsAdmin(false);
          setUser(null);
          setIsLoading(false);
          return;
        }

        const profileRef = doc(db, "profiles", currentUser.uid);
        const profileSnap = await getDoc(profileRef);

        if (!profileSnap.exists() || profileSnap.data()?.role !== 'admin') {
          setIsAdmin(false);
          setUser(null);
        } else {
          setIsAdmin(true);
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Admin check failed:", error);
        setIsAdmin(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();

    // Listen for auth changes
    const unsubscribe = auth.onAuthStateChanged(() => {
      checkAdminStatus();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { isLoading, isAdmin, user };
};
