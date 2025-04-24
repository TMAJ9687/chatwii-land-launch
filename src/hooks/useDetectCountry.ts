
import { useEffect, useState } from "react";
import { detectUserCountry } from "@/utils/countryTools";
import { toast } from "sonner";

export function useDetectCountry() {
  const [country, setCountry] = useState<string>("Detecting...");
  const [countryCode, setCountryCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: number | null = null;
    
    const getCountry = async () => {
      setIsLoading(true);
      
      try {
        // First try local storage cache
        if (typeof window !== 'undefined') {
          const cachedCountry = localStorage.getItem('user_country');
          const cachedCountryCode = localStorage.getItem('user_country_code');
          const cacheTimestamp = localStorage.getItem('country_cache_timestamp');
          
          // Use cached value if it's less than 24 hours old
          if (cachedCountry && cachedCountryCode && cacheTimestamp) {
            const cacheAge = Date.now() - parseInt(cacheTimestamp, 10);
            if (cacheAge < 24 * 60 * 60 * 1000) { // 24 hours
              console.log('Using cached country data:', cachedCountry, cachedCountryCode);
              if (isMounted) {
                setCountry(cachedCountry);
                setCountryCode(cachedCountryCode);
                setError(null);
                setIsLoading(false);
                return;
              }
            }
          }
        }
        
        // If no valid cache, fetch fresh data
        const { country, countryCode } = await detectUserCountry();
        
        if (isMounted) {
          setCountry(country);
          setCountryCode(countryCode);
          setError(null);
          
          // Cache the result in localStorage with timestamp
          if (typeof window !== 'undefined' && country !== 'Unknown') {
            localStorage.setItem('user_country', country);
            localStorage.setItem('user_country_code', countryCode);
            localStorage.setItem('country_cache_timestamp', Date.now().toString());
          }
        }
      } catch (err) {
        console.error("Error detecting country:", err);
        
        if (isMounted) {
          if (retries < 2) {
            // Retry with exponential backoff
            const retryDelay = Math.pow(2, retries) * 1000;
            console.log(`Retrying country detection in ${retryDelay}ms...`);
            
            timeoutId = window.setTimeout(() => {
              setRetries(prev => prev + 1);
              getCountry();
            }, retryDelay);
          } else {
            // After retries, use fallback or cached values if available
            const cachedCountry = localStorage.getItem('user_country');
            const cachedCountryCode = localStorage.getItem('user_country_code');
            
            if (cachedCountry && cachedCountryCode) {
              setCountry(cachedCountry);
              setCountryCode(cachedCountryCode);
              setError("Using cached country data");
            } else {
              setCountry("Unknown");
              setCountryCode("");
              setError("Failed to detect country");
            }
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    getCountry();
    
    return () => { 
      isMounted = false;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [retries]);

  return { 
    country, 
    countryCode, 
    isLoading,
    error
  };
}
