Node Push Notifications
========

A node.js module for interfacing with Apple Push Notification, Google Cloud Messaging, Windows Push Notification and Amazon Device Messaging services.

[![License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://npmjs.org/package/node-pushnotifications)
[![NPM version](http://img.shields.io/npm/v/node-pushnotifications.svg?style=flat)](https://npmjs.org/package/node-pushnotifications)
[![Downloads](http://img.shields.io/npm/dm/node-pushnotifications.svg?style=flat)](https://npmjs.org/package/node-pushnotifications)
[![Build Status](http://img.shields.io/travis/appfeel/node-pushnotifications.svg?style=flat)](https://travis-ci.org/appfeel/node-pushnotifications)
[![Coverage Status](https://coveralls.io/repos/github/appfeel/node-pushnotifications/badge.svg?branch=master)](https://coveralls.io/github/appfeel/node-pushnotifications?branch=master)
[![Dependencies](https://img.shields.io/david/appfeel/node-pushnotifications.svg?style=flat-square)](https://david-dm.org/appfeel/node-pushnotifications)

**NOTE:** Version 1.x has completely been redesigned to be compatible with new apn 2.x and written in es6. Tests have been implemented.

## Installation

```bash
npm install node-pushnotifications --save
```

## Features

- Powerful and intuitive.
- Multi platform push notifications.
- Automatically detects destination device type.
- Unified error handling.
- Compatible with ES5 through babel transpilation.

## Usage 

### 1. Import and setup push module:

```js
const settings = {
    gcm: {
        id: null,
        ...
    },
    apn: {
        cert: 'cert.pem',
        key: 'key.pem',
        ...
    },
    adm: {
        client_id: null,
        client_secret: null,
        ...
    },
    wns: {
        client_id: null,
        client_secret: null,
        notificationMethod: 'sendTileSquareBlock',
        ...
    }
};
const PushNotifications = new require('node-pushnotifications');
const push = new PushNotifications(settings);
```

* GCM and ADM options: see [node-gcm](https://github.com/ToothlessGear/node-gcm#custom-gcm-request-options)
* APN options: see [node-apn](https://github.com/node-apn/node-apn/blob/master/doc/provider.markdown)
* ADM options: see [node-gcm](https://github.com/umano/node-adm)
* WNS options: see [wns](https://github.com/tjanczuk/wns)

*iOS:* It is recomended to use [provider authentication tokens](https://developer.apple.com/library/prerelease/content/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Chapters/APNsProviderAPI.html#//apple_ref/doc/uid/TP40008194-CH101-SW21). However, you can also use certificates. See [node-apn](https://github.com/node-apn/node-apn/wiki/Preparing-Certificates) to see how to prepare cert.pem and key.pem. 

### 2. Define destination device ID. You can send to multiple devices, independently of platform, creating an array with different destination device IDs.

```js
// Single destination
const registrationIds = 'INSERT_YOUR_DEVICE_ID';

// Multiple destinations
const registrationIds = [];
registrationIds.push('INSERT_YOUR_DEVICE_ID');
registrationIds.push('INSERT_OTHER_DEVICE_ID');
```

### 3. Create a JSON object with a title and message and send the notification.

```js
const data = {
  title: 'New push notification',
  body: 'Powered by AppFeel',
};
push.send(registrationIds, data, (err, result) => {
    if (err) {
        console.log(err);
    } else {
	    console.log(result);
    }
});

// Or you could use it as a promise:
push.send(registrationIds, data)
    .then((results) => { ... })
    .catch((err) => { ... });
```

- `err` will be null if all went fine, will return the error otherwise.
- `result` will contain an array with the following objects:

```js
[
    {
        method: 'gcm', // The method used send notifications and which this info is related to
        multicastId: [], // (only Android) Array with unique ID (number) identifying the multicast message, one identifier for each chunk of 1.000 notifications)
        success: 0, // Number of notifications that have been successfully sent. It does not mean that the notification has been deliveried.
        failure: 0, // Number of notifications that have been failed to be send.
        message: [{
            messageId: '', // (only for android) String specifying a unique ID for each successfully processed message or undefined if error
            regId: value, // The registrationId
            error: new Error('unknown'), // If any there will be an Error object here
        }],
    },
    {
        method: 'apn',
        ... // Same structure here
    },
    ...
]
```

## GCM

**NOTE** If you provide more than 1.000 registration tokens, they will automatically be splitted in 1.000 chunks (see [this issue in gcm repo](https://github.com/ToothlessGear/node-gcm/issues/42))
The following parameters are used to create a GCM message. See https://developers.google.com/cloud-messaging/http-server-ref#table5 for more info:

```js
{
    collapseKey: data.collapseKey,
    priority: data.priority,
    contentAvailable: data.contentAvailable || false,
    delayWhileIdle: data.delayWhileIdle || false, // Deprecated from Nov 15th 2016 (will be ignored)
    timeToLive: data.expiry - Math.floor(Date.now() / 1000) || data.timeToLive || 28 * 86400,
    restrictedPackageName: data.restrictedPackageName,
    dryRun: data.dryRun || false,
    data: data.custom,
    notification: {
        title: data.title, // Android, iOS (Watch)
        body: data.body, // Android, iOS
        icon: data.icon, // Android
        sound: data.sound, // Android, iOS
        badge: data.badge, // iOS
        tag: data.tag, // Android
        color: data.color, // Android
        click_action: data.clickAction || data.category, // Android, iOS
        body_loc_key: data.locKey, // Android, iOS
        body_loc_args: data.locArgs, // Android, iOS
        title_loc_key: data.titleLocKey, // Android, iOS
        title_loc_args: data.titleLocArgs, // Android, iOS
    },
}
```

*data is the parameter in `push.send(registrationIds, data)`*

* [See node-gcm fields](https://github.com/ToothlessGear/node-gcm#usage)

## APN

The following parameters are used to create an APN message:

```js
{
    retryLimit: data.retries || -1,
    expiry: data.expiry || ((data.timeToLive || 28 * 86400) + Math.floor(Date.now() / 1000)),
    priority: data.priority,
    encoding: data.encoding,
    payload: data.custom,
    badge: data.badge,
    sound: data.sound || 'ping.aiff',
    alert: data.alert || {
        title: data.title,
        body: data.body,
        'title-loc-key': data.titleLocKey,
        'title-loc-args': data.titleLocArgs,
        'loc-key': data.locKey,
        'loc-args': data.locArgs,
        'launch-image': data.launchImage,
        action: data.action,
    },
    topic: data.topic || '',
    category: data.category || data.clickAction,
    contentAvailable: data.contentAvailable,
    mdm: data.mdm,
    urlArgs: data.urlArgs,
    truncateAtWordEnd: data.truncateAtWordEnd,
}
```

*data is the parameter in `push.send(registrationIds, data)`*

* [See apn fields](https://github.com/node-apn/node-apn/blob/master/doc/notification.markdown)

## ADM

The following parameters are used to create an ADM message:

```js
const data = Object.assign({}, _data); // _data is the data passed as method parameter
const consolidationKey = data.consolidationKey;
const expiry = data.expiry;
const timeToLive = data.timeToLive;

delete data.consolidationKey;
delete data.expiry;
delete data.timeToLive;

const ADMmesssage = {
    expiresAfter: expiry - Math.floor(Date.now() / 1000) || timeToLive || 28 * 86400,
    consolidationKey,
    data,
};
```

*data is the parameter in `push.send(registrationIds, data)`*

* [See node-adm fields](https://github.com/umano/node-adm#usage)

## WNS

The following fields are used to create a WNS message:

```js
const notificationMethod = settings.wns.notificationMethod;
const opts = Object.assign({}, settings.wns);
opts.headers = data.headers || opts.headers;
opts.launch = data.launch || opts.launch;
opts.duration = data.duration || opts.duration;

delete opts.notificationMethod;
delete data.headers;
delete data.launch;
delete data.duration;

wns[notificationMethod](regId, data, opts, (err, response) => { ... });

```

*data is the parameter in `push.send(registrationIds, data)`*

* [See wns optional fileds](https://github.com/tjanczuk/wns)
**Note:** Please take in mind that if `data.accessToken` is supplied then each push notification will be sent after the previous one has been responded. This is due to the fact that in the response while sending a push notification it is possible that Microsoft servers responds with a new `accessToken` and it should be used for next requests. This can slow down the whole process.


## Resources

- [Node Push Notify from alexlds](https://github.com/alexlds/node-push-notify)
- [Google Cloud Messaging setup guide](http://aerogear.org/docs/guides/aerogear-push-android/google-setup/)
- [Apple Push Notification setup guide Part 1](http://aerogear.org/docs/guides/aerogear-push-ios/app-id-ssl-certificate-apns/)
- [Apple Push Notification setup guide Part 2](https://github.com/argon/node-apn/wiki/Preparing-Certificates)

## LICENSE

The MIT License (MIT)

Copyright (c) 2016 AppFeel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


*<p style="font-size: small;" align="right"><a color="#232323;" href="http://appfeel.com">Made in Barcelona with <span color="#FCB"><3</span> and <span color="#BBCCFF">Code</span></a></p>*
