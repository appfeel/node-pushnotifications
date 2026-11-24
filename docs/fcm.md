# FCM

Firebase Cloud Messaging delivers to Android apps, and to iOS apps that use the Firebase SDK. node-pushnotifications sends through [`firebase-admin`](https://firebase.google.com/docs/admin/setup) with `sendEachForMulticast`, in batches of 500 tokens.

Each FCM message carries both an `android` and an `apns` part. That way the same token list works for Android devices and for iOS devices registered with Firebase.

## Credentials

In the Firebase console, open **Project settings > Service accounts** and generate a private key. Pass the JSON file's contents as `serviceAccountKey`:

```js
const push = new PushNotifications({
  fcm: {
    appName: 'my-app',
    serviceAccountKey: require('./firebase-service-account.json'),
  },
});
```

On Google Cloud you can use the runtime's credentials instead:

```js
import { applicationDefault } from 'firebase-admin/app';

const push = new PushNotifications({
  fcm: { appName: 'my-app', credential: applicationDefault(), projectId: 'my-project' },
});
```

## Settings

These options go in `settings.fcm`. Most are passed on to Firebase's [`AppOptions`](https://firebase.google.com/docs/reference/admin/node/firebase-admin.app.appoptions).

| Option                         | Description                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `appName`                      | The name of the Firebase app instance the library creates.                   |
| `serviceAccountKey`            | The contents of a service account JSON file. Use this or `credential`.       |
| `credential`                   | A `firebase-admin` credential. It takes precedence over `serviceAccountKey`. |
| `projectId`                    | The Google Cloud project ID.                                                 |
| `databaseURL`                  | The Realtime Database URL.                                                   |
| `storageBucket`                | The Cloud Storage bucket.                                                    |
| `serviceAccountId`             | The service account email.                                                   |
| `databaseAuthVariableOverride` | The `auth` override for Realtime Database rules.                             |
| `httpAgent`                    | Passed to Firebase. It does not apply to FCM sends, see [Proxies](#proxies). |
| `phonegap`                     | Set to `true` to send data-only messages for the legacy Cordova push plugin. |

## The generated message

Your `custom` fields become the message `data`. For compatibility with older client plugins, the Android `data` also gets `title`, `message` (the body), `sound`, `icon` and `msgcnt` (the badge). FCM only accepts strings in `data`, so all values are converted.

For example, this `data`:

```js
{
  title: 'Order shipped',
  body: 'Your order #1234 is on its way',
  topic: 'com.example.app',
  sound: 'default',
  badge: 1,
  collapseKey: 'order-1234',
  timeToLive: 3600,
  custom: { orderId: 1234, screen: 'orders' },
}
```

produces this FCM message:

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

See the [payload reference](payload.md#android-fcm) for every Android field.

## Errors

Each failed device in `message[]` carries the original `firebase-admin` error, including its [`code`](https://firebase.google.com/docs/cloud-messaging/manage-tokens#detect-invalid-token-responses-from-the-fcm-backend). Use `messaging/registration-token-not-registered` to find tokens you should delete.

If a whole batch fails, for example because of a network or authentication error, `send()` rejects.

## Topics and conditions

Sending to FCM topics or conditions is not supported at the moment. The library sends every FCM message with `sendEachForMulticast`, which requires device tokens.

## Proxies

`firebase-admin` sends FCM messages over HTTP/2 and doesn't use an HTTP agent for them, so FCM sends can't go through a proxy at the moment. `settings.fcm.httpAgent` is passed to Firebase, but it only applies to the SDK's HTTP/1.1 requests.
