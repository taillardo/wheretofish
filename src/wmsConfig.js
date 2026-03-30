import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

const WMS_CONFIG = {
  baseUrl: 'https://wms-syroco.chartworld.com/',

  auth: {
    method: 'basic',
    username: extra.chartworldUsername || '',
    password: extra.chartworldPassword || '',
  },

  version: '1.1.1',
  format: 'image/png',
  srs: 'EPSG:3857',
};

export default WMS_CONFIG;
