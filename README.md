Node Push Notify
========

A Node.js module for interfacing with Apple Push Notification, Google Cloud Messaging, Microsoft Push Notification and Amazon Device Messaging services.

[![License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://npmjs.org/package/node-pushnotifications)
[![NPM version](http://img.shields.io/npm/v/node-pushnotifications.svg?style=flat)](https://npmjs.org/package/node-pushnotifications)
[![Downloads](http://img.shields.io/npm/dm/node-pushnotifications.svg?style=flat)](https://npmjs.org/package/node-pushnotifications)
[![Build Status](http://img.shields.io/travis/appfeel/node-pushnotifications.svg?style=flat)](https://travis-ci.org/appfeel/node-pushnotifications)

## Installation 
```
npm install node-pushnotifications
```

#Features

- Powerful and intuitive.
- Multi platform push sends.
- Automatically detects destination device type.
- Unified error handling.

## Usage 

*iOS:* Prepare cert.pem and key.pem as described in [node-apn](https://github.com/argon/node-apn/wiki/Preparing-Certificates)

Import and setup push module:
```js
var settings = {
  gcm: {
    id: null, // PUT YOUR GCM SERVER API KEY,
    msgcnt: 1,
    dataDefaults: {
      delayWhileIdle: false,
      timeToLive: 4 * 7 * 24 * 3600, // 4 weeks
      retries: 4,
    },
    // Custom GCM request options https://github.com/ToothlessGear/node-gcm#custom-gcm-request-options
    options: {},
  },
  apn: {
    gateway: 'gateway.sandbox.push.apple.com',
    badge: 1,
    defaultData: {
      expiry: 4 * 7 * 24 * 3600, // 4 weeks
      sound: 'ping.aiff'
    },
    // See all available options at https://github.com/argon/node-apn/blob/master/doc/connection.markdown
    options: {},
    // I.e., change .cert location file:
    // options: {
    //    cert: "/certs/ios/mycert.cert" // {Buffer|String} The filename of the connection certificate to load from disk, or a Buffer/String containing the certificate data. (Defaults to: cert.pem)
    // }
  },
  adm: {
    client_id: null, // PUT YOUR ADM CLIENT ID,
    client_secret: null, // PUT YOUR ADM CLIENT SECRET,
    expiresAfter: 4 * 7 * 24 * 3600, // 4 weeks
    // Custom ADM request options, same as https://github.com/ToothlessGear/node-gcm#custom-gcm-request-options
    options: {},
  },
};
var PushNotifications = new require('node-pushnotifications');
var push = new PushNotifications(settings);
```

GCM and ADM options: see [node-gcm](https://github.com/ToothlessGear/node-gcm#custom-gcm-request-options)

APN options: see [node-apn](https://github.com/argon/node-apn/blob/master/doc/connection.markdown)


Define destination device ID. You can send to multiple devices, independently of platform, creating an array with different destination device IDs.
```js
// Single destination
var deviceIds = 'INSERT_YOUR_DEVICE_ID';

// Multiple destinations
var deviceIds = [];
deviceIds.push('INSERT_YOUR_DEVICE_ID');
deviceIds.push('INSERT_OTHER_DEVICE_ID');
```

Next, create a JSON object witch MUST contain, at least, a title and message and send it to server. 
```js
var data = {
  title: 'New push notification',
  message: 'Powered by AppFeel',
  otherfields: 'optionally add more data'
};
push.send(deviceIds, data, function (error, result) {
  if (error) {
    console.error(error);
  } else {
    console.log(result);
  }
});
```
Error will be null if there is no error.


##Resources

- [Node Push Notify from alexlds](https://github.com/alexlds/node-push-notify)
- [Google Cloud Messaging setup guide](http://aerogear.org/docs/guides/aerogear-push-android/google-setup/)
- [Apple Push Notification setup guide Part 1](http://aerogear.org/docs/guides/aerogear-push-ios/app-id-ssl-certificate-apns/)
- [Apple Push Notification setup guide Part 2](https://github.com/argon/node-apn/wiki/Preparing-Certificates)

*<p style="font-size: small;" align="right"><a color="#232323;" href="http://appfeel.com">Made in Barcelona with <span color="#FCB"><3</span> and <span color="#BBCCFF">Code</span></a></p>*
