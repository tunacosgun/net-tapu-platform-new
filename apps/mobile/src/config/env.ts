// Toggle DEV_USE_DEMO to test against the remote demo server from Simulator
const DEV_USE_DEMO = true;

const PROD_URL = 'https://nettapu-2.tunasoft.tech';
const LOCAL_API = 'http://localhost:8080';
const LOCAL_WS = 'http://localhost:3001';

export const Config = {
  API_BASE_URL: __DEV__ ? (DEV_USE_DEMO ? PROD_URL : LOCAL_API) : PROD_URL,
  WS_URL: __DEV__ ? (DEV_USE_DEMO ? PROD_URL : LOCAL_WS) : PROD_URL,
  /** Public site URL used for share links (must point to a browser-reachable URL). */
  SITE_URL: PROD_URL,
  API_PREFIX: '/api/v1',
};
