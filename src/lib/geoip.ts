export function getClientIp(request: Request | { headers: Headers }): string | null {
  const headers = request instanceof Request ? request.headers : request.headers;
  
  // Check x-forwarded-for header (most common in proxies/load balancers)
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, get the first one
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    return ips[0] || null;
  }

  // Check x-real-ip header (common in nginx)
  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  // Check cf-connecting-ip (Cloudflare)
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp.trim();
  }

  return null;
}

export async function getLocationFromIp(
  ip: string
): Promise<{
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  source?: string;
} | null> {
  try {
    // Try ipapi.co first (free tier: 1000 requests/day)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`, {
        headers: {
          "User-Agent": "Contratei/1.0",
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

    if (!response.ok) {
      // Fallback to ip-api.com if ipapi.co fails
      return await getLocationFromIpApi(ip);
    }

    const data = await response.json();

    if (data.error) {
      // Fallback to ip-api.com if ipapi.co returns error
      return await getLocationFromIpApi(ip);
    }

    return {
      city: data.city || undefined,
      region: data.region || undefined,
      country: data.country_name || undefined,
      countryCode: data.country_code || undefined,
      latitude: data.latitude || undefined,
      longitude: data.longitude || undefined,
      source: "ipapi.co",
    };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      // Fallback to ip-api.com if ipapi.co fails
      return await getLocationFromIpApi(ip);
    }
  } catch (error) {
    console.error("Error getting location from ipapi.co:", error);
    // Fallback to ip-api.com
    return await getLocationFromIpApi(ip);
  }
}

async function getLocationFromIpApi(
  ip: string
): Promise<{
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  source?: string;
} | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon`, {
        headers: {
          "User-Agent": "Contratei/1.0",
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status !== "success") {
      return null;
    }

    return {
      city: data.city || undefined,
      region: data.regionName || undefined,
      country: data.country || undefined,
      countryCode: data.countryCode || undefined,
      latitude: data.lat || undefined,
      longitude: data.lon || undefined,
      source: "ip-api.com",
    };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      return null;
    }
  } catch (error) {
    console.error("Error getting location from ip-api.com:", error);
    return null;
  }
}

