
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook for fetching profanity lists from supabase
 */
export function useProfanityList(type: 'nickname' | 'chat' = 'nickname') {
  const [profanityList, setProfanityList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfanity = async () => {
      try {
        setIsLoading(true);
        const { data } = await supabase
          .from("site_settings")
          .select("settings")
          .eq("id", 1)
          .maybeSingle();
          
        let arr: string[] = [];
        if (data?.settings && typeof data.settings === "object" && !Array.isArray(data.settings)) {
          const key = type === 'nickname' ? 'profanity_nickname' : 'profanity_chat';
          arr = Array.isArray(data.settings[key])
            ? data.settings[key].map(String)
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
    
    fetchProfanity();
  }, [type]);

  return { profanityList, isLoading, error };
}
