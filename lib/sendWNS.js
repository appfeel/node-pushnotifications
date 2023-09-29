"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const wns = require('wns');

const _require = require('./constants'),
      WNS_METHOD = _require.WNS_METHOD;

const parseErrorMessage = err => err instanceof Error ? err.message : err;

const parseError = err => {
  if (err instanceof Error) {
    return err;
  }

  if (err) {
    return new Error(err);
  }

  return null;
};

let resumed;

function processResponse(err, response, regId) {
  const error = parseError(err) || parseError(response.innerError);
  const errorMsg = parseErrorMessage(err) || parseErrorMessage(response.innerError);
  resumed.success += error ? 0 : 1;
  resumed.failure += error ? 1 : 0;
  resumed.message.push({
    regId,
    error,
    errorMsg
  });
}

const sendWNS = (_regIds, _data, settings) => {
  // sendNotifications and sendPromises are inside exports as in this way,
  // successive calls to this module doesn't override previous ones
  let sendPromises;

  function sendNotifications(regIds, notificationMethod, data, opts, onFinish) {
    const regId = regIds.shift();

    if (regId) {
      try {
        wns[notificationMethod](regId, data, opts, (err, response) => {
          sendPromises.push(Promise.resolve());
          processResponse(err, response, regId);
          sendNotifications(regIds, notificationMethod, data, _objectSpread(_objectSpread({}, opts), {}, {
            accessToken: response.newAccessToken
          }), onFinish);
        });
      } catch (err) {
        sendPromises.push(Promise.reject(err));
        sendNotifications(regIds, notificationMethod, data, opts, onFinish);
      }
    } else {
      Promise.all(sendPromises).then(() => onFinish(), onFinish);
    }
  }

  const promises = [];

  const opts = _objectSpread({}, settings.wns);

  const notificationMethod = opts.notificationMethod;
  const data = notificationMethod === 'sendRaw' ? JSON.stringify(_data) : _objectSpread({}, _data);
  resumed = {
    method: WNS_METHOD,
    success: 0,
    failure: 0,
    message: []
  };
  opts.headers = data.headers || opts.headers;
  opts.launch = data.launch || opts.launch;
  opts.duration = data.duration || opts.duration;
  delete opts.notificationMethod;
  delete data.headers;
  delete data.launch;
  delete data.duration;

  if (opts.accessToken) {
    sendPromises = [];
    const regIds = [..._regIds]; // eslint-disable-next-line max-len

    promises.push(new Promise((resolve, reject) => {
      sendNotifications(regIds, notificationMethod, data, opts, err => err ? reject(err) : resolve());
    }));
  } else {
    // eslint-disable-next-line max-len
    _regIds.forEach(regId => promises.push(new Promise(resolve => {
      wns[notificationMethod](regId, data, opts, (err, response) => {
        processResponse(err, response, regId);
        resolve();
      });
    })));
  }

  return Promise.all(promises).then(() => resumed);
};

module.exports = sendWNS;