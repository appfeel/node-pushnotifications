# node-pushnotifications

**Push notifications for [Node.js](https://nodejs.org). One API for FCM, APNs, Web Push, WNS and ADM.**

[![npm version](https://img.shields.io/npm/v/node-pushnotifications.svg)](https://www.npmjs.com/package/node-pushnotifications)
[![npm downloads](https://img.shields.io/npm/dm/node-pushnotifications.svg)](https://www.npmjs.com/package/node-pushnotifications)
[![CI](https://github.com/appfeel/node-pushnotifications/actions/workflows/ci.yml/badge.svg)](https://github.com/appfeel/node-pushnotifications/actions/workflows/ci.yml)
[![Node.js version](https://img.shields.io/node/v/node-pushnotifications.svg)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

```js
const results = await push.send(
  [{ id: androidToken, type: FCM }, { id: iosToken, type: APN }, webSubscription],
  { title: 'Order shipped', body: 'Your order #1234 is on its way', topic: 'com.example.app' }
);
```

## Contents

- [Features](#features)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Usage](#usage)
- [Supported services](#supported-services)
- [Documentation](#documentation)
- [Upgrading](#upgrading)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## Features

- Mix Android, iOS, web, Windows and Amazon devices in one `send()` call
- Get the same result shape from every service, so you handle failures once
- Built on the official SDKs: `firebase-admin`, `@parse/node-apn` and `web-push`
- APNs token (`.p8`) and certificate auth
- Silent pushes on iOS and Android
- Promise and callback APIs

## Installation

```bash
npm install node-pushnotifications
```

Node.js 20 or later is required. The package is CommonJS, and it works with both `require` and `import`.

## Quick start

```js
import { readFileSync } from 'node:fs';
import PushNotifications, { FCM, APN } from 'node-pushnotifications';

const push = new PushNotifications({
  fcm: {
    appName: 'my-app',
    serviceAccountKey: JSON.parse(readFileSync('./firebase-service-account.json', 'utf8')),
  },
  apn: {
    token: { key: './AuthKey_ABC123DEFG.p8', keyId: 'ABC123DEFG', teamId: 'TEAM123456' },
    production: process.env.NODE_ENV === 'production',
  },
});

const results = await push.send(
  [
    { id: '<android-fcm-token>', type: FCM },
    { id: '<ios-apns-token>', type: APN },
  ],
  {
    title: 'Order shipped',
    body: 'Your order #1234 is on its way',
    topic: 'com.example.app', // your iOS bundle ID, required for APNs
    custom: { orderId: '1234' },
  }
);

for (const { method, success, failure } of results) {
  console.log(`${method}: ${success} sent, ${failure} failed`);
}
```

With CommonJS, use `const PushNotifications = require('node-pushnotifications')` and read the constants from it, for example `PushNotifications.FCM`.

## Usage

### Settings

Pass a settings object with a key for each service you use. You can leave out the services you don't need.

```js
const push = new PushNotifications({
  fcm: {/* Firebase credentials */},
  apn: {/* APNs key or certificate */},
  web: {/* VAPID keys */},
  wns: {/* Windows credentials */},
  adm: {/* Amazon credentials */},
  isAlwaysUseFCM: false,
});
```

Each service's guide lists its options and explains how to get the credentials: [FCM](docs/fcm.md), [APNs](docs/apns.md), [Web Push](docs/web-push.md), [WNS](docs/wns.md) and [ADM](docs/adm.md).

With `isAlwaysUseFCM: true`, every destination except Web Push subscriptions is sent through FCM.

Settings are merged with the defaults one level deep. If you pass `apn`, it replaces the whole default `apn` object. To change settings later, call `push.setOptions(settings)`, which also reconnects to APNs.

### Destinations

A destination is an object with the device's token and its service. You can mix services in one call.

```js
import { FCM, APN, WNS, ADM } from 'node-pushnotifications';

const devices = [
  { id: '<fcm-token>', type: FCM },
  { id: '<apns-device-token>', type: APN },
  { id: 'https://db5.notify.windows.com/?token=...', type: WNS },
  { id: 'amzn1.adm-registration.v3...', type: ADM },
  { endpoint: 'https://...', keys: { p256dh: '<key>', auth: '<secret>' } },
];
```

The last entry is a Web Push subscription, the object your service worker gets from `pushManager.subscribe()`. Any object that doesn't have both `id` and `type` is treated as one.

<details>
<summary>Plain string tokens</summary>

Plain strings still work, but we don't recommend them. The library has to guess the service from the token's format, and token formats can change. It checks these rules in order:

| Rule                             | Service                                |
| -------------------------------- | -------------------------------------- |
| `isAlwaysUseFCM` is `true`       | `fcm`                                  |
| Starts with `http`               | `wns`                                  |
| Matches `/^(amzn[0-9]*.adm)/i`   | `adm`                                  |
| 64 or 160 hexadecimal characters | `apn`                                  |
| Longer than 64 characters        | `fcm`                                  |
| Anything else                    | `unknown`, which is reported as failed |

</details>

### Sending

`send()` returns a promise. You can also pass a Node-style callback as the third argument.

```js
const results = await push.send(devices, data);

push.send(devices, data, (err, results) => {});
```

The promise is returned even when you pass a callback, and it rejects when a service fails. If you only use the callback, add `.catch(() => {})` so the rejection isn't reported as unhandled.

`data` is one object for all services, and each service uses the fields that apply to it. A typical notification looks like this:

```js
const data = {
  title: 'New message',
  body: 'You have a new message from Ana',
  topic: 'com.example.app',
  custom: { conversationId: '42' },
  badge: 3,
  sound: 'default',
};
```

The [payload reference](docs/payload.md) lists every field.

### Results

`send()` resolves to an array with one entry for each service it used:

```js
[
  {
    method: 'fcm',
    success: 1,
    failure: 1,
    message: [
      {
        regId: '<token>',
        originalRegId: '<token>',
        messageId: 'projects/my-app/messages/0:1700...',
        error: null,
      },
      {
        regId: '<expired-token>',
        originalRegId: '<expired-token>',
        error: FirebaseMessagingError,
        errorMsg: 'Requested entity was not found.',
      },
    ],
  },
  { method: 'apn', success: 1, failure: 0, message: [{ regId: '<token>', error: null }] },
];
```

`success` counts the notifications the service accepted. It doesn't confirm that they reached the device. `method` is one of `'fcm'`, `'apn'`, `'webPush'`, `'wns'` or `'adm'`. `originalRegId` and `messageId` are only set for FCM.

When a single device fails, the promise still resolves, and that device's entry has an `error`. This is how you find tokens to delete:

```js
const stale = results
  .flatMap((r) => r.message)
  .filter((m) => m.error?.code === 'messaging/registration-token-not-registered')
  .map((m) => m.regId);
```

When a whole service fails, for example because of wrong APNs credentials or an FCM network error, the promise rejects. The results from the other services are lost in that case.

Destinations that the library can't route come back in an entry with `method: 'unknown'`. If you pass no destinations, nothing is sent and you get a single entry with `method: 'none'`.

## Supported services

| Service                                                                                                                                    | Platforms                         | You need                        | Guide                        |
| ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- | ------------------------------- | ---------------------------- |
| [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)                                                               | Android, iOS with Firebase        | A Firebase service account      | [FCM](docs/fcm.md)           |
| [Apple Push Notification service](https://developer.apple.com/documentation/usernotifications)                                             | iOS, iPadOS, macOS, watchOS, tvOS | An APNs key or certificate      | [APNs](docs/apns.md)         |
| [Web Push](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)                                                                      | Browsers                          | A VAPID key pair                | [Web Push](docs/web-push.md) |
| [Windows Push Notification Services](https://learn.microsoft.com/en-us/windows/apps/develop/notifications/push-notifications/wns-overview) | Windows                           | A package SID and client secret | [WNS](docs/wns.md)           |
| [Amazon Device Messaging](https://developer.amazon.com/docs/adm/overview.html)                                                             | Fire TV, Fire tablets, Vega OS    | An ADM client ID and secret     | [ADM](docs/adm.md)           |

## Documentation

- [Payload reference](docs/payload.md): every `data` field, by service
- Service guides: [FCM](docs/fcm.md), [APNs](docs/apns.md), [Web Push](docs/web-push.md), [WNS](docs/wns.md), [ADM](docs/adm.md)
- [Release notes](https://github.com/appfeel/node-pushnotifications/releases)
- Examples: [React Native app](https://github.com/alex-friedl/crossplatform-push-notifications-example), [Web Push client and server](https://github.com/alex-friedl/webpush-example)

## Upgrading

- Version 6 requires Node.js 20 or later.
- Version 5 removed GCM. Android notifications now go through FCM, so replace `settings.gcm` with `settings.fcm`.

## Contributing

Bug reports and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) to get started, and use [GitHub Issues](https://github.com/appfeel/node-pushnotifications/issues) for bugs and questions.

## Security

Please report vulnerabilities privately, as described in [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © [AppFeel](https://github.com/appfeel)
