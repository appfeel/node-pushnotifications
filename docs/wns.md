# WNS

Windows Push Notification Services delivers to Windows apps. node-pushnotifications sends through the [`wns`](https://github.com/tjanczuk/wns) package.

## Credentials

Use your app's package SID as `client_id` and its client secret as `client_secret`.

```js
const push = new PushNotifications({
  wns: {
    client_id: '<package SID>',
    client_secret: '<client secret>',
    notificationMethod: 'sendToastText02',
  },
});
```

## Settings

`notificationMethod` is the name of the `wns` function that sends each notification, for example `sendTileSquareBlock`, `sendToastText02`, `sendBadge` or `sendRaw`. The other options in `settings.wns` are passed to that function.

If you set `accessToken`, notifications are sent one after another, so that a new token issued by WNS can be used for the next request. This is slower when you send to many devices.

## Sending

The destination is the channel URI your app got from Windows:

```js
await push.send([{ id: 'https://db5.notify.windows.com/?token=...', type: WNS }], {
  text1: 'New message',
  text2: 'You have a new message from Ana',
});
```

`data` is passed to the function named in `notificationMethod`, so its fields depend on that function. `headers`, `launch` and `duration` in `data` override the matching settings, except with `sendRaw`, which sends the whole `data` as a JSON string.
