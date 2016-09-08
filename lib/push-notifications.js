var gcm = require('node-gcm');
var apn = require('apn');
var mpns = require('mpns');
var adm = require('node-adm');
var Parallel = require('node-parallel');
var _ = require('lodash');

var settings = {
  gcm: {
    id: null, // PUT YOUR GCM SERVER API KEY,
    options: {},
    msgcnt: 1,
    dataDefaults: {
      delayWhileIdle: false,
      timeToLive: 4 * 7 * 24 * 3600, // 4 weeks
      retries: 4
    }
  },
  apn: {
    gateway: 'gateway.sandbox.push.apple.com',
    badge: 1,
    defaultData: {
      expiry: 4 * 7 * 24 * 3600, // 4 weeks
      sound: 'ping.aiff'
    }
  },
  adm: {
    client_id: null, // PUT YOUR ADM CLIENT ID,
    client_secret: null, // PUT YOUR ADM CLIENT SECRET,
    expiresAfter: 4 * 7 * 24 * 3600 // 4 weeks
  }
};

function PushNotifications(options) {
  this.settings = {};
  _.extend(this.settings, settings, options);
}

PushNotifications.prototype.send = function (pushId, data, callback) {
  var GCMSender;
  var APNConnection;
  var ADMSender;

  var regIdsGCM = [];
  var regIdsAPN = [];
  var regIdsMPNS = [];
  var regIdsADM = [];

  var messageGCM = '';
  var messageAPN = '';

  var parallel = new Parallel();

  var gcmOptions = {};
  var apnOptions = {};
  var admOptions = {};

  var _this = this;

  _.extend(gcmOptions, _this.settings.gcm.options);
  _.extend(apnOptions, _this.settings.apn.options, _this.settings.apn);
  _.extend(admOptions, _this.settings.adm.options, _this.settings.adm);
  GCMSender = new gcm.Sender(_this.settings.gcm.id, gcmOptions);
  APNConnection = new apn.Connection(apnOptions);
  ADMSender = new adm.Sender(admOptions);

  parallel.timeout(10000);

  if (pushId instanceof Array) {
    // Nothing to do: it's already an array
  } else if (pushId.length) {
    pushId = [pushId];
  } else {
    pushId = [];
  }

  for (i = 0; i < pushId.length; i++) {
    if (pushId[i].substring(0, 4) === 'http') {
      regIdsMPNS.push(pushId);
    } else if (pushId[i].length > 64) {
      regIdsGCM.push(pushId[i]);
    } else if (pushId[i].length === 64) {
      regIdsAPN.push(pushId[i]);
    } else if (true) { // need to find condition for amazon token
      regIdsADM.push(pushId[i]);
    }
  }

  // Android GCM
  if (regIdsGCM[0] != undefined) {
    androidData = _.extend({
      data: data
    }, _this.settings.gcm.dataDefaults);
    messageGCM = new gcm.Message(androidData);
    messageGCM.addData('msgcnt', _this.settings.gcm.msgcnt);

    parallel.add(function (done) {
      GCMSender.send(messageGCM, regIdsGCM, _this.settings.gcm.retries, function (err, result) {
        console.log('GCMSender.send', err, result);
        if (err) {
          done({
            device: 'android',
            message: err
          });
        } else {
          if (result && result.failure === 0) {
            done(null, result.success);
          } else {
            done({
              device: 'android',
              message: result.results
            });
          }
        }
      });
    });
  }

  // iOS APN
  if (regIdsAPN[0] != undefined) {
    messageAPN = new apn.Notification();
    _.extend(messageAPN, _this.settings.apn.defaultData);
    messageAPN.expiry = Math.floor(Date.now() / 1000) + _this.settings.apn.expiry;
    messageAPN.badge = _this.settings.apn.badge;
    messageAPN.sound = _this.settings.apn.defaultData.sound;
    messageAPN.alert = data.title;
    messageAPN.alert = {title: data.title, body: data.message};
    //delete data.title;
    messageAPN.payload = data;

    APNConnection.pushNotification(messageAPN, regIdsAPN);

    parallel.add(function (done) {
      APNConnection.on('completed', function () {
        done(null, {
          device: 'ios',
          message: 'completed'
        });
      });
      APNConnection.on('error', function () {
        done({
          device: 'ios',
          message: 'error'
        });
      });
      APNConnection.on('socketError', function () {
        done({
          device: 'ios',
          message: 'socketError'
        });
      });
      APNConnection.on('transmissionError', function () {
        done({
          device: 'ios',
          message: 'transmissionError'
        });
      });
      APNConnection.on('cacheTooSmall', function () {
        done({
          device: 'ios',
          message: 'cacheTooSmall'
        });
      });
    });
  }

  // Microsoft MPNS
  for (i = 0; i < regIdsMPNS.length; i++) {
    var tempMPNS = regIdsMPNS[i];
    parallel.add(function (done) {
      mpns.sendToast(tempMPNS, data.title, data.message, data, function (err) {
        if (err === undefined) {
          done(0, 1);
        } else {
          done({
            device: 'windows phone',
            message: err
          });
        }
      });
    });
  }

  // Amazon AMZ
  var AMZmesssage = {
    data: data,
    consolidationKey: 'demo',
    expiresAfter: Math.floor(Date.now() / 1000) + _this.settings.adm.expiresAfter // 1 hour
  };

  for (i = 0; i < regIdsADM.length; i++) {
    var tempADM = regIdsADM[i];
    parallel.add(function (done) {
      ADMSender.send(AMZmesssage, tempADM, function (err, result) {
        if (err) {
          // No recoverable error
          done({
            device: 'amazon phone',
            message: err
          });
        }
        if (result.error) {
          // ADM Server error such as InvalidRegistrationId
          done({
            device: 'amazon phone',
            message: result.error
          });
        } else if (result.registrationID) {
          done(0, 1);
        }
      });
    });
  }

  parallel.done(function (err, results) {
    var pushResult = '';
    for (i = 0; i < results.length; i++) {
      if (results[i] != 1) {
        pushResult = pushResult + results[i];
      }
    }
    if (pushResult.length > 1) {
      callback(null, pushResult);
    } else {
      callback(err);
    }
  });
};

module.exports = PushNotifications;
