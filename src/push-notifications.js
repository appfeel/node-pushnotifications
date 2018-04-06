import sendGCM from './sendGCM';
import sendAPN from './sendAPN';
import sendADM from './sendADM';
import sendWNS from './sendWNS';

const defaultSettings = {
    gcm: {
        id: null, // PUT YOUR GCM SERVER API KEY,
    },
    apn: { // See options at https://github.com/node-apn/node-apn/blob/master/doc/provider.markdown
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
        production: (process.env.NODE_ENV === 'production'),
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
    mpns: {
        options: {},
    },
};

function PN(options) {
    this.settings = Object.assign({}, defaultSettings, options || {});
}

PN.prototype.setOptions = function setOptions(opts) {
    this.settings = Object.assign({}, this.settings, opts);
};

PN.prototype.sendWith = function sendWith(method, regIds, data, cb) {
    return method(regIds, data, this.settings)
        .then((results) => {
            (cb || (noop => noop))(null, results);
            return results;
        })
        .catch((error) => {
            (cb || (noop => noop))(error);
            return Promise.reject(error);
        });
};

PN.prototype.send = function send(_regIds, data, callback) {
    const promises = [];
    const regIdsGCM = [];
    const regIdsAPN = [];
    const regIdsWNS = [];
    const regIdsADM = [];
    const regIdsUnk = [];
    const regIds = Array.isArray(_regIds || []) ? _regIds || [] : [_regIds];

    // Classify each pushId for corresponding device
    for (const regId of regIds) {
        if (regId.substring(0, 4) === 'http') {
            regIdsWNS.push(regId);
        } else if (/^(amzn[0-9]*.adm)/i.test(regId)) {
            regIdsADM.push(regId);
        } else if (regId.length > 64) {
            regIdsGCM.push(regId);
        } else if (regId.length === 64) {
            regIdsAPN.push(regId);
        } else {
            regIdsUnk.push(regId);
        }
    }

    try {
        // Android GCM
        if (regIdsGCM.length > 0) {
            promises.push(this.sendWith(sendGCM, regIdsGCM, data));
        }

        // iOS APN
        if (regIdsAPN.length > 0) {
            promises.push(this.sendWith(sendAPN, regIdsAPN, data));
        }

        // Microsoft WNS
        if (regIdsWNS.length > 0) {
            promises.push(this.sendWith(sendWNS, regIdsWNS, data));
        }

        // Amazon ADM
        if (regIdsADM.length > 0) {
            promises.push(this.sendWith(sendADM, regIdsADM, data));
        }
    } catch (err) {
        promises.push(Promise.reject(err));
    }

    // Unknown
    if (regIdsUnk.length > 0) {
        const results = {
            method: 'unknown',
            success: 0,
            failure: regIdsUnk.length,
            message: [],
        };
        regIdsUnk.forEach((regId) => {
            results.message.push({
                regId,
                error: new Error('Unknown registration id'),
            });
        });
        promises.push(Promise.resolve(results));
    }

    // No regIds detected
    if (promises.length === 0) {
        promises.push(Promise.resolve({
            method: 'none',
            success: 0,
            failure: 0,
            message: [],
        }));
    }

    return Promise.all(promises)
        .then((results) => {
            const cb = callback || (noop => noop);
            cb(null, results);
            return results;
        })
        .catch((err) => {
            const cb = callback || (noop => noop);
            cb(err);
            return Promise.reject(err);
        });
};

module.exports = PN;
