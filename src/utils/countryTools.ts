
// Country name to ISO code mapping
const COUNTRY_TO_ISO: Record<string, string> = {
  'Afghanistan': 'af',
  'Albania': 'al',
  'Algeria': 'dz',
  'Andorra': 'ad',
  'Angola': 'ao',
  'Antigua and Barbuda': 'ag',
  'Argentina': 'ar',
  'Armenia': 'am',
  'Australia': 'au',
  'Austria': 'at',
  'Azerbaijan': 'az',
  'Bahamas': 'bs',
  'Bahrain': 'bh',
  'Bangladesh': 'bd',
  'Barbados': 'bb',
  'Belarus': 'by',
  'Belgium': 'be',
  'Belize': 'bz',
  'Benin': 'bj',
  'Bhutan': 'bt',
  'Bolivia': 'bo',
  'Bosnia and Herzegovina': 'ba',
  'Botswana': 'bw',
  'Brazil': 'br',
  'Brunei': 'bn',
  'Bulgaria': 'bg',
  'Burkina Faso': 'bf',
  'Burundi': 'bi',
  'Cabo Verde': 'cv',
  'Cambodia': 'kh',
  'Cameroon': 'cm',
  'Canada': 'ca',
  'Central African Republic': 'cf',
  'Chad': 'td',
  'Chile': 'cl',
  'China': 'cn',
  'Colombia': 'co',
  'Comoros': 'km',
  'Congo': 'cg',
  'Costa Rica': 'cr',
  'Croatia': 'hr',
  'Cuba': 'cu',
  'Cyprus': 'cy',
  'Czech Republic': 'cz',
  'Democratic Republic of the Congo': 'cd',
  'Denmark': 'dk',
  'Djibouti': 'dj',
  'Dominica': 'dm',
  'Dominican Republic': 'do',
  'Ecuador': 'ec',
  'Egypt': 'eg',
  'El Salvador': 'sv',
  'Equatorial Guinea': 'gq',
  'Eritrea': 'er',
  'Estonia': 'ee',
  'Eswatini': 'sz',
  'Ethiopia': 'et',
  'Fiji': 'fj',
  'Finland': 'fi',
  'France': 'fr',
  'Gabon': 'ga',
  'Gambia': 'gm',
  'Georgia': 'ge',
  'Germany': 'de',
  'Ghana': 'gh',
  'Greece': 'gr',
  'Grenada': 'gd',
  'Guatemala': 'gt',
  'Guinea': 'gn',
  'Guinea-Bissau': 'gw',
  'Guyana': 'gy',
  'Haiti': 'ht',
  'Honduras': 'hn',
  'Hungary': 'hu',
  'Iceland': 'is',
  'India': 'in',
  'Indonesia': 'id',
  'Iran': 'ir',
  'Iraq': 'iq',
  'Ireland': 'ie',
  'Italy': 'it',
  'Jamaica': 'jm',
  'Japan': 'jp',
  'Jordan': 'jo',
  'Kazakhstan': 'kz',
  'Kenya': 'ke',
  'Kiribati': 'ki',
  'Korea, North': 'kp',
  'Korea, South': 'kr',
  'Kosovo': 'xk',
  'Kuwait': 'kw',
  'Kyrgyzstan': 'kg',
  'Laos': 'la',
  'Latvia': 'lv',
  'Lebanon': 'lb',
  'Lesotho': 'ls',
  'Liberia': 'lr',
  'Libya': 'ly',
  'Liechtenstein': 'li',
  'Lithuania': 'lt',
  'Luxembourg': 'lu',
  'Madagascar': 'mg',
  'Malawi': 'mw',
  'Malaysia': 'my',
  'Maldives': 'mv',
  'Mali': 'ml',
  'Malta': 'mt',
  'Marshall Islands': 'mh',
  'Mauritania': 'mr',
  'Mauritius': 'mu',
  'Mexico': 'mx',
  'Micronesia': 'fm',
  'Moldova': 'md',
  'Monaco': 'mc',
  'Mongolia': 'mn',
  'Montenegro': 'me',
  'Morocco': 'ma',
  'Mozambique': 'mz',
  'Myanmar': 'mm',
  'Namibia': 'na',
  'Nauru': 'nr',
  'Nepal': 'np',
  'Netherlands': 'nl',
  'New Zealand': 'nz',
  'Nicaragua': 'ni',
  'Niger': 'ne',
  'Nigeria': 'ng',
  'North Macedonia': 'mk',
  'Norway': 'no',
  'Oman': 'om',
  'Pakistan': 'pk',
  'Palau': 'pw',
  'Palestine': 'ps',
  'Panama': 'pa',
  'Papua New Guinea': 'pg',
  'Paraguay': 'py',
  'Peru': 'pe',
  'Philippines': 'ph',
  'Poland': 'pl',
  'Portugal': 'pt',
  'Qatar': 'qa',
  'Romania': 'ro',
  'Russia': 'ru',
  'Rwanda': 'rw',
  'Saint Kitts and Nevis': 'kn',
  'Saint Lucia': 'lc',
  'Saint Vincent and the Grenadines': 'vc',
  'Samoa': 'ws',
  'San Marino': 'sm',
  'Sao Tome and Principe': 'st',
  'Saudi Arabia': 'sa',
  'Senegal': 'sn',
  'Serbia': 'rs',
  'Seychelles': 'sc',
  'Sierra Leone': 'sl',
  'Singapore': 'sg',
  'Slovakia': 'sk',
  'Slovenia': 'si',
  'Solomon Islands': 'sb',
  'Somalia': 'so',
  'South Africa': 'za',
  'South Sudan': 'ss',
  'Spain': 'es',
  'Sri Lanka': 'lk',
  'Sudan': 'sd',
  'Suriname': 'sr',
  'Sweden': 'se',
  'Switzerland': 'ch',
  'Syria': 'sy',
  'Taiwan': 'tw',
  'Tajikistan': 'tj',
  'Tanzania': 'tz',
  'Thailand': 'th',
  'Timor-Leste': 'tl',
  'Togo': 'tg',
  'Tonga': 'to',
  'Trinidad and Tobago': 'tt',
  'Tunisia': 'tn',
  'Turkey': 'tr',
  'Turkmenistan': 'tm',
  'Tuvalu': 'tv',
  'Uganda': 'ug',
  'Ukraine': 'ua',
  'United Arab Emirates': 'ae',
  'United Kingdom': 'gb',
  'United States': 'us',
  'Uruguay': 'uy',
  'Uzbekistan': 'uz',
  'Vanuatu': 'vu',
  'Vatican City': 'va',
  'Venezuela': 've',
  'Vietnam': 'vn',
  'Yemen': 'ye',
  'Zambia': 'zm',
  'Zimbabwe': 'zw'
};

// Get country ISO code from country name
export const getCountryCode = (countryName?: string): string => {
  if (!countryName) return '';
  
  // If input is already a two-letter code, return it as lowercase
  if (countryName.length === 2) {
    return countryName.toLowerCase();
  }
  
  return COUNTRY_TO_ISO[countryName] || '';
};

// Get flag URL from country code or country name
export const getFlagUrl = (codeOrName: string): string => {
  if (!codeOrName) return '';
  
  // If input is a 2-letter code
  if (codeOrName && codeOrName.length === 2) {
    return `https://flagcdn.com/w20/${codeOrName.toLowerCase()}.png`;
  }
  
  // If it's a country name, convert to code
  const code = getCountryCode(codeOrName);
  if (code) {
    return `https://flagcdn.com/w20/${code.toLowerCase()}.png`;
  }
  
  // Fallback
  return '';
};

// Detect user's country using their IP - with better error handling and caching
export const detectUserCountry = async (): Promise<{ country: string; countryCode: string }> => {
  // Try to get from sessionStorage first for better performance
  const cachedCountry = sessionStorage.getItem('user_country');
  const cachedCountryCode = sessionStorage.getItem('user_country_code');
  
  if (cachedCountry && cachedCountryCode) {
    return { country: cachedCountry, countryCode: cachedCountryCode };
  }
  
  try {
    // Using ipapi.co as a more reliable free service
    const response = await fetch('https://ipapi.co/json/', { 
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`Failed to detect country: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.country_name || !data.country_code) {
      throw new Error('Invalid country data received');
    }
    
    const result = {
      country: data.country_name,
      countryCode: data.country_code.toLowerCase()
    };
    
    // Cache the result in sessionStorage
    sessionStorage.setItem('user_country', result.country);
    sessionStorage.setItem('user_country_code', result.countryCode);
    
    return result;
  } catch (error) {
    console.error('Error detecting country:', error);
    
    // Fallback to another service if the first one fails
    try {
      const fallbackResponse = await fetch('https://geolocation-db.com/json/', {
        signal: AbortSignal.timeout(5000)
      });
      
      if (!fallbackResponse.ok) {
        throw new Error('Fallback service failed');
      }
      
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData.country_name && fallbackData.country_code) {
        const result = {
          country: fallbackData.country_name,
          countryCode: fallbackData.country_code.toLowerCase()
        };
        
        // Cache the result in sessionStorage
        sessionStorage.setItem('user_country', result.country);
        sessionStorage.setItem('user_country_code', result.countryCode);
        
        return result;
      }
      
      throw new Error('Invalid data from fallback service');
    } catch (fallbackError) {
      console.error('Fallback country detection failed:', fallbackError);
      return { country: 'Unknown', countryCode: '' };
    }
  }
};
