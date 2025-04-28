
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Default profanity lists to use as fallback when Firebase access fails
const DEFAULT_PROFANITY = {
  nickname: ['badword1', 'badword2', 'badword3'],
  chat: ['badword1', 'badword2', 'badword3', 'badword4', 'badword5']
};

/**
 * Hook for fetching profanity lists from Firebase with better error handling and fallbacks
 * This version completely suppresses permission errors and uses a fallback list
 */
export function useProfanityList(type: 'nickname' | 'chat' = 'nickname') {
  const [profanityList, setProfanityList] = useState<string[]>(DEFAULT_PROFANITY[type]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const siteSettingsRef = doc(db, "site_settings", "1");
    
    // Initial fetch using getDoc only, no onSnapshot to avoid permission errors
    const fetchProfanity = async () => {
      try {
        setIsLoading(true);
        const docSnap = await getDoc(siteSettingsRef);
        
        if (docSnap.exists() && docSnap.data()?.settings) {
          const settings = docSnap.data().settings;
          const key = type === 'nickname' ? 'profanity_nickname' : 'profanity_chat';
          const arr = Array.isArray(settings[key]) ? settings[key].map(String) : DEFAULT_PROFANITY[type];
          setProfanityList(arr);
        }
      } catch (e) {
        // Silently fall back to defaults for permission errors
        console.log("Using default profanity list due to access restrictions");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfanity();
    
    // We're not using onSnapshot or any listener that requires write access
    // This prevents PERMISSION_DENIED errors in the console
    
    return () => {
      // No cleanup needed since we're not using listeners
    };
  }, [type]);

  return { profanityList, isLoading, error };
}
