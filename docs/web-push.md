# Web Push

Web Push delivers to browsers through the standard [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API). node-pushnotifications sends through [`web-push`](https://github.com/web-push-libs/web-push) and authenticates with [VAPID](https://datatracker.ietf.org/doc/html/rfc8292).

## Credentials

Generate a VAPID key pair once and keep it:

```bash
npx web-push generate-vapid-keys
```

Put both keys in your settings:

```js
const push = new PushNotifications({
  web: {
    vapidDetails: {
      subject: 'mailto:you@example.com',
      publicKey: '<VAPID public key>',
      privateKey: '<VAPID private key>',
    },
    TTL: 2419200,
    contentEncoding: 'aes128gcm',
  },
});
```

In the browser, pass the public key to `pushManager.subscribe({ applicationServerKey })`.

## Settings

`settings.web` is passed to `web-push`'s [`sendNotification`](https://github.com/web-push-libs/web-push#sendnotificationpushsubscription-payload-options) as its options, so `TTL`, `headers`, `contentEncoding`, `urgency` and `proxy` all work.

## Sending

The destination is the `PushSubscription` your service worker got from `pushManager.subscribe()`:

```js
await push.send([{ endpoint: 'https://...', keys: { p256dh: '<key>', auth: '<secret>' } }], {
  title: 'New message',
  body: 'You have a new message from Ana',
});
```

The whole `data` value is the payload. Strings are sent as they are, and anything else is JSON-stringified. Your service worker receives it in its `push` event and decides how to show it.

## Proxies

Set `proxy` in `settings.web`.

## Example

[alex-friedl/webpush-example](https://github.com/alex-friedl/webpush-example) has a complete client and server.
