# APNs

The Apple Push Notification service delivers to iOS, iPadOS, macOS, watchOS and tvOS apps. node-pushnotifications sends through [`@parse/node-apn`](https://github.com/parse-community/node-apn) over HTTP/2.

## Credentials

Use token-based authentication. In your Apple Developer account, create a key under [Certificates, Identifiers & Profiles > Keys](https://developer.apple.com/account/resources/authkeys/list) and download the `.p8` file. One key works for all your apps and doesn't expire. Apple explains the details in [Establishing a token-based connection to APNs](https://developer.apple.com/documentation/usernotifications/establishing-a-token-based-connection-to-apns).

```js
const push = new PushNotifications({
  apn: {
    token: {
      key: './AuthKey_ABC123DEFG.p8', // a path, or the key as a Buffer or string
      keyId: 'ABC123DEFG',
      teamId: 'TEAM123456',
    },
    production: process.env.NODE_ENV === 'production',
  },
});
```

Certificates still work too. Pass `cert` and `key`, or `pfx` and `passphrase`, instead of `token`.

## Settings

`settings.apn` is passed to node-apn's [`Provider`](https://github.com/parse-community/node-apn/blob/master/doc/provider.markdown), so all its options are available. The ones you'll usually need:

- `token` or `cert`/`key`: your credentials.
- `production`: `true` sends to Apple's production servers, `false` to the sandbox. Development builds can only receive from the sandbox.
- `proxy`: see [Proxies](#proxies).

The library opens the APNs connection when you create `PushNotifications` and keeps it open. Create one instance and reuse it.

## Sending

Every APNs notification needs a `topic`, which is your app's bundle ID. Apple covers the request format in [Sending notification requests to APNs](https://developer.apple.com/documentation/usernotifications/sending-notification-requests-to-apns).

```js
await push.send([{ id: '<apns-device-token>', type: APN }], {
  topic: 'com.example.app',
  title: 'Order shipped',
  body: 'Your order #1234 is on its way',
  badge: 1,
});
```

See the [payload reference](payload.md#ios) for every iOS field.

## Silent notifications

A silent notification wakes your app in the background without showing anything. Set `silent`, `contentAvailable` and `pushType`:

```js
await push.send(iosDevices, {
  topic: 'com.example.app',
  silent: true,
  contentAvailable: true,
  pushType: 'background',
  custom: { syncId: 'abc' },
});
```

The library removes `badge`, `sound` and `alert` and lowers the priority to 5, as Apple requires.

## Errors

When Apple rejects a device, its entry in `message[]` has Apple's [`reason`](https://developer.apple.com/documentation/usernotifications/handling-notification-responses-from-apns) as the error message, for example `BadDeviceToken` or `Unregistered`.

If node-apn can't create a provider from your settings, `send()` rejects with that error.

## Proxies

Set node-apn's `proxy` option:

```js
apn: {
  token: { /* ... */ },
  proxy: { host: 'proxy.internal', port: 3128 },
}
```
