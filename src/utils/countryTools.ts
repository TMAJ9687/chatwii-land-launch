
/**
 * Utility functions for working with country codes and flags
 */

// Map of common country names to ISO country codes
const COUNTRY_TO_CODE: Record<string, string> = {
  'united states': 'US',
  'usa': 'US',
  'united kingdom': 'GB',
  'uk': 'GB',
  'canada': 'CA',
  'australia': 'AU',
  'france': 'FR',
  'germany': 'DE',
  'italy': 'IT',
  'spain': 'ES',
  'japan': 'JP',
  'china': 'CN',
  'brazil': 'BR',
  'india': 'IN',
  'russia': 'RU',
  'mexico': 'MX',
  'argentina': 'AR',
  'poland': 'PL',
  'ukraine': 'UA',
  'sweden': 'SE',
  'norway': 'NO',
  'denmark': 'DK',
  'finland': 'FI',
  'iceland': 'IS',
  'ireland': 'IE',
  'netherlands': 'NL',
  'belgium': 'BE',
  'switzerland': 'CH',
  'austria': 'AT',
  'portugal': 'PT',
  'greece': 'GR',
  'turkey': 'TR',
};

/**
 * Convert a country name to ISO country code
 */
export const getCountryCode = (country?: string): string => {
  if (!country) return '';
  
  // If already a 2-letter code
  if (country.length === 2 && /^[A-Z]{2}$/.test(country.toUpperCase())) {
    return country.toUpperCase();
  }
  
  // Look up in map
  const normalizedCountry = country.toLowerCase().trim();
  return COUNTRY_TO_CODE[normalizedCountry] || '';
};

/**
 * Convert a country code to flag emoji
 */
export const getFlagEmoji = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) {
    return '🏳️';
  }
  
  // Convert to regional indicator symbols
  try {
    const codePoints = [...countryCode.toUpperCase()]
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch (error) {
    console.error('Error converting country code to flag:', error);
    return '🏳️';
  }
};

/**
 * Generate a URL for a country flag image
 */
export const getFlagUrl = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) {
    return '';
  }
  
  // Using a free flag API service
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
};

/**
 * Detect user's country based on IP address
 * @returns Promise with country name and code
 */
export const detectUserCountry = async (): Promise<{ country: string; countryCode: string }> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) {
      throw new Error(`Failed to fetch user location: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`IP API error: ${data.reason}`);
    }
    
    return {
      country: data.country_name || "Unknown",
      countryCode: data.country_code || ""
    };
  } catch (error) {
    console.error("Error detecting country:", error);
    return {
      country: "Unknown",
      countryCode: ""
    };
  }
};
