
import { COUNTRIES } from "@/constants/countries";

// Alpha-2 country code to flag url
export function getFlagUrl(code: string) {
  if (!code || typeof code !== "string") return "";
  // Flagpedia expects lowercase
  return `https://flagcdn.com/24x18/${code.toLowerCase()}.png`;
}

// Map of country code to country name for common countries supported by https://country.is
const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  AF: "Afghanistan", AL: "Albania", DZ: "Algeria", AD: "Andorra", AO: "Angola",
  AR: "Argentina", AM: "Armenia", AU: "Australia", AT: "Austria", AZ: "Azerbaijan",
  BS: "Bahamas", BH: "Bahrain", BD: "Bangladesh", BB: "Barbados", BY: "Belarus", BE: "Belgium",
  BZ: "Belize", BJ: "Benin", BT: "Bhutan", BO: "Bolivia", BA: "Bosnia", BW: "Botswana", BR: "Brazil", BN: "Brunei", BG: "Bulgaria",
  BF: "Burkina Faso", BI: "Burundi", KH: "Cambodia", CM: "Cameroon", CA: "Canada", TD: "Chad", CL: "Chile", CN: "China", CO: "Colombia",
  CG: "Congo", CR: "Costa Rica", HR: "Croatia", CU: "Cuba", CY: "Cyprus", CZ: "Czech Republic", DK: "Denmark", DJ: "Djibouti",
  DO: "Dominican Republic", EC: "Ecuador", EG: "Egypt", SV: "El Salvador", EE: "Estonia", ET: "Ethiopia", FJ: "Fiji", FI: "Finland",
  FR: "France", GA: "Gabon", GM: "Gambia", GE: "Georgia", DE: "Germany", GH: "Ghana", GR: "Greece", GD: "Grenada", GT: "Guatemala",
  GN: "Guinea", GY: "Guyana", HT: "Haiti", HN: "Honduras", HU: "Hungary", IS: "Iceland", IN: "India", ID: "Indonesia", IR: "Iran", IQ: "Iraq",
  IE: "Ireland", IT: "Italy", JM: "Jamaica", JP: "Japan", JO: "Jordan", KZ: "Kazakhstan", KE: "Kenya", KW: "Kuwait", KG: "Kyrgyzstan",
  LA: "Laos", LV: "Latvia", LB: "Lebanon", LS: "Lesotho", LR: "Liberia", LY: "Libya", LI: "Liechtenstein", LT: "Lithuania",
  LU: "Luxembourg", MG: "Madagascar", MW: "Malawi", MY: "Malaysia", MV: "Maldives", ML: "Mali", MT: "Malta", MR: "Mauritania",
  MU: "Mauritius", MX: "Mexico", MD: "Moldova", MC: "Monaco", MN: "Mongolia", ME: "Montenegro", MA: "Morocco", MZ: "Mozambique",
  MM: "Myanmar", NA: "Namibia", NP: "Nepal", NL: "Netherlands", NZ: "New Zealand", NI: "Nicaragua", NE: "Niger", NG: "Nigeria",
  KP: "North Korea", MK: "North Macedonia", NO: "Norway", OM: "Oman", PK: "Pakistan", PS: "Palestine", PA: "Panama",
  PG: "Papua New Guinea", PY: "Paraguay", PE: "Peru", PH: "Philippines", PL: "Poland", PT: "Portugal", QA: "Qatar", RO: "Romania",
  RU: "Russia", RW: "Rwanda", WS: "Samoa", SM: "San Marino", SA: "Saudi Arabia", SN: "Senegal", RS: "Serbia", SC: "Seychelles",
  SL: "Sierra Leone", SG: "Singapore", SK: "Slovakia", SI: "Slovenia", SO: "Somalia", ZA: "South Africa", KR: "South Korea",
  SS: "South Sudan", ES: "Spain", LK: "Sri Lanka", SD: "Sudan", SR: "Suriname", SE: "Sweden", CH: "Switzerland", SY: "Syria",
  TW: "Taiwan", TJ: "Tajikistan", TZ: "Tanzania", TH: "Thailand", TG: "Togo", TO: "Tonga", TT: "Trinidad and Tobago", TN: "Tunisia",
  TR: "Turkey", TM: "Turkmenistan", UG: "Uganda", UA: "Ukraine", AE: "United Arab Emirates", GB: "United Kingdom",
  US: "United States", UY: "Uruguay", UZ: "Uzbekistan", VA: "Vatican City", VE: "Venezuela", VN: "Vietnam", YE: "Yemen",
  ZM: "Zambia", ZW: "Zimbabwe"
};

// Converts a country code (e.g. "US") to the matching country name in COUNTRIES array if found
export function getCountryNameFromCode(code: string) {
  if (!code) return "Unknown";
  const name = COUNTRY_CODE_TO_NAME[code.toUpperCase()];
  if (COUNTRIES.includes(name)) return name;
  // fallback, just return best available
  return name || "Unknown";
}

// New detection function using ipinfo.io instead of country.is
export async function detectUserCountry(): Promise<{ country: string, countryCode: string }> {
  try {
    // Use ipinfo.io instead of country.is which is returning HTML
    const response = await fetch("https://ipinfo.io/json");
    
    // Check if response is ok
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.country) {
      const countryCode = data.country.toUpperCase();
      return {
        country: getCountryNameFromCode(countryCode),
        countryCode: countryCode
      };
    } 
    
    return { country: "Unknown", countryCode: "" };
  } catch (error) {
    console.error("Error detecting country:", error);
    return { country: "Unknown", countryCode: "" };
  }
}
