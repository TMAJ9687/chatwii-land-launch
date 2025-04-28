
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

/**
 * Hook for fetching profanity lists from Firebase with real-time updates
 */
export function useProfanityList(type: 'nickname' | 'chat' = 'nickname') {
  const [profanityList, setProfanityList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const siteSettingsRef = doc(db, "site_settings", "1");
    
    const fetchProfanity = async () => {
      try {
        setIsLoading(true);
        const docSnap = await getDoc(siteSettingsRef);
          
        let arr: string[] = [];
        if (docSnap.exists() && docSnap.data()?.settings) {
          const settings = docSnap.data().settings;
          const key = type === 'nickname' ? 'profanity_nickname' : 'profanity_chat';
          arr = Array.isArray(settings[key])
            ? settings[key].map(String)
            : [];
        }
        setProfanityList(arr);
      } catch (e) {
        setError("Failed to fetch profanity list");
        setProfanityList([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Initial fetch
    fetchProfanity();

    // Subscribe to changes
    const unsubscribe = onSnapshot(siteSettingsRef, (doc) => {
      if (doc.exists()) {
        const settings = doc.data()?.settings || {};
        const key = type === 'nickname' ? 'profanity_nickname' : 'profanity_chat';
        const list = Array.isArray(settings[key])
          ? settings[key].map(String)
          : [];
        setProfanityList(list);
      }
    }, error => {
      console.error("Error listening to profanity list changes:", error);
      setError("Failed to listen to profanity list changes");
    });

    return () => {
      unsubscribe();
    };
  }, [type]);

  return { profanityList, isLoading, error };
}
