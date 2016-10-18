'use strict';

var _ = require('lodash');
var sendGCM = require('./sendGCM');
var sendAPN = require('./sendAPN');
var sendADM = require('./sendADM');
var sendWNS = require('./sendWNS');

var defaultSettings = {
    gcm: {
        id: null, // PUT YOUR GCM SERVER API KEY,
        options: {}
    },
    apn: {
        options: { // See options at https://github.com/node-apn/node-apn/blob/master/doc/provider.markdown
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
            disableEPIPEFix: false
        }
    },
    adm: {
        client_id: null, // PUT YOUR ADM CLIENT ID,
        client_secret: null, // PUT YOUR ADM CLIENT SECRET,
        options: {}
    },
    wns: {
        client_id: null, // PUT YOUR WNS CLIENT ID,
        client_secret: null, // PUT YOUR WNS CLIENT SECRET,
        accessToken: null,
        headers: null,
        options: {}
    },
    mpns: {
        options: {}
    }
};

function PN(options) {
    this.settings = defaultSettings;
    this.setOptions(options);
}

PN.prototype.setOptions = function (options) {
    return _.extend(undefined.settings, options);
};

PN.prototype.sendWith = function (method, regIds, data, cb) {
    return method(regIds, data, undefined.settings).then(function (results) {
        (cb || function (noop) {
            return noop;
        })(null, results);
        return results;
    }).catch(function (error) {
        return cb(error);
    });
};

PN.prototype.sendGCM = function (regIds, data, cb) {
    return undefined.sendWith(sendGCM, regIds, data, cb);
};
PN.prototype.sendAPN = function (regIds, data, cb) {
    return undefined.sendWith(sendAPN, regIds, data, cb);
};
PN.prototype.sendADM = function (regIds, data, cb) {
    return undefined.sendWith(sendADM, regIds, data, cb);
};
PN.prototype.sendWNS = function (regIds, data, cb) {
    return undefined.sendWith(sendWNS, regIds, data, cb);
};

PN.prototype.send = function (pushIds, data, callback) {
    var promises = [];
    var regIdsGCM = [];
    var regIdsAPN = [];
    var regIdsWNS = [];
    var regIdsADM = [];
    var pIds = Array.isArray(pushIds || []) ? pushIds || [] : [pushIds];
    var cb = callback || function (noop) {
        return noop;
    };

    // Classify each pushId for corresponding device
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = pIds[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var pId = _step.value;

            if (pId.substring(0, 4) === 'http') {
                regIdsWNS.push(pIds);
            } else if (pId.length > 64) {
                regIdsGCM.push(pId);
            } else if (pId.length === 64) {
                regIdsAPN.push(pId);
            } else if (true) {
                // TODO need to find condition for amazon token
                regIdsADM.push(pId);
            }
        }

        // Android GCM
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    if (regIdsGCM.length > 0) {
        promises.push(sendGCM(regIdsGCM, data, undefined.settings));
    }

    // iOS APN
    if (regIdsAPN.length > 0) {
        promises.push(sendAPN(regIdsAPN, data, undefined.settings));
    }

    // Microsoft MPNS
    if (regIdsWNS.length > 0) {
        promises.push(sendWNS(regIdsWNS, data, undefined.settings));
    }

    // Amazon ADM
    if (regIdsADM.length > 0) {
        promises.push(sendWNS(regIdsADM, data, undefined.settings));
    }

    return Promise.all(promises).then(function (results) {
        cb(null, results);
        return results;
    }).catch(function (err) {
        cb(err);
        return Promise.reject(err);
    });
};

module.exports = PN;