
import { useEffect, useState } from "react";
import { detectUserCountry } from "@/utils/countryTools";

export function useDetectCountry() {
  const [country, setCountry] = useState<string>("Detecting...");
  const [countryCode, setCountryCode] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    const getCountry = async () => {
      try {
        const { country, countryCode } = await detectUserCountry();
        if (isMounted) {
          setCountry(country);
          setCountryCode(countryCode);
        }
      } catch (error) {
        if (isMounted) {
          setCountry("Unknown");
          setCountryCode("");
        }
      }
    };
    getCountry();
    return () => { isMounted = false; };
  }, []);

  return { country, countryCode };
}
