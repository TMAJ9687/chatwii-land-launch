
import React from "react";
import { useDetectCountry } from "@/hooks/useDetectCountry";
import { getFlagUrl, getCountryCode } from "@/utils/countryTools";

interface CountryDisplayProps {
  country?: string;
  countryCode?: string;
}

export const CountryDisplay: React.FC<CountryDisplayProps> = ({ country: propCountry, countryCode: propCountryCode }) => {
  const detectedCountry = useDetectCountry();
  
  // Use provided country/code or fallback to detected ones
  const country = propCountry || detectedCountry.country;
  // Use provided code, derive from country name, or fallback to detected code
  const countryCode = propCountryCode || (country && getCountryCode(country)) || detectedCountry.countryCode;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Country
      </label>
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 rounded-md min-h-[36px]">
        {countryCode && (
          <img
            src={getFlagUrl(countryCode)}
            alt={`${country} flag`}
            className="w-5 h-4 rounded mr-2"
            style={{ background: "#E5E7EB", objectFit: "cover" }}
            onError={(e) => {
              // Hide the image element if it fails to load
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <span>{country}</span>
      </div>
    </div>
  );
};
