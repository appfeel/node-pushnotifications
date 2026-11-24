# ADM

[Amazon Device Messaging](https://developer.amazon.com/docs/adm/overview.html) delivers to Fire TV and Fire tablets (except the first-generation Kindle Fire), and to [Vega OS](https://developer.amazon.com/docs/vega-api/2.0/README.amazon-devices_kepler-amazon-device-messaging) apps. node-pushnotifications sends through [`node-adm`](https://github.com/umano/node-adm).

## Credentials

Create a security profile in the Amazon Developer Console and use its client ID and secret:

```js
const push = new PushNotifications({
  adm: {
    client_id: '<ADM client id>',
    client_secret: '<ADM client secret>',
  },
});
```

## Sending

The destination is the registration ID your app got from ADM:

```js
await push.send([{ id: 'amzn1.adm-registration.v3...', type: ADM }], {
  title: 'New message',
  body: 'You have a new message from Ana',
  consolidationKey: 'messages',
});
```

The ADM message is built from `data` like this:

- `consolidationKey` becomes the ADM `consolidationKey`.
- `expiry` or `timeToLive` becomes `expiresAfter`. The default is 28 days.
- Every other field, together with the contents of `custom`, becomes the ADM `data`.
