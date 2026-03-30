// ChartWorld WMS ChartServer Configuration
// Copy this file to wmsConfig.js and fill in your credentials.
// wmsConfig.js is gitignored — your secrets stay local.

const WMS_CONFIG = {
  baseUrl: 'https://wms-syroco.chartworld.com/',

  // HTTP Basic Auth — fill in your ChartWorld username and password
  auth: { method: 'basic', username: 'YOUR_USERNAME', password: 'YOUR_PASSWORD' },

  version: '1.1.1',
  format: 'image/png',
  srs: 'EPSG:3857',
};

export default WMS_CONFIG;
