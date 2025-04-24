
import React from "react";
import { useDetectCountry } from "@/hooks/useDetectCountry";
import { getFlagUrl, getCountryCode } from "@/utils/countryTools";
import { Loader2 } from "lucide-react";

interface CountryDisplayProps {
  country?: string;
  countryCode?: string;
}

export const CountryDisplay: React.FC<CountryDisplayProps> = ({ country: propCountry, countryCode: propCountryCode }) => {
  const { country: detectedCountry, countryCode: detectedCountryCode, isLoading, error } = useDetectCountry();
  
  // Use provided country/code or fallback to detected ones
  const country = propCountry || detectedCountry;
  // Use provided code, derive from country name, or fallback to detected code
  const countryCode = propCountryCode || (country && getCountryCode(country)) || detectedCountryCode;
  
  // Construct the flag URL
  const flagUrl = countryCode ? getFlagUrl(countryCode) : '';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Country
      </label>
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 rounded-md min-h-[36px]">
        {isLoading ? (
          <div className="flex items-center">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span>Detecting location...</span>
          </div>
        ) : countryCode ? (
          <>
            <img
              src={flagUrl}
              alt={`${country} flag`}
              className="w-5 h-4 rounded mr-2"
              style={{ background: "#E5E7EB", objectFit: "cover" }}
              onError={(e) => {
                console.warn(`Failed to load flag for: ${country} (${countryCode})`);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span>{country}</span>
          </>
        ) : error ? (
          <span className="text-red-500">Could not detect location</span>
        ) : (
          <span>{country}</span>
        )}
      </div>
    </div>
  );
};
