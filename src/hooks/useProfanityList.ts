
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { trackFirestoreListener } from "@/integrations/firebase/client";

/**
 * Hook for fetching profanity lists from Firebase with real-time updates
 * and better error handling
 */
export function useProfanityList(type: 'nickname' | 'chat' = 'nickname') {
  const [profanityList, setProfanityList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const siteSettingsRef = doc(db, "site_settings", "1");
    let unsubscribe: (() => void) | null = null;
    
    // Initial fetch using getDoc instead of onSnapshot
    const fetchProfanity = async () => {
      try {
        setIsLoading(true);
        const docSnap = await getDoc(siteSettingsRef);
        let arr: string[] = [];
        if (docSnap.exists() && docSnap.data()?.settings) {
          const settings = docSnap.data().settings;
          const key = type === 'nickname' ? 'profanity_nickname' : 'profanity_chat';
          arr = Array.isArray(settings[key]) ? settings[key].map(String) : [];
        }
        setProfanityList(arr);
      } catch (e) {
        console.warn("Failed to fetch profanity list:", e);
        setError("Failed to fetch profanity list");
        setProfanityList([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfanity();

    // Try to set up real-time updates, but gracefully handle permissions errors
    try {
      unsubscribe = onSnapshot(
        siteSettingsRef,
        (docSnap) => {
          if (!docSnap.exists()) return;
          const settings = docSnap.data().settings || {};
          const key = type === 'nickname' ? 'profanity_nickname' : 'profanity_chat';
          const list = Array.isArray(settings[key]) ? settings[key].map(String) : [];
          setProfanityList(list);
          setError(null);
        },
        (err) => {
          console.warn("Error listening to profanity list changes:", err);
          // Don't set error state here - we'll use the initial fetch data
          // instead of showing an error to the user
        }
      );

      // Register for global cleanup on logout
      if (unsubscribe) {
        trackFirestoreListener(unsubscribe);
      }
    } catch (err) {
      console.warn("Failed to set up profanity listener:", err);
      // Continue with initial data, no need to set error
    }

    // Local cleanup on unmount or type change
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [type]);

  return { profanityList, isLoading, error };
}
