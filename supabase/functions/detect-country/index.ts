
// Improved country detection with CORS support, better error handling, and expanded country mapping

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// Extended map of country codes to names for better coverage
const countryMap: Record<string, string> = {
  'US': 'United States',
  'GB': 'United Kingdom',
  'CA': 'Canada',
  'AU': 'Australia',
  'DE': 'Germany',
  'FR': 'France',
  'JP': 'Japan',
  'CN': 'China',
  'IN': 'India',
  'BR': 'Brazil',
  'RU': 'Russia',
  'MX': 'Mexico',
  'ES': 'Spain',
  'IT': 'Italy',
  'NL': 'Netherlands',
  'SA': 'Saudi Arabia',
  'CH': 'Switzerland',
  'SE': 'Sweden',
  'NO': 'Norway',
  'SG': 'Singapore',
  'NZ': 'New Zealand',
  'FI': 'Finland',
  'DK': 'Denmark',
  'IE': 'Ireland',
  'BE': 'Belgium',
  'AT': 'Austria',
  'PT': 'Portugal',
  'GR': 'Greece',
  'PL': 'Poland',
  'ZA': 'South Africa',
  'TH': 'Thailand',
  'VN': 'Vietnam',
  'ID': 'Indonesia',
  'MY': 'Malaysia',
  'PH': 'Philippines',
  'KR': 'South Korea',
  'UA': 'Ukraine',
  'TR': 'Turkey',
  'AE': 'United Arab Emirates',
  'AR': 'Argentina',
  'CL': 'Chile',
  'CO': 'Colombia',
  'PE': 'Peru',
  'EG': 'Egypt',
  'NG': 'Nigeria',
  'KE': 'Kenya',
  'IL': 'Israel',
  'HK': 'Hong Kong',
  'TW': 'Taiwan',
};

// Function to handle country detection
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    // Get country from Cloudflare headers
    const headers = req.headers;
    let countryCode = headers.get('cf-ipcountry') || '';
    let country = '';
    
    // If Cloudflare provides country info, use it
    if (countryCode && countryCode !== '') {
      country = countryMap[countryCode] || countryCode;
      
      console.log(`Country detected from Cloudflare: ${country} (${countryCode})`);
      
      // Return the country information with CORS headers
      return new Response(
        JSON.stringify({
          country: country,
          countryCode: countryCode.toLowerCase(),
          source: 'cloudflare'
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=43200" // Cache for 12 hours
          }
        }
      );
    }
    
    // Fallback: use ipapi.co for country detection
    console.log('Cloudflare headers not available, using IP API fallback');
    try {
      const response = await fetch('https://ipapi.co/json/', {
        headers: { 'User-Agent': 'Chatwii-CountryDetection/1.0' }
      });
      
      if (!response.ok) {
        throw new Error(`IP API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      country = data.country_name || 'Unknown';
      countryCode = data.country_code || '';
      
      console.log(`Country detected from IP API: ${country} (${countryCode})`);
      
      return new Response(
        JSON.stringify({
          country: country,
          countryCode: countryCode.toLowerCase(),
          source: 'ipapi'
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=43200" // Cache for 12 hours
          }
        }
      );
    } catch (error) {
      console.error('Error in IP API fallback:', error);
      
      // Second fallback: if both methods fail, return a generic response
      return new Response(
        JSON.stringify({
          country: 'Unknown',
          countryCode: '',
          source: 'fallback',
          error: 'Could not detect country'
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600" // Cache for 1 hour when it's an error response
          },
          status: 200 // Still return 200 to prevent client errors
        }
      );
    }
  } catch (error) {
    console.error('Unexpected error in country detection:', error);
    
    return new Response(
      JSON.stringify({
        country: 'Unknown',
        countryCode: '',
        error: 'Internal server error'
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      }
    );
  }
});
