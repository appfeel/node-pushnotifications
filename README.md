# Node Push Notifications

A node.js module for interfacing with Apple Push Notification, Google Cloud Messaging, Windows Push Notification, Web-Push Notification and Amazon Device Messaging services.

[![License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://npmjs.org/package/node-pushnotifications)
[![NPM version](http://img.shields.io/npm/v/node-pushnotifications.svg?style=flat)](https://npmjs.org/package/node-pushnotifications)
[![Downloads](http://img.shields.io/npm/dm/node-pushnotifications.svg?style=flat)](https://npmjs.org/package/node-pushnotifications)
[![node-pushnotifications CI](https://github.com/appfeel/node-pushnotifications/actions/workflows/ci.yml/badge.svg)](https://github.com/appfeel/node-pushnotifications/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/appfeel/node-pushnotifications/badge.svg?branch=master)](https://coveralls.io/github/appfeel/node-pushnotifications?branch=master)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

- [Installation](#installation)
- [Requirements](#requirements)
- [Features](#features)
- [Usage](#usage)
- [FCM](#fcm)
- [APN](#apn)
- [WNS](#wns)
- [ADM](#adm)
- [Web-Push](#web-push)
- [Resources](#resources)
- [Proxy](#proxy)
- [LICENSE](#license)

## Installation

```bash
npm install node-pushnotifications --save
```

## Requirements

Node version >= 14.x.x

## Features

- Powerful and intuitive.
- Multi platform push notifications.
- Automatically detects destination device type.
- Unified error handling.
- Written in ES6, compatible with ES5 through babel transpilation.

## Usage

### 1. Import and setup push module

Include the settings for each device type. You should only include the settings for the devices that you expect to have. I.e. if your app is only available for Android or for iOS, you should only include `fcm` or `apn` respectively.

```js
import PushNotifications from 'node-pushnotifications';

const settings = {
    fcm: {
        appName: 'localFcmAppName',
        serviceAccountKey: require('../firebase-project-service-account-key.json'), // firebase service-account-file.json,
        credential: null, // 'firebase-admin' Credential interface
        // Optional Firebase Admin SDK AppOptions
        projectId: 'your-project-id', // Explicitly set the Google Cloud project ID
        databaseURL: 'https://your-database.firebaseio.com', // Realtime Database URL (optional)
        storageBucket: 'your-bucket.appspot.com', // Cloud Storage bucket (optional)
        serviceAccountId: 'your-email@your-project.iam.gserviceaccount.com', // Service account email (optional)
        httpAgent: undefined, // HTTP Agent for proxy support (optional)
        httpsAgent: undefined, // HTTPS Agent for proxy support (optional)
    },
    apn: {
        token: {
            key: './certs/key.p8', // optionally: fs.readFileSync('./certs/key.p8')
            keyId: 'ABCD',
            teamId: 'EFGH',
        },
        production: false // true for APN production environment, false for APN sandbox environment,
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
    },
    web: {
        vapidDetails: {
            subject: '< \'mailto\' Address or URL >',
            publicKey: '< URL Safe Base64 Encoded Public Key >',
            privateKey: '< URL Safe Base64 Encoded Private Key >',
        },
        TTL: 2419200,
        contentEncoding: 'aes128gcm',
        headers: {}
    },
    isAlwaysUseFCM: false, // true all messages will be sent through FCM API

};
const push = new PushNotifications(settings);
```

- FCM options: see [firebase-admin](https://firebase.google.com/docs/admin/setup) (read [FCM](#fcm) section below!) - used for Android and fallback for other platforms
- APN options: see [node-apn](https://github.com/node-apn/node-apn/blob/master/doc/provider.markdown)
- ADM options: see [node-adm](https://github.com/umano/node-adm)
- WNS options: see [wns](https://github.com/tjanczuk/wns)
- Web-push options: see [web-push](https://github.com/web-push-libs/web-push)

* `isAlwaysUseFCM`: when set to `true`, will send all notifications through FCM instead of platform-specific services

_iOS:_ It is recommended to use [provider authentication tokens](https://developer.apple.com/library/content/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/CommunicatingwithAPNs.html). You need the .p8 certificate that you can obtain in your [account membership](https://cloud.githubusercontent.com/assets/8225312/20380437/599a767c-aca2-11e6-82bd-3cbfc2feee33.png). You should ask for an _Apple Push Notification Authentication Key (Sandbox & Production)_ or _Apple Push Notification service SSL (Sandbox & Production)_. However, you can also use certificates. See [node-apn](https://github.com/node-apn/node-apn/wiki/Preparing-Certificates) to see how to prepare cert.pem and key.pem.

### 2. Define destination device ID

Registration id's should be defined as objects (or strings which is not recommended and should be used at your own risk, it is kept for backwards compatibility).

You can send to multiple devices, independently of platform, creating an array with different destination device IDs.

```js
// Single destination
const registrationIds = 'INSERT_YOUR_DEVICE_ID';

// Multiple destinations
const registrationIds = [];
registrationIds.push('INSERT_YOUR_DEVICE_ID');
registrationIds.push('INSERT_OTHER_DEVICE_ID');
```

The `PN.send()` method later detects device type and therefore used push method, based on the id stucture. Check out the method `PN.getPushMethodByRegId` how this detection works.

Actually there are several different supported reg id's:

#### Object regId

It can be of 2 types:

- Mobile regId:

```json
{
  "id": "INSERT_YOUR_DEVICE_ID",
  "type": "apn"
}
```

Where type can be one of: 'apn', 'fcm', 'adm', 'wns', 'webPush'. The types are available as constants:

```js
import { WEB, WNS, ADM, FCM, APN } from 'node-pushnotifications';

const regId = {
  id: 'INSERT_YOUR_DEVICE_ID',
  type: APN,
};
```

In case of webPush, `id` needs to be as defined below for `Web subscription`.

- Web subscription see [web-push](https://www.npmjs.com/package/web-push)

```json
{
  "endpoint": "< Push Subscription URL >",
  "keys": {
    "p256dh": "< User Public Encryption Key >",
    "auth": "< User Auth Secret >"
  }
}
```

#### String regId (not recommended)

It is not recommended, as the [reg id is of variable length](https://developer.apple.com/documentation/uikit/uiapplicationdelegate/1622958-application), which makes it difficult to identify if it is an APN regId or FCM regId.

- `regId.substring(0, 4) === 'http'`: 'wns'
- `/^(amzn[0-9]*.adm)/i.test(regId)`: 'adm'
- `(regId.length === 64 || regId.length === 160) && /^[a-fA-F0-9]+$/.test(regId)`: 'apn'
- `regId.length > 64`: 'fcm'
- otherwise: 'unknown' (the notification will not be sent)

**Android:**

- All Android notifications are sent through Firebase Cloud Messaging (FCM)
- If you provide more than 1.000 registration tokens, they will automatically be split into 1.000 chunks
- You are able to send to custom topics or conditions through FCM (see [firebase-admin docs](https://firebase.google.com/docs/cloud-messaging))

Example:

```javascript
const data = { ...data, recipients };
```

### 3. Send the notification

Create a JSON object with a title and message and send the notification.

```js
const data = {
    title: 'New push notification', // REQUIRED for Android
    topic: 'topic', // REQUIRED for iOS (apn and fcm)
    /* The topic of the notification. When using token-based authentication, specify the bundle ID of the app.
     * When using certificate-based authentication, the topic is usually your app's bundle ID.
     * More details can be found under https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/sending_notification_requests_to_apns
     */
    body: 'Powered by AppFeel',
    custom: {
        sender: 'AppFeel',
    },
    priority: 'high', // fcm, apn. Supported values are 'high' or 'normal' (fcm). Will be translated to 10 and 5 for apn. Defaults to 'high'
    collapseKey: '', // fcm for android, used as collapseId in apn
    contentAvailable: true, // fcm, apn. node-apn will translate true to 1 as required by apn.
    delayWhileIdle: true, // fcm for android
    restrictedPackageName: '', // fcm for android
    dryRun: false, // fcm for android
    directBootOk: false, // fcm for android. Allows direct boot mode
    icon: '', // fcm for android
    image: '', // fcm for android
    style: '', // fcm for android
    picture: '', // fcm for android
    tag: '', // fcm for android
    color: '', // fcm for android
    clickAction: '', // fcm for android. In ios, category will be used if not supplied
    locKey: '', // fcm, apn
    titleLocKey: '', // fcm, apn
    locArgs: undefined, // fcm, apn. Expected format: Stringified Array
    titleLocArgs: undefined, // fcm, apn. Expected format: Stringified Array
    retries: 1, // fcm, apn
    encoding: '', // apn
    badge: 2, // fcm for ios, apn
    sound: 'ping.aiff', // fcm, apn
    android_channel_id: '', // fcm - Android Channel ID
    notificationCount: 0, // fcm for android. badge can be used for both fcm and apn
    ticker: '', // fcm for android. Ticker text for accessibility
    sticky: false, // fcm for android. Notification persists when clicked
    visibility: 'public', // fcm for android. Can be 'public', 'private', or 'secret'
    localOnly: false, // fcm for android. Local-only notification (Wear OS)
    eventTimestamp: undefined, // fcm for android. Date object for event time
    notificationPriority: 'default', // fcm for android. Can be 'min', 'low', 'default', 'high', 'max'
    vibrateTimingsMillis: undefined, // fcm for android. Array of vibration durations in milliseconds
    defaultVibrateTimings: false, // fcm for android. Use system default vibration
    defaultSound: false, // fcm for android. Use system default sound
    lightSettings: undefined, // fcm for android. LED light settings object
    defaultLightSettings: false, // fcm for android. Use system default LED settings
    analyticsLabel: '', // fcm for android. Analytics label for FCM
    alert: { // apn, will take precedence over title and body
        title: 'title',
        body: 'body'
        // details: https://github.com/node-apn/node-apn/blob/master/doc/notification.markdown#convenience-setters
    },
    silent: false, // fcm, apn, will override badge, sound, alert and priority if set to true on iOS, will omit `notification` property and send as data-only on Android/FCM
    /*
     * A string is also accepted as a payload for alert
     * Your notification won't appear on ios if alert is empty object
     * If alert is an empty string the regular 'title' and 'body' will show in Notification
     */
    // alert: '',
    launchImage: '', // apn and fcm for ios
    action: '', // apn and fcm for ios
    category: '', // apn and fcm for ios
    // mdm: '', // apn and fcm for ios. Use this to send Mobile Device Management commands.
    // https://developer.apple.com/library/content/documentation/Miscellaneous/Reference/MobileDeviceManagementProtocolRef/3-MDM_Protocol/MDM_Protocol.html
    urlArgs: '', // apn and fcm for ios
    truncateAtWordEnd: true, // apn and fcm for ios
    mutableContent: 0, // apn
    threadId: '', // apn
    pushType: undefined, // apn. valid values are 'alert' and 'background' (https://github.com/parse-community/node-apn/blob/master/doc/notification.markdown#notificationpushtype)
    expiry: Math.floor(Date.now() / 1000) + 28 * 86400, // unit is seconds. if both expiry and timeToLive are given, expiry will take precedence
    timeToLive: 28 * 86400,
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

- `err` will be null if all went fine, otherwise will return the error from the respective provider module.
- `result` will contain an array with the following objects (one object for each device type found in device registration id's):

```js
[
    {
        method: 'fcm', // The method used send notifications and which this info is related to
        multicastId: [], // (only Android) Array with unique ID (number) identifying the multicast message, one identifier for each chunk of 1.000 notifications)
        success: 0, // Number of notifications that have been successfully sent. It does not mean that the notification has been deliveried.
        failure: 0, // Number of notifications that have been failed to be send.
        message: [{
            messageId: '', // (only for android) String specifying a unique ID for each successfully processed message or undefined if error
            regId: value, // The current registrationId (device token id). Beware: For Android this may change if Google invalidates the previous device token. Use "originalRegId" if you are interested in when this changed occurs.
            originalRegId: value, // (only for android) The registrationId that was sent to the push.send() method. Compare this with field "regId" in order to know when the original registrationId (device token id) gets changed.
            error: new Error('unknown'), // If any, there will be an Error object here for debugging purposes
            errorMsg: 'some error', // If any, will include the error message from the respective provider module
        }],
    },
    {
        method: 'apn',
        ... // Same structure here, except for message.orignalRegId
    },
    {
        method: 'wns',
        ... // Same structure here, except for message.orignalRegId
    },
    {
        method: 'adm',
        ... // Same structure here, except for message.orignalRegId
    },
    {
        method: 'webPush',
        ... // Same structure here, except for message.orignalRegId
    },
]
```

## FCM

All Android push notifications are sent through Firebase Cloud Messaging (FCM) using the [firebase-admin](https://github.com/firebase/firebase-admin-node) library.

The following parameters are used to create an FCM Android message (following the [Firebase Admin SDK AndroidConfig interface](https://firebase.google.com/docs/reference/admin/node/admin.messaging.AndroidConfig)):

**AndroidConfig properties:**

- `collapseKey` - Collapse key for message grouping
- `priority` - Message priority: 'high' (default) or 'normal'
- `ttl` - Time to live in milliseconds (converted from seconds)
- `restrictedPackageName` - Package name restriction
- `directBootOk` - Allow delivery in direct boot mode
- `data` - Custom data fields (key-value pairs)
- `notification` - Android notification properties (see below)
- `fcmOptions` - FCM options including `analyticsLabel`

**AndroidNotification properties:**

- `title` - Notification title
- `body` - Notification body
- `icon` - Notification icon resource
- `color` - Notification color (#rrggbb format)
- `sound` - Notification sound file
- `tag` - Notification tag for replacing existing notifications
- `imageUrl` - Image URL to display in notification
- `clickAction` - Action to launch when notification is clicked
- `bodyLocKey` / `bodyLocArgs` - Localized body text
- `titleLocKey` / `titleLocArgs` - Localized title text
- `channelId` - Android notification channel ID
- `notificationCount` - Number of unread notifications
- `ticker` - Ticker text for accessibility
- `sticky` - Notification persists when clicked
- `visibility` - Visibility level: 'public', 'private', or 'secret'
- `priority` - Notification priority: 'min', 'low', 'default', 'high', or 'max'
- `eventTimestamp` - Date object for event time
- `localOnly` - Local-only notification (for Wear OS)
- `vibrateTimingsMillis` - Vibration pattern (array of milliseconds)
- `defaultVibrateTimings` - Use system default vibration
- `defaultSound` - Use system default sound
- `lightSettings` - LED light configuration object
- `defaultLightSettings` - Use system default LED settings
- `proxy` - Proxy setting: 'allow', 'deny', or 'if_priority_lowered'

Example usage:

```js
const data = {
  title: 'Title',
  body: 'Body text',
  icon: 'ic_notification',
  color: '#FF0000',
  sound: 'notification_sound',
  clickAction: 'OPEN_ACTIVITY',
  android_channel_id: 'default_channel',
  tag: 'my_notification',
  badge: 1,
  notificationPriority: 'high',
  ticker: 'New notification',
  sticky: false,
  visibility: 'public',
  analyticsLabel: 'my_analytics_label',
  custom: {
    key: 'value',
  },
};
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
    badge: data.silent === true ? undefined : data.badge,
    badge: data.sound === true ? undefined : data.sound,
    alert: data.sound === true ? undefined : data.alert || {
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
    threadId: data.threadId,
    pushType: data.pushType,
    rawPayload: data.rawPayload,
    interruptionLevel: data.interruptionLevel
}
```

_data is the parameter in `push.send(registrationIds, data)`_

- [See node-apn fields](https://github.com/node-apn/node-apn/blob/master/doc/notification.markdown)
- **Please note** that `topic` is required ([see node-apn docs](https://github.com/node-apn/node-apn/blob/master/doc/notification.markdown#notificationtopic)). When using token-based authentication, specify the bundle ID of the app.
  When using certificate-based authentication, the topic is usually your app's bundle ID.
  More details can be found under https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/sending_notification_requests_to_apns
- `rawPayload` (hidden 'node-apn' lib notification param) [source code](https://github.com/node-apn/node-apn/blob/master/lib/notification/index.js#L99) this param will replace all payload

### Silent push notifications

iOS supports silent push notifications which are not displayed to the user but only used to transmit data.

Silent push notifications must not include sound, badge or alert and have normal priority.

By setting the `silent` property to `true` the values for `sound`, `badge` and `alert` will be overridden to `undefined`.

Priority will be overridden to `normal`.

```js
const silentPushData = {
    topic: 'yourTopic',
    contentAvailable: true,
    silent: true,
    custom: {
        yourKey: 'yourValue',
        ...
    }
}
```

## FCM

All Android push notifications are sent through Firebase Cloud Messaging (FCM) using the [firebase-admin](https://github.com/firebase/firebase-admin-node) library.

**Firebase Admin SDK App Options:**

The following Firebase Admin SDK `AppOptions` are supported and can be passed in `settings.fcm`:

- `appName` - [Firebase app name](https://firebase.google.com/docs/reference/admin/node/firebase-admin.app.app#appname) (required)
- `serviceAccountKey` - [Firebase service account file](https://firebase.google.com/docs/admin/setup#initialize_the_sdk_in_non-google_environments) use downloaded 'service-account-file.json'
- `credential` - [Firebase credential](https://firebase.google.com/docs/reference/admin/node/firebase-admin.app.credential) (one of `serviceAccountKey` or `credential` is required)
- `projectId` - Explicitly set the Google Cloud project ID (optional)
- `databaseURL` - Realtime Database URL (optional)
- `storageBucket` - Cloud Storage bucket name (optional)
- `serviceAccountId` - Service account email (optional)
- `databaseAuthVariableOverride` - Auth variable override for Realtime Database (optional)
- `httpAgent` - HTTP Agent for proxy support (optional, see [Proxy](#proxy) section)
- `httpsAgent` - HTTPS Agent for proxy support (optional, see [Proxy](#proxy) section)

```js
const tokens = ['e..Gwso:APA91.......7r910HljzGUVS_f...kbyIFk2sK6......D2s6XZWn2E21x'];

const notifications = {
  collapseKey: Math.random().toString().replace('0.', ''),
  priority: 'high',
  sound: 'default',
  title: 'Title 1',
  body: 'Body 2',
  // titleLocKey: 'GREETING',
  // titleLocArgs: ['Smith', 'M'],
  // fcm_notification: {
  //   title: 'Title 1',
  //   body: 'Body 2',
  //   sound: 'default',
  //   default_vibrate_timings: true,
  // },
  // alert: {
  //   title: 'Title 2',
  //   body: 'Body 2'
  // },
  custom: {
    friend_id: 54657,
    list_id: 'N7jSif1INyZkA7r910HljzGUVS',
  },
};

pushNotifications.send(tokens, notifications, (error, result) => {
  if (error) {
    console.log('[error]', error);
    throw error;
  } else {
    console.log('[result]', result, result.at(0));
  }
});
```

`fcm_notification` - object that will be passed to FCM message notification field

Fcm object that will be sent to provider ([Fcm message format](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages?authuser=0#Message)) :

```json
{
  "data": {
    "friend_id": "54657",
    "list_id": "N7jSif1INyZkA7r910HljzGUVS"
  },
  "android": {
    "collapse_key": "5658586678087056",
    "priority": "high",
    "notification": {
      "title": "Title 1",
      "body": "Body 2",
      "sound": "default"
    },
    "ttl": 2419200000
  },
  "apns": {
    "headers": {
      "apns-expiration": "1697456586",
      "apns-collapse-id": "5658586678087056"
    },
    "payload": {
      "aps": {
        "sound": "default",
        "alert": {
          "title": "Title 1",
          "body": "Body 2"
        }
      }
    }
  },
  "tokens": ["e..Gwso:APA91.......7r910HljzGUVS_f...kbyIFk2sK6......D2s6XZWn2E21x"]
}
```

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

_data is the parameter in `push.send(registrationIds, data)`_

- [See wns fileds](https://github.com/tjanczuk/wns)

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

_data is the parameter in `push.send(registrationIds, data)`_

- [See node-adm fields](https://github.com/umano/node-adm#usage)

## Web-Push

Data can be passed as a simple string payload. If you do not pass a string, the parameter value will be stringified beforehand.
Settings are directly forwarded to `webPush.sendNotification`.

```js
const payload = typeof data === 'string' ? data : JSON.stringify(data);
webPush.sendNotification(regId, payload, settings.web);
```

A working server example implementation can be found at [https://github.com/alex-friedl/webpush-example/blob/master/server/index.js](https://github.com/alex-friedl/webpush-example/blob/master/server/index.js)

## Proxy

To use the module with a proxy:

```
import { HttpsProxyAgent } from 'https-proxy-agent';
...
const settings = {
    fcm: {
		...,
		httpAgent: new HttpProxyAgent(`http://${env.proxy.host}:${env.proxy.port}`),
		httpsAgent: new HttpsProxyAgent(`http://${env.proxy.host}:${env.proxy.port}`),
    },
    apn: {
        ...
		proxy: {
			host: <proxy_address>,
			port: <proxy_port>
		}
    }
};
```

## Resources

- [Crossplatform integration example using this library and a React Native app](https://github.com/alex-friedl/crossplatform-push-notifications-example)
- [Web-Push client/server example](https://github.com/alex-friedl/webpush-example)
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

_<p style="font-size: small;" align="right"><a color="#232323;" href="http://appfeel.com">Made in Barcelona with <span color="#FCB"><3</span> and <span color="#BBCCFF">Code</span></a></p>_
