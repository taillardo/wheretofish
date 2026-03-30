// Cloudflare Worker — WMS tile proxy for ChartWorld
// Credentials are stored as Cloudflare secrets, never exposed to the client.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // Health check
    if (url.pathname === '/') {
      return new Response('WhereToFish WMS Proxy', { headers: corsHeaders() });
    }

    // Only allow /wms path
    if (url.pathname !== '/wms') {
      return new Response('Not found', { status: 404, headers: corsHeaders() });
    }

    // Forward all query params to ChartWorld WMS
    const wmsUrl = new URL(env.WMS_BASE_URL);
    url.searchParams.forEach((value, key) => {
      wmsUrl.searchParams.set(key, value);
    });

    // Build Basic Auth header from secrets
    const credentials = btoa(`${env.CHARTWORLD_USERNAME}:${env.CHARTWORLD_PASSWORD}`);

    // Check cache first
    const cache = caches.default;
    const cacheKey = new Request(wmsUrl.toString(), { method: 'GET' });
    let response = await cache.match(cacheKey);

    if (response) {
      // Return cached response with CORS headers
      const headers = new Headers(response.headers);
      addCorsHeaders(headers);
      return new Response(response.body, { status: response.status, headers });
    }

    // Fetch from ChartWorld
    response = await fetch(wmsUrl.toString(), {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'image/png, image/jpeg, text/xml, text/html, text/plain',
      },
    });

    if (!response.ok) {
      return new Response(`WMS upstream error: ${response.status}`, {
        status: response.status,
        headers: corsHeaders(),
      });
    }

    // Clone response for caching
    const responseToCache = response.clone();
    const headers = new Headers(response.headers);
    addCorsHeaders(headers);

    // Cache tile images for 24 hours
    const contentType = response.headers.get('content-type') || '';
    if (contentType.startsWith('image/')) {
      headers.set('Cache-Control', 'public, max-age=86400');
      const cacheable = new Response(responseToCache.body, {
        status: responseToCache.status,
        headers: { ...Object.fromEntries(headers), 'Cache-Control': 'public, max-age=86400' },
      });
      // Don't await — cache in background
      caches.default.put(cacheKey, cacheable);
    }

    return new Response(response.body, { status: response.status, headers });
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function addCorsHeaders(headers) {
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
}
