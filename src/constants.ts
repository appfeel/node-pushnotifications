import { DefaultSettings } from './types';

export const DEFAULT_TTL = 28 * 86400;
export const GCM_MAX_TTL = 2419200; // 4 weeks in seconds (https://firebase.google.com/docs/cloud-messaging/http-server-ref#downstream-http-messages-json)

export const DEFAULT_SETTINGS: DefaultSettings = {
  gcm: {
    id: undefined, // PUT YOUR GCM SERVER API KEY,
  },
  apn: {
    // See options at https://github.com/node-apn/node-apn/blob/master/doc/provider.markdown
    token: undefined,
    // {
    //     key: '',
    //     keyId: '',
    //     teamId: '',
    // },
    cert: 'cert.pem',
    key: 'key.pem',
    ca: undefined,
    pfx: undefined,
    passphrase: undefined,
    production: process.env.NODE_ENV === 'production',
    // voip: false, // VOIP is in Notification type, not in settings
    address: undefined,
    port: 443,
    rejectUnauthorized: true,
    connectionRetryLimit: 10,

    cacheLength: 1000,
    connectionTimeout: 3600000,
    autoAdjustCache: true,
    maxConnections: 1,
    minConnections: 1,
    connectTimeout: 10000,
    buffersNotifications: true,
    fastMode: false,
    disableNagle: false,
    disableEPIPEFix: false,
  },
  adm: {
    client_id: undefined, // PUT YOUR ADM CLIENT ID,
    client_secret: undefined, // PUT YOUR ADM CLIENT SECRET,
  },
  wns: {
    client_id: undefined, // PUT YOUR WNS CLIENT ID,
    client_secret: undefined, // PUT YOUR WNS CLIENT SECRET,
    accessToken: undefined,
    headers: undefined,
    notificationMethod: 'sendTileSquareBlock',
  },
  web: {
    vapidDetails: {
      subject: "< 'mailto' Address or URL >",
      publicKey: '< URL Safe Base64 Encoded Public Key >',
      privateKey: '< URL Safe Base64 Encoded Private Key >',
    },
    // gcmAPIKey: '< GCM API Key >',
    // TTL: 2419200
    // headers: { }
    // contentEncoding: '< Encoding type, e.g.: aesgcm or aes128gcm >'
  },
  isAlwaysUseFCM: false,
};
