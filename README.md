Node Push Notifications
========

A node.js module for interfacing with Apple Push Notification, Google Cloud Messaging, Windows Push Notification and Amazon Device Messaging services.

[![License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://npmjs.org/package/node-pushnotifications)
[![NPM version](http://img.shields.io/npm/v/node-pushnotifications.svg?style=flat)](https://npmjs.org/package/node-pushnotifications)
[![Downloads](http://img.shields.io/npm/dm/node-pushnotifications.svg?style=flat)](https://npmjs.org/package/node-pushnotifications)
[![Build Status](http://img.shields.io/travis/appfeel/node-pushnotifications.svg?style=flat)](https://travis-ci.org/appfeel/node-pushnotifications)
[![Coverage Status](https://coveralls.io/repos/github/appfeel/node-pushnotifications/badge.svg?branch=master)](https://coveralls.io/github/appfeel/node-pushnotifications?branch=master)
[![Dependencies](https://david-dm.org/appfeel/node-pushnotifications/status.svg)](https://david-dm.org/appfeel/node-pushnotifications)

**NOTE:** Version 1.x has completely been redesigned to be compatible with new apn 2.x.

## Installation

```bash
npm install node-pushnotifications --save
```

## Features

- Powerful and intuitive.
- Multi platform push notifications.
- Automatically detects destination device type.
- Unified error handling.
- Written in ES6, compatible with ES5 through babel transpilation.

## Usage 

### 1. Import and setup push module:

Include the settings for each device type. You should only include the settings for the devices that you expect to have. I.e. if your app is only available for android or for ios, you should only include `gcm` or `apn` respectively.

```js
const settings = {
    gcm: {
        id: null,
        ...
    },
    apn: {
        token: {
            key: './certs/key.p8', // optionally: fs.readFileSync('./certs/key.p8')
            keyId: 'ABCD',
            teamId: 'EFGH',
        },
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

* GCM options: see [node-gcm](https://github.com/ToothlessGear/node-gcm#custom-gcm-request-options)
* APN options: see [node-apn](https://github.com/node-apn/node-apn/blob/master/doc/provider.markdown)
* ADM options: see [node-adm](https://github.com/umano/node-adm)
* WNS options: see [wns](https://github.com/tjanczuk/wns)

*iOS:* It is recomended to use [provider authentication tokens](https://developer.apple.com/library/content/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/CommunicatingwithAPNs.html). You need the .p8 certificate that you can obtain in your [account memebership](https://cloud.githubusercontent.com/assets/8225312/20380437/599a767c-aca2-11e6-82bd-3cbfc2feee33.png). You should ask for an *Apple Push Notification Authentication Key (Sandbox & Production)* or *Apple Push Notification service SSL (Sandbox & Production)*. However, you can also use certificates. See [node-apn](https://github.com/node-apn/node-apn/wiki/Preparing-Certificates) to see how to prepare cert.pem and key.pem. 

### 2. Define destination device ID. You can send to multiple devices, independently of platform, creating an array with different destination device IDs.

```js
// Single destination
const registrationIds = 'INSERT_YOUR_DEVICE_ID';

// Multiple destinations
const registrationIds = [];
registrationIds.push('INSERT_YOUR_DEVICE_ID');
registrationIds.push('INSERT_OTHER_DEVICE_ID');
```

*Android:* If you provide more than 1.000 registration tokens, they will automatically be splitted in 1.000 chunks (see [this issue in gcm repo](https://github.com/ToothlessGear/node-gcm/issues/42))

### 3. Create a JSON object with a title and message and send the notification.

Both `title` and `body` fields are required (or `alert` for ios). The other fields are optional (see below how the message is created for each device type):

```js
const data = {
    title: 'New push notification', // REQUIRED
    body: 'Powered by AppFeel', // REQUIRED
    custom: {
        sender: 'AppFeel',
    },
    priority: 'high', // gcm, apn. Supported values are 'high' or 'normal' (gcm). Will be translated to 10 and 5 for apn. Defaults to 'high'
    collapseKey: '', // gcm for android, used as collapseId in apn
    contentAvailable: true, // gcm for android
    delayWhileIdle: true, // gcm for android
    restrictedPackageName: '', // gcm for android
    dryRun: false, // gcm for android
    icon: '', // gcm for android
    tag: '', // gcm for android
    color: '', // gcm for android
    clickAction: '', // gcm for android. In ios, category will be used if not supplied
    locKey: '', // gcm, apn
    bodyLocArgs: '', // gcm, apn
    titleLocKey: '', // gcm, apn
    titleLocArgs: '', // gcm, apn
    retries: 1, // gcm, apn
    encoding: '', // apn
    badge: 2, // gcm for ios, apn
    sound: 'ping.aiff', // gcm, apn
    alert: {}, // apn, will take precedence over title and body
    // alert: '', // It is also accepted a text message in alert
    titleLocKey: '', // apn and gcm for ios
    titleLocArgs: '', // apn and gcm for ios
    launchImage: '', // apn and gcm for ios
    action: '', // apn and gcm for ios
    topic: '', // apn and gcm for ios
    category: '', // apn and gcm for ios
    contentAvailable: '', // apn and gcm for ios
    mdm: '', // apn and gcm for ios
    urlArgs: '', // apn and gcm for ios
    truncateAtWordEnd: true, // apn and gcm for ios
    mutableContent: 0, // apn
    expiry: Math.floor(Date.now() / 1000) + 28 * 86400, // seconds
    timeToLive: 28 * 86400, // if both expiry and timeToLive are given, expiry will take precedency
    headers: [], // wns
    launch: '', // wns
    duration: '', // wns
    consolidationKey: 'my notification', // ADM
};

// You can use it in node callback style
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
- `result` will contain an array with the following objects (one object for each device type found in device registration id's):

```js
[
    {
        method: 'gcm', // The method used send notifications and which this info is related to
        multicastId: [], // (only Android) Array with unique ID (number) identifying the multicast message, one identifier for each chunk of 1.000 notifications)
        success: 0, // Number of notifications that have been successfully sent. It does not mean that the notification has been deliveried.
        failure: 0, // Number of notifications that have been failed to be send.
        message: [{
            messageId: '', // (only for android) String specifying a unique ID for each successfully processed message or undefined if error
            regId: value, // The registrationId (device token id)
            error: new Error('unknown'), // If any, there will be an Error object here
        }],
    },
    {
        method: 'apn',
        ... // Same structure here
    },
    {
        method: 'wns',
        ... // Same structure here
    },
    {
        method: 'adm',
        ... // Same structure here
    },
]
```

## GCM

**NOTE:** If you provide more than 1.000 registration tokens, they will automatically be splitted in 1.000 chunks (see [this issue in gcm repo](https://github.com/ToothlessGear/node-gcm/issues/42))

The following parameters are used to create a GCM message. See https://developers.google.com/cloud-messaging/http-server-ref#table5 for more info:

```js
    // Set default custom data from data
    let custom;
    if (typeof data.custom === 'string') {
        custom = {
            message: data.custom,
        };
    } else if (typeof data.custom === 'object') {
        custom = Object.assign({}, data.custom);
    } else {
        custom = {
            data: data.custom,
        };
    }

    custom.title = custom.title || data.title || '';
    custom.message = custom.message || data.body || '';
    custom.sound = custom.sound || data.sound || undefined;
    custom.icon = custom.icon || data.icon || undefined;
    custom.msgcnt = custom.msgcnt || data.badge || undefined;
    if (opts.phonegap === true && data.contentAvailable) {
        custom['content-available'] = 1;
    }

    const message = new gcm.Message({ // See https://developers.google.com/cloud-messaging/http-server-ref#table5
        collapseKey: data.collapseKey,
        priority: data.priority === 'normal' ? data.priority : 'high',
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

**Note:** parameters are duplicated in data and in notification, so in fact they are being send as:

```js
    data: {
        title: 'title',
        message: 'body',
        sound: 'mySound.aiff',
        icon: undefined,
        msgcnt: undefined
        // Any custom data
        sender: 'appfeel-test',
    },
    notification: {
        title: 'title',
        body: 'body',
        icon: undefined,
        sound: 'mySound.aiff',
        badge: undefined,
        tag: undefined,
        color: undefined,
        click_action: undefined,
        body_loc_key: undefined,
        body_loc_args: undefined,
        title_loc_key: undefined,
        title_loc_args: undefined
    }
```

In that way, they can be accessed in android in the following two ways:

```java
    String title = extras.getString("title");
    title = title != null ? title : extras.getString("gcm.notification.title");
```

### PhoneGap compatibility mode

In case your app is written with Cordova / Ionic and you are using the [PhoneGap PushPlugin](https://github.com/phonegap/phonegap-plugin-push/), 
you can use the `phonegap` setting in order to adapt to the recommended behaviour described in 
[https://github.com/phonegap/phonegap-plugin-push/blob/master/docs/PAYLOAD.md#android-behaviour](https://github.com/phonegap/phonegap-plugin-push/blob/master/docs/PAYLOAD.md#android-behaviour).

```js
    const settings = {
        gcm: {
            id: '<yourId>',
            phonegap: true
        }
    }
```

## APN

The following parameters are used to create an APN message:

```js
{
    retryLimit: data.retries || -1,
    expiry: data.expiry || ((data.timeToLive || 28 * 86400) + Math.floor(Date.now() / 1000)),
    priority: data.priority === 'normal' ? 5 : 10,
    encoding: data.encoding,
    payload: data.custom || {},
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
    topic: data.topic, // Required
    category: data.category || data.clickAction,
    contentAvailable: data.contentAvailable,
    mdm: data.mdm,
    urlArgs: data.urlArgs,
    truncateAtWordEnd: data.truncateAtWordEnd,
    collapseId: data.collapseKey,
    mutableContent: data.mutableContent || 0,
}
```

*data is the parameter in `push.send(registrationIds, data)`*

* [See node-apn fields](https://github.com/node-apn/node-apn/blob/master/doc/notification.markdown)
* **Please note** that `topic` is required ([see node-apn docs](https://github.com/node-apn/node-apn/blob/master/doc/notification.markdown#notificationtopic))

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

* [See wns fileds](https://github.com/tjanczuk/wns)

**Note:** Please keep in mind that if `data.accessToken` is supplied, each push notification will be sent after the previous one has been **responded**. This is because Microsoft may send a new `accessToken` in the response and it should be used in successive requests. This can slow down the whole process depending on the number of devices to send.

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


## Resources

- [Node Push Notify from alexlds](https://github.com/alexlds/node-push-notify)

## LICENSE

```
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
```

*<p style="font-size: small;" align="right"><a color="#232323;" href="http://appfeel.com">Made in Barcelona with <span color="#FCB"><3</span> and <span color="#BBCCFF">Code</span></a></p>*
