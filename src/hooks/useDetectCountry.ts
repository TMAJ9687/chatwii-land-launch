
import { useEffect, useState } from "react";
import { detectUserCountry } from "@/utils/countryTools";

export function useDetectCountry() {
  const [country, setCountry] = useState<string>("Detecting...");
  const [countryCode, setCountryCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const getCountry = async () => {
      setIsLoading(true);
      try {
        const { country, countryCode } = await detectUserCountry();
        
        if (isMounted) {
          setCountry(country);
          setCountryCode(countryCode);
          setError(null);
        }
      } catch (err) {
        console.error("Error detecting country:", err);
        if (isMounted) {
          setCountry("Unknown");
          setCountryCode("");
          setError("Failed to detect country");
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
  }, []);

  return { 
    country, 
    countryCode, 
    isLoading,
    error
  };
}
