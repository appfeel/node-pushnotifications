"use strict";

var _sendGCM = _interopRequireDefault(require("./sendGCM"));
var _sendAPN = _interopRequireDefault(require("./sendAPN"));
var _sendADM = _interopRequireDefault(require("./sendADM"));
var _sendWNS = _interopRequireDefault(require("./sendWNS"));
var _sendWeb = _interopRequireDefault(require("./sendWeb"));
var _constants = require("./constants");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /* eslint-disable import/no-import-module-exports */
class PN {
  constructor(options) {
    this.setOptions(options);
  }
  setOptions(opts) {
    this.settings = _objectSpread(_objectSpread({}, _constants.DEFAULT_SETTINGS), opts);
    if (this.apn) {
      this.apn.shutdown();
    }
    this.apn = new _sendAPN.default(this.settings.apn);
  }
  sendWith(method, regIds, data, cb) {
    return method(regIds, data, this.settings).then(results => {
      (cb || (noop => noop))(null, results);
      return results;
    }).catch(error => {
      (cb || (noop => noop))(error);
      return Promise.reject(error);
    });
  }
  getPushMethodByRegId(regId) {
    if (typeof regId === 'object' && (!regId.type || !regId.id)) {
      return {
        regId,
        pushMethod: _constants.WEB_METHOD
      };
    }
    if (typeof regId === 'object' && regId.id && regId.type) {
      return {
        regId: regId.id,
        pushMethod: this.settings.isAlwaysUseFCM ? _constants.GCM_METHOD : regId.type
      };
    }

    // TODO: deprecated, remove of all cases below in v3.0
    // and review test cases
    if (this.settings.isAlwaysUseFCM) {
      return {
        regId,
        pushMethod: _constants.GCM_METHOD
      };
    }
    if (regId.substring(0, 4) === 'http') {
      return {
        regId,
        pushMethod: _constants.WNS_METHOD
      };
    }
    if (/^(amzn[0-9]*.adm)/i.test(regId)) {
      return {
        regId,
        pushMethod: _constants.ADM_METHOD
      };
    }
    if ((regId.length === 64 || regId.length === 160) && /^[a-fA-F0-9]+$/.test(regId)) {
      return {
        regId,
        pushMethod: _constants.APN_METHOD
      };
    }
    if (regId.length > 64) {
      return {
        regId,
        pushMethod: _constants.GCM_METHOD
      };
    }
    return {
      regId,
      pushMethod: _constants.UNKNOWN_METHOD
    };
  }
  send(_regIds, data, callback) {
    const promises = [];
    const regIdsGCM = [];
    const regIdsAPN = [];
    const regIdsWNS = [];
    const regIdsADM = [];
    const regIdsWebPush = [];
    const regIdsUnk = [];
    const regIds = Array.isArray(_regIds || []) ? _regIds || [] : [_regIds];

    // Classify each pushId for corresponding device
    regIds.forEach(regIdOriginal => {
      const _this$getPushMethodBy = this.getPushMethodByRegId(regIdOriginal),
        regId = _this$getPushMethodBy.regId,
        pushMethod = _this$getPushMethodBy.pushMethod;
      if (pushMethod === _constants.WEB_METHOD) {
        regIdsWebPush.push(regId);
      } else if (pushMethod === _constants.GCM_METHOD) {
        regIdsGCM.push(regId);
      } else if (pushMethod === _constants.WNS_METHOD) {
        regIdsWNS.push(regId);
      } else if (pushMethod === _constants.ADM_METHOD) {
        regIdsADM.push(regId);
      } else if (pushMethod === _constants.APN_METHOD) {
        regIdsAPN.push(regId);
      } else {
        regIdsUnk.push(regId);
      }
    });
    try {
      // Android GCM
      if (regIdsGCM.length > 0) {
        promises.push(this.sendWith(_sendGCM.default, regIdsGCM, data));
      }

      // iOS APN
      if (regIdsAPN.length > 0) {
        promises.push(this.sendWith(this.apn.sendAPN.bind(this.apn), regIdsAPN, data));
      }

      // Microsoft WNS
      if (regIdsWNS.length > 0) {
        promises.push(this.sendWith(_sendWNS.default, regIdsWNS, data));
      }

      // Amazon ADM
      if (regIdsADM.length > 0) {
        promises.push(this.sendWith(_sendADM.default, regIdsADM, data));
      }

      // Web Push
      if (regIdsWebPush.length > 0) {
        promises.push(this.sendWith(_sendWeb.default, regIdsWebPush, data));
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
        message: []
      };
      regIdsUnk.forEach(regId => {
        results.message.push({
          regId,
          error: new Error('Unknown registration id')
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
        message: []
      }));
    }
    return Promise.all(promises).then(results => {
      const cb = callback || (noop => noop);
      cb(null, results);
      return results;
    }).catch(err => {
      const cb = callback || (noop => noop);
      cb(err);
      return Promise.reject(err);
    });
  }
}
module.exports = PN;
module.exports.WEB = _constants.WEB_METHOD;
module.exports.WNS = _constants.WNS_METHOD;
module.exports.ADM = _constants.ADM_METHOD;
module.exports.GCM = _constants.GCM_METHOD;
module.exports.APN = _constants.APN_METHOD;