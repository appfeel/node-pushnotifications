"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

const webPush = require('web-push');

const _require = require('ramda'),
      is = _require.is,
      unless = _require.unless,
      assoc = _require.assoc;

const _require2 = require('./constants'),
      WEB_METHOD = _require2.WEB_METHOD;

const stringify = unless(is(String), JSON.stringify);

const sendWebPush = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(function* (regIds, data, settings) {
    const payload = stringify(data);
    const promises = regIds.map(regId => webPush.sendNotification(regId, payload, settings.web).then(() => ({
      success: 1,
      failure: 0,
      message: [{
        regId,
        error: null
      }]
    })).catch(err => ({
      success: 0,
      failure: 1,
      message: [{
        regId,
        error: err,
        errorMsg: err.message
      }]
    })));
    const results = yield Promise.all(promises);
    const reduced = results.reduce((acc, current) => ({
      success: acc.success + current.success,
      failure: acc.failure + current.failure,
      message: [...acc.message, ...current.message]
    }));
    return assoc('method', WEB_METHOD, reduced);
  });

  return function sendWebPush(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = sendWebPush;