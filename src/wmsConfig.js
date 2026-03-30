// WMS configuration — points to Cloudflare Worker proxy.
// No credentials here; they live in Cloudflare secrets.

const WMS_CONFIG = {
  // Cloudflare Worker proxy URL — update after deploying
  baseUrl: 'https://wheretofish-wms-proxy.YOUR_SUBDOMAIN.workers.dev/wms',

  // No auth needed from the client — the proxy handles it
  auth: { method: 'none' },

  version: '1.1.1',
  format: 'image/png',
  srs: 'EPSG:3857',
};

export default WMS_CONFIG;
