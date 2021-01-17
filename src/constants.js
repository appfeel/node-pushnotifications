module.exports = {
  DEFAULT_TTL: 28 * 86400,
  APN_METHOD: 'apn',
  GCM_METHOD: 'gcm',
  ADM_METHOD: 'adm',
  WNS_METHOD: 'wns',
  WEB_METHOD: 'webPush',
  UNKNOWN_METHOD: 'unknown',
  DEFAULT_SETTINGS: {
    gcm: {
      id: null, // PUT YOUR GCM SERVER API KEY,
    },
    apn: {
      // See options at https://github.com/node-apn/node-apn/blob/master/doc/provider.markdown
      token: null,
      // {
      //     key: '',
      //     keyId: '',
      //     teamId: '',
      // },
      cert: 'cert.pem',
      key: 'key.pem',
      ca: null,
      pfx: null,
      passphrase: null,
      production: process.env.NODE_ENV === 'production',
      voip: false,
      address: null,
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
      client_id: null, // PUT YOUR ADM CLIENT ID,
      client_secret: null, // PUT YOUR ADM CLIENT SECRET,
    },
    wns: {
      client_id: null, // PUT YOUR WNS CLIENT ID,
      client_secret: null, // PUT YOUR WNS CLIENT SECRET,
      accessToken: null,
      headers: null,
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
  },
};
