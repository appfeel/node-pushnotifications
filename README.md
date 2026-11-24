# node-pushnotifications

**Push notifications for [Node.js](https://nodejs.org). One API for FCM, APNs, Web Push, WNS and ADM.**

[![npm version](https://img.shields.io/npm/v/node-pushnotifications.svg)](https://www.npmjs.com/package/node-pushnotifications)
[![npm downloads](https://img.shields.io/npm/dm/node-pushnotifications.svg)](https://www.npmjs.com/package/node-pushnotifications)
[![CI](https://github.com/appfeel/node-pushnotifications/actions/workflows/ci.yml/badge.svg)](https://github.com/appfeel/node-pushnotifications/actions/workflows/ci.yml)
[![Node.js version](https://img.shields.io/node/v/node-pushnotifications.svg)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

```js
const results = await push.send([androidToken, iosToken, webSubscription], {
  title: 'Order shipped',
  body: 'Your order #1234 is on its way',
  topic: 'com.example.app', // iOS bundle ID
});
```

## Contents

- [Features](#features)
- [Supported services](#supported-services)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Usage](#usage)
- [Payload reference](#payload-reference)
- [Service guides](#service-guides): [FCM](#fcm) · [APNs](#apns) · [Web Push](#web-push) · [WNS](#wns) · [ADM](#adm)
- [Proxy support](#proxy-support)
- [Upgrading](#upgrading)
- [Contributing](#contributing) · [Security](#security) · [License](#license)

## Features

- One `send()` for every service, sent in parallel
- Routing by token type
- One result format for all services
- Built on the official SDKs: [`firebase-admin`](https://github.com/firebase/firebase-admin-node), [`@parse/node-apn`](https://github.com/parse-community/node-apn), [`web-push`](https://github.com/web-push-libs/web-push)
- APNs token (`.p8`) and certificate auth
- FCM batching, topics and conditions
- Silent pushes on iOS and Android
- Promise and callback APIs
- Proxy support

## Supported services

| Service                                                                                                                                    | Platforms                         | Library                                                           | `type` constant     |
| ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- | ----------------------------------------------------------------- | ------------------- |
| [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)                                                               | Android, iOS (via Firebase)       | [firebase-admin](https://github.com/firebase/firebase-admin-node) | `FCM` (`'fcm'`)     |
| [Apple Push Notification service](https://developer.apple.com/documentation/usernotifications)                                             | iOS, iPadOS, macOS, watchOS, tvOS | [@parse/node-apn](https://github.com/parse-community/node-apn)    | `APN` (`'apn'`)     |
| [Web Push](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)                                                                      | Browsers with the Push API        | [web-push](https://github.com/web-push-libs/web-push)             | `WEB` (`'webPush'`) |
| [Windows Push Notification Services](https://learn.microsoft.com/en-us/windows/apps/develop/notifications/push-notifications/wns-overview) | Windows apps                      | [wns](https://github.com/tjanczuk/wns)                            | `WNS` (`'wns'`)     |
| [Amazon Device Messaging](https://developer.amazon.com/docs/adm/overview.html)                                                             | Fire TV, Fire tablets, Vega OS    | [node-adm](https://github.com/umano/node-adm)                     | `ADM` (`'adm'`)     |

## Installation

```bash
npm install node-pushnotifications
```

Requires Node.js 20 or later. CI tests Node.js 20, 22, 24 and 26.

```js
// ESM
import PushNotifications, { FCM, APN, WEB, WNS, ADM } from 'node-pushnotifications';

// CommonJS
const PushNotifications = require('node-pushnotifications');
const { FCM, APN, WEB, WNS, ADM } = PushNotifications;
```

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
    topic: 'com.example.app', // required for APNs
    custom: { orderId: '1234' },
  }
);

for (const { method, success, failure } of results) {
  console.log(`${method}: ${success} sent, ${failure} failed`);
}
```

## Usage

### Settings

Only include the services you use.

```js
const push = new PushNotifications({
  fcm: {
    appName: 'my-app',
    serviceAccountKey: require('./firebase-service-account.json'), // or `credential`
  },
  apn: {
    token: {
      key: './certs/AuthKey_ABC123DEFG.p8', // path, Buffer or string
      keyId: 'ABC123DEFG',
      teamId: 'TEAM123456',
    },
    production: false, // false = sandbox
  },
  web: {
    vapidDetails: {
      subject: 'mailto:you@example.com',
      publicKey: '<VAPID public key>',
      privateKey: '<VAPID private key>',
    },
    TTL: 2419200,
    contentEncoding: 'aes128gcm',
  },
  wns: {
    client_id: '<package SID>',
    client_secret: '<client secret>',
    notificationMethod: 'sendTileSquareBlock',
  },
  adm: {
    client_id: '<ADM client id>',
    client_secret: '<ADM client secret>',
  },
  isAlwaysUseFCM: false, // true: send typed and string tokens through FCM
});
```

Each block is passed to the underlying library:

| Key   | Options                                                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `fcm` | See [FCM](#fcm)                                                                                                                             |
| `apn` | [`apn.Provider` options](https://github.com/parse-community/node-apn/blob/master/doc/provider.markdown)                                     |
| `web` | [`web-push` options](https://github.com/web-push-libs/web-push#sendnotificationpushsubscription-payload-options)                            |
| `wns` | [`wns` options](https://github.com/tjanczuk/wns), plus `notificationMethod`: the `wns` function to call (`sendToastText01`, `sendRaw`, ...) |
| `adm` | [`node-adm` options](https://github.com/umano/node-adm)                                                                                     |

Settings are merged shallowly with the defaults: passing `apn: {...}` replaces the whole default `apn` object. `push.setOptions(settings)` replaces the settings and reconnects to APNs.

### Destinations

Pass one destination or an array. Different services can be mixed.

```js
import { FCM, APN, WNS, ADM } from 'node-pushnotifications';

const devices = [
  { id: '<fcm-token>', type: FCM },
  { id: '<apns-device-token>', type: APN },
  { id: 'https://db5.notify.windows.com/?token=...', type: WNS },
  { id: 'amzn1.adm-registration.v3...', type: ADM },
  // Web Push: the PushSubscription from pushManager.subscribe()
  { endpoint: 'https://...', keys: { p256dh: '<key>', auth: '<secret>' } },
];
```

Objects without both `id` and `type` are treated as Web Push subscriptions. With `isAlwaysUseFCM: true`, everything except Web Push subscriptions goes through FCM.

<details>
<summary>Plain string tokens (legacy, not recommended)</summary>

Strings are still accepted. The service is guessed from the format, checked in this order:

| Rule                           | Service                                 |
| ------------------------------ | --------------------------------------- |
| `isAlwaysUseFCM` is `true`     | `fcm`                                   |
| starts with `http`             | `wns`                                   |
| matches `/^(amzn[0-9]*.adm)/i` | `adm`                                   |
| 64 or 160 hex characters       | `apn`                                   |
| longer than 64 characters      | `fcm`                                   |
| anything else                  | `unknown` (not sent, counted as failed) |

</details>

### Sending

```js
// Promise
const results = await push.send(devices, data);

// Callback
push.send(devices, data, (err, results) => {});
```

`send()` returns a promise even when a callback is given. If you only use the callback, add `.catch(() => {})` to avoid unhandled rejections.

`data` is shared by all services. Each service reads the fields it supports (see [Payload reference](#payload-reference)):

```js
const data = {
  title: 'New message',
  body: 'You have a new message from Ana',
  topic: 'com.example.app', // required for APNs
  custom: { conversationId: '42' },
  badge: 3,
  sound: 'default',
};
```

#### FCM topics and conditions

```js
await push.send([{ id: 'topic', type: FCM }], {
  title: 'Breaking news',
  body: 'Something happened',
  recipients: { to: 'news' },
  // or: recipients: { condition: "'sports' in topics || 'news' in topics" },
});
```

At least one destination must be an FCM destination, otherwise FCM is not called. Its `id` is ignored when `recipients` is set. An empty destination list resolves to `[{ method: 'none', success: 0, failure: 0, message: [] }]`.

### Results

`send()` resolves to one entry per service used:

```js
[
  {
    method: 'fcm', // 'fcm' | 'apn' | 'webPush' | 'wns' | 'adm' | 'unknown' | 'none'
    success: 1, // accepted by the service (not a delivery receipt)
    failure: 1,
    message: [
      {
        regId: '<token>',
        originalRegId: '<token>', // FCM only, same as regId
        messageId: 'projects/my-app/messages/0:1700...', // FCM only, set on success
        error: null,
      },
      {
        regId: '<expired-token>',
        originalRegId: '<expired-token>',
        error: FirebaseMessagingError, // .code: 'messaging/registration-token-not-registered'
        errorMsg: 'Requested entity was not found.',
      },
    ],
  },
  { method: 'apn', success: 1, failure: 0, message: [{ regId: '<token>', error: null }] },
];
```

Per-device failures are reported in `message[]` and do not reject. To remove invalid FCM tokens:

```js
const stale = results
  .flatMap((r) => r.message)
  .filter((m) => m.error?.code === 'messaging/registration-token-not-registered')
  .map((m) => m.regId);
```

FCM errors are the original `firebase-admin` errors with their [`code`](https://firebase.google.com/docs/cloud-messaging/manage-tokens#detect-invalid-token-responses-from-the-fcm-backend). APNs errors use Apple's [`reason`](https://developer.apple.com/documentation/usernotifications/handling-notification-responses-from-apns) (`BadDeviceToken`, `Unregistered`, ...) as the message.

Service-level failures reject the promise and call the callback with `err`, for example invalid APNs credentials or an FCM network error. Services are combined with `Promise.all`, so one failing service rejects the whole call. For FCM, one failed batch of 500 rejects the whole call.

Destinations that can't be routed are returned under `method: 'unknown'` with `error: Error('Unknown registration id')`.

## Payload reference

All `data` fields the library reads. "iOS" means APNs and the `apns` part of FCM messages.

### Common

| Field                         | Services       | Description                                                                                          |
| ----------------------------- | -------------- | ---------------------------------------------------------------------------------------------------- |
| `title`, `body`               | FCM, APNs      | Notification title and text.                                                                         |
| `custom`                      | FCM, APNs, ADM | Your data. FCM: `data` (values stringified). APNs: payload. ADM: merged into `data`.                 |
| `topic`                       | iOS            | Required for APNs. Your bundle ID.                                                                   |
| `priority`                    | FCM, APNs      | `'high'` (default) or `'normal'`. APNs: 10 or 5.                                                     |
| `badge`                       | FCM, APNs      | Badge count. Android: fallback for `notificationCount`.                                              |
| `sound`                       | FCM, APNs      | Sound file name or `'default'`.                                                                      |
| `collapseKey`                 | FCM, APNs      | Android `collapseKey`, iOS `apns-collapse-id`.                                                       |
| `contentAvailable`            | iOS            | `true` sets `content-available: 1`.                                                                  |
| `silent`                      | FCM, APNs      | Background push. iOS: drops `badge`, `sound`, `alert`, priority 5. Android: no `notification` block. |
| `timeToLive`                  | FCM, APNs, ADM | Seconds. Default 28 days (2419200).                                                                  |
| `expiry`                      | FCM, APNs, ADM | Unix timestamp in seconds. Overrides `timeToLive`. FCM TTL is capped at 28 days.                     |
| `clickAction`                 | FCM, APNs      | Android click action. iOS: fallback for `category`.                                                  |
| `locKey`, `locArgs`           | FCM, APNs      | Localized body key and args (`locArgs` as a JSON string array, e.g. `'["Ana"]'`).                    |
| `titleLocKey`, `titleLocArgs` | FCM, APNs      | Localized title key and args (JSON string array).                                                    |

### Android (FCM)

Reference: [`AndroidConfig`](https://firebase.google.com/docs/reference/admin/node/firebase-admin.messaging.androidconfig), [`AndroidNotification`](https://firebase.google.com/docs/reference/admin/node/firebase-admin.messaging.androidnotification).

<details>
<summary>All Android fields</summary>

| Field                   | Maps to                              | Notes                                                           |
| ----------------------- | ------------------------------------ | --------------------------------------------------------------- |
| `icon`                  | `notification.icon`                  | Drawable name.                                                  |
| `image`, `picture`      | `notification.imageUrl`              | Image URL.                                                      |
| `color`                 | `notification.color`                 | `#rrggbb`.                                                      |
| `tag`                   | `notification.tag`                   | Replaces a notification with the same tag.                      |
| `android_channel_id`    | `notification.channelId`             | Notification channel.                                           |
| `notificationCount`     | `notification.notificationCount`     | Falls back to `badge`.                                          |
| `notificationPriority`  | `notification.priority`              | `'min'`, `'low'`, `'default'`, `'high'`, `'max'`.               |
| `visibility`            | `notification.visibility`            | `'public'`, `'private'`, `'secret'`.                            |
| `ticker`                | `notification.ticker`                | Accessibility text.                                             |
| `sticky`                | `notification.sticky`                | Keep after tap.                                                 |
| `localOnly`             | `notification.localOnly`             | Don't bridge to Wear OS.                                        |
| `eventTimestamp`        | `notification.eventTimestamp`        | `Date`.                                                         |
| `vibrateTimingsMillis`  | `notification.vibrateTimingsMillis`  | Array of milliseconds.                                          |
| `defaultVibrateTimings` | `notification.defaultVibrateTimings` | System default vibration.                                       |
| `defaultSound`          | `notification.defaultSound`          | System default sound.                                           |
| `lightSettings`         | `notification.lightSettings`         | LED settings.                                                   |
| `defaultLightSettings`  | `notification.defaultLightSettings`  | System default LED.                                             |
| `proxy`                 | `notification.proxy`                 | `'allow'`, `'deny'`, `'if_priority_lowered'`.                   |
| `restrictedPackageName` | `android.restrictedPackageName`      | Only deliver to this package.                                   |
| `directBootOk`          | `android.directBootOk`               | Deliver in direct boot mode.                                    |
| `analyticsLabel`        | `android.fcmOptions.analyticsLabel`  | Or `fcmOptions: { analyticsLabel }`.                            |
| `fcm_notification`      | `android.notification`               | Used as-is instead of the fields above.                         |
| `providersExclude`      | (message)                            | `['apns']` or `['android']` omits that part of the FCM message. |
| `recipients`            | (message target)                     | `{ to: '<topic>' }` or `{ condition: '...' }`.                  |

</details>

### iOS

Reference: [node-apn `Notification`](https://github.com/parse-community/node-apn/blob/master/doc/notification.markdown), [Apple payload keys](https://developer.apple.com/documentation/usernotifications/generating-a-remote-notification).

| Field               | Description                                                                        |
| ------------------- | ---------------------------------------------------------------------------------- |
| `alert`             | String or object (`{ title, subtitle, body, ... }`). Overrides `title` and `body`. |
| `category`          | Notification category.                                                             |
| `threadId`          | Thread grouping.                                                                   |
| `mutableContent`    | `1` enables a Notification Service Extension.                                      |
| `pushType`          | `'alert'`, `'background'`, `'voip'`, `'liveactivity'`, ...                         |
| `interruptionLevel` | `'passive'`, `'active'`, `'time-sensitive'`, `'critical'`.                         |
| `launchImage`       | Launch image file name.                                                            |
| `action`            | Alert action text (legacy).                                                        |
| `urlArgs`           | Safari push URL arguments.                                                         |
| `mdm`               | MDM push magic.                                                                    |
| `truncateAtWordEnd` | Truncate the alert at a word boundary.                                             |
| `encoding`          | Payload encoding.                                                                  |
| `retries`           | Retry limit.                                                                       |
| `bodyLocArgs`       | Alias for `locArgs`.                                                               |
| `rawPayload`        | Full APNs payload. Replaces everything built from other fields.                    |

### Web Push, WNS, ADM

| Service  | Fields                                                                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web Push | The whole `data` value is the payload (strings as-is, objects JSON-stringified).                                                                      |
| WNS      | `headers`, `launch`, `duration` override `settings.wns`. Other fields go to the `notificationMethod` function. With `sendRaw`, `data` is stringified. |
| ADM      | `consolidationKey`, `expiry`/`timeToLive` (as `expiresAfter`). All other fields plus `custom` become the ADM `data`.                                  |

## Service guides

### FCM

Messages are sent with [`firebase-admin`](https://firebase.google.com/docs/admin/setup) `sendEachForMulticast` in batches of 500. Each message has an `android` and an `apns` part, so the same tokens work for Android and Firebase-based iOS apps.

Get a service account key from the Firebase console (Project settings > Service accounts) and pass it as `serviceAccountKey`, or pass a [`credential`](https://firebase.google.com/docs/reference/admin/node/firebase-admin.app.credential):

```js
import { applicationDefault } from 'firebase-admin/app';

const push = new PushNotifications({
  fcm: { appName: 'my-app', credential: applicationDefault(), projectId: 'my-project' },
});
```

`settings.fcm` options ([`AppOptions`](https://firebase.google.com/docs/reference/admin/node/firebase-admin.app.appoptions)):

| Option                         | Description                                                                 |
| ------------------------------ | --------------------------------------------------------------------------- |
| `appName`                      | Firebase app instance name.                                                 |
| `serviceAccountKey`            | Service account JSON. Use this or `credential`.                             |
| `credential`                   | A `firebase-admin` `Credential`. Takes precedence over `serviceAccountKey`. |
| `projectId`                    | Google Cloud project ID.                                                    |
| `databaseURL`                  | Realtime Database URL.                                                      |
| `storageBucket`                | Cloud Storage bucket.                                                       |
| `serviceAccountId`             | Service account email.                                                      |
| `databaseAuthVariableOverride` | Realtime Database `auth` override.                                          |
| `httpAgent`, `httpsAgent`      | See [Proxy support](#proxy-support).                                        |
| `phonegap`                     | `true`: data-only messages for the legacy Cordova push plugin.              |

`android.data` contains your `custom` fields plus `title`, `message` (body), `sound`, `icon` and `msgcnt` (badge), for older client plugins. All values are strings.

<details>
<summary>Generated FCM message example</summary>

Input: `{ title: 'Order shipped', body: 'Your order #1234 is on its way', topic: 'com.example.app', sound: 'default', badge: 1, collapseKey: 'order-1234', timeToLive: 3600, custom: { orderId: 1234, screen: 'orders' } }`

```json
{
  "data": { "orderId": "1234", "screen": "orders" },
  "android": {
    "collapseKey": "order-1234",
    "priority": "high",
    "ttl": 3600000,
    "data": {
      "orderId": "1234",
      "screen": "orders",
      "title": "Order shipped",
      "message": "Your order #1234 is on its way",
      "sound": "default",
      "msgcnt": "1"
    },
    "notification": {
      "title": "Order shipped",
      "body": "Your order #1234 is on its way",
      "sound": "default",
      "notificationCount": 1
    }
  },
  "apns": {
    "headers": {
      "apns-priority": "10",
      "apns-collapse-id": "order-1234",
      "apns-expiration": "1795560829",
      "apns-topic": "com.example.app"
    },
    "payload": {
      "aps": {
        "badge": 1,
        "sound": "default",
        "alert": { "title": "Order shipped", "body": "Your order #1234 is on its way" }
      }
    }
  },
  "tokens": ["<device-token>"]
}
```

</details>

### APNs

Token auth is recommended. Create a `.p8` key under [Certificates, Identifiers & Profiles > Keys](https://developer.apple.com/account/resources/authkeys/list). One key works for all your apps and doesn't expire. See [Establishing a token-based connection to APNs](https://developer.apple.com/documentation/usernotifications/establishing-a-token-based-connection-to-apns).

```js
apn: {
  token: { key: './AuthKey_ABC123DEFG.p8', keyId: 'ABC123DEFG', teamId: 'TEAM123456' },
  production: true,
}
```

Certificates (`cert`/`key` or `pfx` + `passphrase`) also work, see [`apn.Provider`](https://github.com/parse-community/node-apn/blob/master/doc/provider.markdown).

- `topic` is required: your bundle ID ([details](https://developer.apple.com/documentation/usernotifications/sending-notification-requests-to-apns)).
- `production: false` uses the sandbox, which development builds need.
- The APNs connection is opened in the constructor. Reuse one `PushNotifications` instance.

Silent notifications:

```js
await push.send(iosDevices, {
  topic: 'com.example.app',
  contentAvailable: true,
  silent: true,
  pushType: 'background',
  custom: { syncId: 'abc' },
});
```

### Web Push

Generate VAPID keys once:

```bash
npx web-push generate-vapid-keys
```

Put them in `settings.web.vapidDetails` and pass the public key to `pushManager.subscribe({ applicationServerKey })` in the browser. Full example: [alex-friedl/webpush-example](https://github.com/alex-friedl/webpush-example).

### WNS

`settings.wns.notificationMethod` selects the [`wns`](https://github.com/tjanczuk/wns) function (`sendTileSquareBlock`, `sendToastText02`, `sendBadge`, `sendRaw`, ...). `data` is passed to it.

If `settings.wns.accessToken` is set, notifications are sent one at a time so a renewed token from WNS can be reused. This is slower for many devices.

### ADM

[ADM](https://developer.amazon.com/docs/adm/overview.html) works on Fire TV, Fire tablets (not the 1st-generation Kindle Fire) and [Vega OS](https://developer.amazon.com/docs/vega-api/2.0/README.amazon-devices_kepler-amazon-device-messaging) apps. Get `client_id` and `client_secret` from a Security Profile in the Amazon Developer Console.

## Proxy support

FCM: pass agents in `settings.fcm`.

```js
import { HttpsProxyAgent } from 'https-proxy-agent';

const agent = new HttpsProxyAgent('http://proxy.internal:3128');

const push = new PushNotifications({
  fcm: { appName: 'my-app', serviceAccountKey, httpAgent: agent, httpsAgent: agent },
});
```

APNs: use node-apn's `proxy` option.

```js
apn: {
  token: { /* ... */ },
  proxy: { host: 'proxy.internal', port: 3128 },
}
```

Web Push: set `proxy` in `settings.web`.

The `data.proxy` field is not a network proxy. It is the Android [notification proxy](https://firebase.google.com/docs/reference/admin/node/firebase-admin.messaging.androidnotification#androidnotificationproxy) setting.

## Upgrading

- v6 requires Node.js 20 or later.
- v5 removed GCM (`node-gcm`). Android goes through FCM with `firebase-admin`. Replace `settings.gcm` with `settings.fcm`.

See [GitHub Releases](https://github.com/appfeel/node-pushnotifications/releases) for all changes.

## Examples

- [React Native cross-platform example](https://github.com/alex-friedl/crossplatform-push-notifications-example)
- [Web Push client and server example](https://github.com/alex-friedl/webpush-example)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Bugs and questions go to [GitHub Issues](https://github.com/appfeel/node-pushnotifications/issues).

## Security

Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © [AppFeel](https://github.com/appfeel)
