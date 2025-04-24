
import { useEffect, useState } from "react";
import { detectUserCountry } from "@/utils/countryTools";

export function useDetectCountry() {
  const [country, setCountry] = useState<string>(() => {
    return sessionStorage.getItem('user_country') || "Detecting...";
  });
  
  const [countryCode, setCountryCode] = useState<string>(() => {
    return sessionStorage.getItem('user_country_code') || "";
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(
    !sessionStorage.getItem('user_country')
  );
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 2;
    
    const getCountry = async () => {
      if (country !== "Detecting..." && country !== "Unknown") {
        return; // Already have country data
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const { country, countryCode } = await detectUserCountry();
        
        if (isMounted) {
          if (country === "Unknown" && retryCount < maxRetries) {
            // Retry after a delay if detection failed
            retryCount++;
            setTimeout(getCountry, 2000);
            return;
          }
          
          setCountry(country);
          setCountryCode(countryCode);
          
          // Store in sessionStorage for future use
          sessionStorage.setItem('user_country', country);
          sessionStorage.setItem('user_country_code', countryCode);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Country detection error:", error);
          setError("Failed to detect country");
          setCountry("Unknown");
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
    };
  }, [country]);

  return { country, countryCode, isLoading, error };
}
