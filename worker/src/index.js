// Cloudflare Worker — WMS tile proxy for ChartWorld
// Credentials are stored as Cloudflare secrets, never exposed to the client.

export default {
  async fetch(request, env, ctx) {
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

    // Check cache first (keyed on upstream URL, no auth in key)
    const cache = caches.default;
    const cacheKey = new Request(wmsUrl.toString(), { method: 'GET' });
    let response = await cache.match(cacheKey);

    if (response) {
      const headers = new Headers(response.headers);
      addCorsHeaders(headers);
      return new Response(response.body, { status: response.status, headers });
    }

    // Build Basic Auth header from secrets
    const credentials = btoa(`${env.CHARTWORLD_USERNAME}:${env.CHARTWORLD_PASSWORD}`);

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

    // Stream response back with CORS headers
    const headers = new Headers(response.headers);
    addCorsHeaders(headers);
    // Strip upstream auth headers so WebView doesn't show a credentials dialog
    headers.delete('WWW-Authenticate');

    // Cache tile images for 24 hours at the edge
    const contentType = response.headers.get('content-type') || '';
    if (contentType.startsWith('image/')) {
      headers.set('Cache-Control', 'public, max-age=86400');
      const cacheable = new Response(response.clone().body, {
        status: response.status,
        headers,
      });
      // Use ctx.waitUntil so the cache write completes even after response is sent
      ctx.waitUntil(cache.put(cacheKey, cacheable));
    }

    return new Response(response.body, { status: response.status, headers });
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
}

function addCorsHeaders(headers) {
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', '*');
}
