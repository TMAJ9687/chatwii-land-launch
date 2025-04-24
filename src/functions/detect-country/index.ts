
// Using Deno Deploy's native Request/Response types instead of importing server
// This removes the dependency on the external module that's causing errors

// Function to handle country detection using Cloudflare headers
Deno.serve(async (req) => {
  const headers = req.headers;
  
  // Get country from Cloudflare headers
  let countryCode = headers.get('cf-ipcountry') || '';
  let country = '';
  
  // Map common country codes to names
  const countryMap: Record<string, string> = {
    'US': 'United States',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'JP': 'Japan',
    'CN': 'China',
    // Add more as needed
  };
  
  country = countryMap[countryCode] || 'Unknown';
  
  // Fallback for when Cloudflare headers aren't available
  if (!countryCode || countryCode === '') {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      country = data.country_name;
      countryCode = data.country_code;
    } catch (error) {
      console.error('Error in IP API fallback:', error);
    }
  }
  
  // Return the country information
  return new Response(
    JSON.stringify({
      country: country,
      countryCode: countryCode.toLowerCase()
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400" // Cache for 24 hours
      }
    }
  );
});
