# Node Push Notifications

A node.js module for interfacing with Apple Push Notification, Google Cloud Messaging, Windows Push Notification, Web-Push Notification and Amazon Device Messaging services.

[![License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://npmjs.org/package/node-pushnotifications)
[![NPM version](http://img.shields.io/npm/v/node-pushnotifications.svg?style=flat)](https://npmjs.org/package/node-pushnotifications)
[![Downloads](http://img.shields.io/npm/dm/node-pushnotifications.svg?style=flat)](https://npmjs.org/package/node-pushnotifications)
[![node-pushnotifications CI](https://github.com/appfeel/node-pushnotifications/actions/workflows/ci.yml/badge.svg)](https://github.com/appfeel/node-pushnotifications/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/appfeel/node-pushnotifications/badge.svg?branch=master)](https://coveralls.io/github/appfeel/node-pushnotifications?branch=master)
[![Dependencies](https://david-dm.org/appfeel/node-pushnotifications/status.svg)](https://david-dm.org/appfeel/node-pushnotifications)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

- [Installation](#installation)
- [Requirements](#requirements)
- [Features](#features)
- [Usage](#usage)
- [GCM](#gcm)
- [FCM](#fcm)
- [APN](#apn)
- [WNS](#wns)
- [ADM](#adm)
- [Web-Push](#web-push)
- [Resources](#resources)
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

Include the settings for each device type. You should only include the settings for the devices that you expect to have. I.e. if your app is only available for android or for ios, you should only include `gcm` or `apn` respectively.

```js
import PushNotifications from 'node-pushnotifications';

const settings = {
    gcm: {
        id: 'your-GCM-id',
        phonegap: false, // phonegap compatibility mode, see below (defaults to false)
        ...
    },
    fcm: {
        appName: 'localFcmAppName',
        serviceAccountKey: require('../firebase-project-service-account-key.json'), // firebase service-account-file.json,
        credential: null // 'firebase-admin' Credential interface
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
        gcmAPIKey: 'gcmkey',
        TTL: 2419200,
        contentEncoding: 'aes128gcm',
        headers: {}
    },
    isAlwaysUseFCM: false, // true all messages will be sent through gcm/fcm api
    isLegacyGCM: false // if true gcm messages will be sent through node-gcm (deprecated api), if false gcm messages will be sent through 'firebase-admin' lib

};
const push = new PushNotifications(settings);
```

- GCM options: see [node-gcm](https://github.com/ToothlessGear/node-gcm#custom-gcm-request-options)
- FCM options: see [firebase-admin](https://firebase.google.com/docs/admin/setup) (read [FCM](#fcm) section below!)
- APN options: see [node-apn](https://github.com/node-apn/node-apn/blob/master/doc/provider.markdown)
- ADM options: see [node-adm](https://github.com/umano/node-adm)
- WNS options: see [wns](https://github.com/tjanczuk/wns)
- Web-push options: see [web-push](https://github.com/web-push-libs/web-push)

* `isAlwaysUseFCM`: use node-gcm to send notifications to GCM (by default), iOS, ADM and WNS.

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

Where type can be one of: 'apn', 'gcm', 'adm', 'wns', 'webPush'. The types are available as constants:

```js
import { WEB, WNS, ADM, GCM, APN } from 'node-pushnotifications';

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

It is not recommended, as Apple stays that the [reg id is of variable length](https://developer.apple.com/documentation/uikit/uiapplicationdelegate/1622958-application), which makes difficult to identify if it is a APN regId or GCM regId.

- `regId.substring(0, 4) === 'http'`: 'wns'
- `/^(amzn[0-9]*.adm)/i.test(regId)`: 'adm'
- `(regId.length === 64 || regId.length === 160) && /^[a-fA-F0-9]+$/.test(regId)`: 'apn'
- `regId.length > 64`: 'gcm'
- otherwise: 'unknown' (the notification will not be sent)

**Android:**

- If you provide more than 1.000 registration tokens, they will automatically be splitted in 1.000 chunks (see [this issue in gcm repo](https://github.com/ToothlessGear/node-gcm/issues/42))
- You are able to send to device groups or other custom recipients instead of using a list of device tokens (see [node-gcm docs](https://github.com/ToothlessGear/node-gcm#recipients)). Documentation can be found in the GCM section..

Example:

```javascript
const data = { ...data, recipients };
```

### 3. Send the notification

Create a JSON object with a title and message and send the notification.

```js
const data = {
    title: 'New push notification', // REQUIRED for Android
    topic: 'topic', // REQUIRED for iOS (apn and gcm)
    /* The topic of the notification. When using token-based authentication, specify the bundle ID of the app.
     * When using certificate-based authentication, the topic is usually your app's bundle ID.
     * More details can be found under https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/sending_notification_requests_to_apns
     */
    body: 'Powered by AppFeel',
    custom: {
        sender: 'AppFeel',
    },
    priority: 'high', // gcm, apn. Supported values are 'high' or 'normal' (gcm). Will be translated to 10 and 5 for apn. Defaults to 'high'
    collapseKey: '', // gcm for android, used as collapseId in apn
    contentAvailable: true, // gcm, apn. node-apn will translate true to 1 as required by apn.
    delayWhileIdle: true, // gcm for android
    restrictedPackageName: '', // gcm for android
    dryRun: false, // gcm for android
    icon: '', // gcm for android
    image: '', // gcm for android
    style: '', // gcm for android
    picture: '', // gcm for android
    tag: '', // gcm for android
    color: '', // gcm for android
    clickAction: '', // gcm for android. In ios, category will be used if not supplied
    locKey: '', // gcm, apn
    titleLocKey: '', // gcm, apn
    locArgs: undefined, // gcm, apn. Expected format: Stringified Array
    titleLocArgs: undefined, // gcm, apn. Expected format: Stringified Array
    retries: 1, // gcm, apn
    encoding: '', // apn
    badge: 2, // gcm for ios, apn
    sound: 'ping.aiff', // gcm, apn
    android_channel_id: '', // gcm - Android Channel ID
    notificationCount: 0, // fcm for android. badge can be used for both fcm and apn
    alert: { // apn, will take precedence over title and body
        title: 'title',
        body: 'body'
        // details: https://github.com/node-apn/node-apn/blob/master/doc/notification.markdown#convenience-setters
    },
    silent: false, // gcm, apn, will override badge, sound, alert and priority if set to true on iOS, will omit `notification` property and send as data-only on Android/GCM
    /*
     * A string is also accepted as a payload for alert
     * Your notification won't appear on ios if alert is empty object
     * If alert is an empty string the regular 'title' and 'body' will show in Notification
     */
    // alert: '',
    launchImage: '', // apn and gcm for ios
    action: '', // apn and gcm for ios
    category: '', // apn and gcm for ios
    // mdm: '', // apn and gcm for ios. Use this to send Mobile Device Management commands.
    // https://developer.apple.com/library/content/documentation/Miscellaneous/Reference/MobileDeviceManagementProtocolRef/3-MDM_Protocol/MDM_Protocol.html
    urlArgs: '', // apn and gcm for ios
    truncateAtWordEnd: true, // apn and gcm for ios
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
        method: 'gcm', // The method used send notifications and which this info is related to
        multicastId: [], // (only Android) Array with unique ID (number) identifying the multicast message, one identifier for each chunk of 1.000 notifications)
        success: 0, // Number of notifications that have been successfully sent. It does not mean that the notification has been deliveried.
        failure: 0, // Number of notifications that have been failed to be send.
        message: [{
            messageId: '', // (only for android) String specifying a unique ID for each successfully processed message or undefined if error
            regId: value, // The current registrationId (device token id). Beware: For Android this may change if Google invalidates the previous device token. Use "originalRegId" if you are interested in when this changed occurs.
            originalRegId: value, // (only for android) The registrationId that was sent to the push.send() method. Compare this with field "regId" in order to know when the original registrationId (device token id) gets changed.
            error: new Error('unknown'), // If any, there will be an Error object here for depuration purposes (when possible it will come form source libraries aka apn, node-gcm)
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

    custom.title = custom.title || data.title;
    custom.message = custom.message || data.body;
    custom.sound = custom.sound || data.sound;
    custom.icon = custom.icon || data.icon;
    custom.msgcnt = custom.msgcnt || data.badge;
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
            image: data.image, // Android
            style: data.style, // Android
            picture: data.picture, // Android
            sound: data.sound, // Android, iOS
            badge: data.badge, // iOS
            tag: data.tag, // Android
            color: data.color, // Android
            click_action: data.clickAction || data.category, // Android, iOS
            body_loc_key: data.locKey, // Android, iOS
            body_loc_args: data.locArgs, // Android, iOS
            title_loc_key: data.titleLocKey, // Android, iOS
            title_loc_args: data.titleLocArgs, // Android, iOS
	        android_channel_id: data.android_channel_id, // Android
        },
    }
```

_data is the parameter in `push.send(registrationIds, data)`_

- [See node-gcm fields](https://github.com/ToothlessGear/node-gcm#usage)

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
	image: undefined,
	style: undefined,
	picture: undefined,
        sound: 'mySound.aiff',
        badge: undefined,
        tag: undefined,
        color: undefined,
        click_action: undefined,
        body_loc_key: undefined,
        body_loc_args: undefined,
        title_loc_key: undefined,
        title_loc_args: undefined,
	android_channel_id: undefined
    }
```

In that way, they can be accessed in android in the following two ways:

```java
    String title = extras.getString("title");
    title = title != null ? title : extras.getString("gcm.notification.title");
```

### Silent push notifications

GCM supports silent push notifications which are not displayed to the user but only used to transmit data.

```js
const silentPushData = {
    topic: 'yourTopic',
    silent: true,
    custom: {
        yourKey: 'yourValue',
        ...
    }
}
```

Internally, `silent: true` will tell `node-gcm` _not_ to send the `notification` property and only send the `custom` property. If you don't specify `silent: true` then the push notifications will still be visible on the device. Note that this is nearly the same behavior as `phoneGap: true` and will set `content-available` to `true`.

### Send to custom recipients (device groups or topics)

In order to override the default behaviour of sending the notifications to a list of device tokens,
you can pass a `recipients` field with your desired recipients. Supported fields are `to` and `condition` as documented in the [node-gcm docs](https://github.com/ToothlessGear/node-gcm#recipients).

Example:

```javascript
const dataWithRecipientTo = { ...yourData, recipients: { to: 'topicName' } };
const dataWithRecipientCondition = { ...yourData, recipients: { condition: 'topicName' } };

push.send(registrationIds, dataWithRecipientTo)
    .then((results) => { ... })
    .catch((err) => { ... });
```

Be aware that the presence of a valid `data.recipient` field will take precendence over any Android device tokens passed with the `registrationIds`.

### PhoneGap compatibility mode

In case your app is written with Cordova / Ionic and you are using the [PhoneGap PushPlugin](https://github.com/phonegap/phonegap-plugin-push/),
you can use the `phonegap` setting in order to adapt to the recommended behaviour described in
[https://github.com/phonegap/phonegap-plugin-push/blob/master/docs/PAYLOAD.md#android-behaviour](https://github.com/phonegap/phonegap-plugin-push/blob/master/docs/PAYLOAD.md#android-behaviour).

```js
const settings = {
  gcm: {
    id: '<yourId>',
    phonegap: true,
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
    rawPayload: data.rawPayload
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

The following parameters are used to create an FCM message (Android/APN):
[node-gcm](https://github.com/ToothlessGear/node-gcm) lib for `GCM` method use old firebase api (will be [deprecated ](https://firebase.google.com/docs/cloud-messaging/migrate-v1?hl=en&authuser=0))
Settings:

- `settings.fcm.appName` [firebase app name](https://firebase.google.com/docs/reference/admin/node/firebase-admin.app.app#appname) (required)
- `settings.fcm.serviceAccountKey` [firebase service account file](https://firebase.google.com/docs/admin/setup#initialize_the_sdk_in_non-google_environments) use downloaded 'service-account-file.json'
- `settings.fcm.credential` [firebase credential](https://firebase.google.com/docs/reference/admin/node/firebase-admin.app.credential)
  Note: one of `serviceAccountKey`, `credential` fcm options is required

```js
const tokens = [
  'e..Gwso:APA91.......7r910HljzGUVS_f...kbyIFk2sK6......D2s6XZWn2E21x',
];

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

`fcm_notification` - object that will be passed to

```js
  new gcm.Message({ ..., notification: data.fcm_notification })
```

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
  "tokens": [
    "e..Gwso:APA91.......7r910HljzGUVS_f...kbyIFk2sK6......D2s6XZWn2E21x"
  ]
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
  expiresAfter:
    expiry - Math.floor(Date.now() / 1000) || timeToLive || 28 * 86400,
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
