import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { trackFirestoreListener } from "@/integrations/firebase/client";

/**
 * Hook for fetching profanity lists from Firebase with real-time updates
 */
export function useProfanityList(type: 'nickname' | 'chat' = 'nickname') {
  const [profanityList, setProfanityList] = useState<string[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);

  useEffect(() => {
    const siteSettingsRef = doc(db, "site_settings", "1");
    
    // Initial fetch
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
      } catch {
        setError("Failed to fetch profanity list");
        setProfanityList([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfanity();

    // Subscribe to realtime changes
    const unsubscribe = onSnapshot(
      siteSettingsRef,
      (docSnap) => {
        if (!docSnap.exists()) return;
        const settings = docSnap.data().settings || {};
        const key = type === 'nickname' ? 'profanity_nickname' : 'profanity_chat';
        const list = Array.isArray(settings[key]) ? settings[key].map(String) : [];
        setProfanityList(list);
      },
      (err) => {
        console.error("Error listening to profanity list changes:", err);
        setError("Failed to listen to profanity list changes");
      }
    );

    // Register for global cleanup on logout
    trackFirestoreListener(unsubscribe);

    // Local cleanup on unmount or type change
    return () => {
      unsubscribe();
    };
  }, [type]);

  return { profanityList, isLoading, error };
}
