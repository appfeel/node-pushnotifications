# Payload reference

These are the fields of `data` that the library reads. Pass one `data` object to `send()`, and each service uses the fields that apply to it.

In this document, iOS means APNs as well as the `apns` part of FCM messages.

## Common fields

| Field                         | Services       | Description                                                                                                                                  |
| ----------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`, `body`               | FCM, APNs      | The notification title and text.                                                                                                             |
| `custom`                      | FCM, APNs, ADM | Your own key/value data. See [Custom data](#custom-data).                                                                                    |
| `topic`                       | iOS            | Your app's bundle ID. APNs requires it.                                                                                                      |
| `priority`                    | FCM, APNs      | Either `'high'` (the default) or `'normal'`. APNs receives 10 or 5.                                                                          |
| `badge`                       | FCM, APNs      | The app icon badge count. On Android it is used when `notificationCount` is not set.                                                         |
| `sound`                       | FCM, APNs      | A sound file name, or `'default'`.                                                                                                           |
| `collapseKey`                 | FCM, APNs      | Notifications with the same key replace each other. It is sent as `collapseKey` on Android and as `apns-collapse-id` on iOS.                 |
| `contentAvailable`            | iOS            | Set to `true` to wake the app in the background.                                                                                             |
| `silent`                      | FCM, APNs      | Sends a background push. See [Silent notifications](#silent-notifications).                                                                  |
| `timeToLive`                  | FCM, APNs, ADM | How long the service keeps trying to deliver, in seconds. The default is 28 days.                                                            |
| `expiry`                      | FCM, APNs, ADM | A Unix timestamp in seconds after which the notification is dropped. It takes precedence over `timeToLive`. For FCM it is capped at 28 days. |
| `clickAction`                 | FCM, APNs      | The Android click action. On iOS it is used as the category when `category` is not set.                                                      |
| `locKey`, `locArgs`           | FCM, APNs      | The localization key and arguments for the body. Pass `locArgs` as a JSON string array, for example `'["Ana"]'`.                             |
| `titleLocKey`, `titleLocArgs` | FCM, APNs      | The localization key and arguments for the title. Pass `titleLocArgs` as a JSON string array.                                                |

### Custom data

`custom` is delivered to your app as data:

- FCM sends it as the message `data`. FCM only accepts strings, so other values are JSON-stringified.
- APNs adds it to the notification payload next to `aps`.
- ADM merges it into the message `data`.

### Silent notifications

With `silent: true`, the notification is delivered to your app without being shown:

- On iOS, `badge`, `sound` and `alert` are removed and the priority is set to 5, as Apple requires. Also set `contentAvailable: true`, and `pushType: 'background'` for iOS 13 and later.
- On Android, the `notification` block is left out, so FCM sends a data-only message.

## Android (FCM)

These fields map to Firebase's [`AndroidConfig`](https://firebase.google.com/docs/reference/admin/node/firebase-admin.messaging.androidconfig) and [`AndroidNotification`](https://firebase.google.com/docs/reference/admin/node/firebase-admin.messaging.androidnotification). See the Firebase docs for details on each one.

| Field                   | Maps to                              | Description                                                                           |
| ----------------------- | ------------------------------------ | ------------------------------------------------------------------------------------- |
| `icon`                  | `notification.icon`                  | The name of a drawable resource.                                                      |
| `image`, `picture`      | `notification.imageUrl`              | The URL of an image to show.                                                          |
| `color`                 | `notification.color`                 | The icon color, as `#rrggbb`.                                                         |
| `tag`                   | `notification.tag`                   | Replaces an existing notification with the same tag.                                  |
| `android_channel_id`    | `notification.channelId`             | The notification channel.                                                             |
| `notificationCount`     | `notification.notificationCount`     | The unread count. Falls back to `badge`.                                              |
| `notificationPriority`  | `notification.priority`              | One of `'min'`, `'low'`, `'default'`, `'high'` or `'max'`.                            |
| `visibility`            | `notification.visibility`            | One of `'public'`, `'private'` or `'secret'`.                                         |
| `ticker`                | `notification.ticker`                | Text read out by accessibility services.                                              |
| `sticky`                | `notification.sticky`                | Keeps the notification after the user taps it.                                        |
| `localOnly`             | `notification.localOnly`             | Keeps the notification off Wear OS devices.                                           |
| `eventTimestamp`        | `notification.eventTimestamp`        | A `Date` for when the event happened.                                                 |
| `vibrateTimingsMillis`  | `notification.vibrateTimingsMillis`  | A vibration pattern, as an array of milliseconds.                                     |
| `defaultVibrateTimings` | `notification.defaultVibrateTimings` | Uses the system's default vibration.                                                  |
| `defaultSound`          | `notification.defaultSound`          | Uses the system's default sound.                                                      |
| `lightSettings`         | `notification.lightSettings`         | LED color and timing.                                                                 |
| `defaultLightSettings`  | `notification.defaultLightSettings`  | Uses the system's default LED settings.                                               |
| `proxy`                 | `notification.proxy`                 | Whether Google Play services may proxy the notification. This is not a network proxy. |
| `restrictedPackageName` | `android.restrictedPackageName`      | Only delivers to the app with this package name.                                      |
| `directBootOk`          | `android.directBootOk`               | Allows delivery while the device is in direct boot mode.                              |
| `analyticsLabel`        | `android.fcmOptions.analyticsLabel`  | A label for FCM analytics. You can also pass `fcmOptions: { analyticsLabel }`.        |
| `fcm_notification`      | `android.notification`               | Used as the notification as-is, instead of building it from the fields above.         |
| `providersExclude`      | the FCM message                      | Pass `['apns']` or `['android']` to leave that part out of the FCM message.           |

## iOS

These fields map to [node-apn's `Notification`](https://github.com/parse-community/node-apn/blob/master/doc/notification.markdown). See Apple's [payload key reference](https://developer.apple.com/documentation/usernotifications/generating-a-remote-notification) for what each one does.

| Field               | Description                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| `alert`             | A string or an object such as `{ title, subtitle, body }`. When set, it replaces `title` and `body`. |
| `category`          | The notification category, for actionable notifications.                                             |
| `threadId`          | Groups related notifications together.                                                               |
| `mutableContent`    | Set to `1` to let a Notification Service Extension change the notification.                          |
| `pushType`          | The `apns-push-type`, for example `'alert'`, `'background'`, `'voip'` or `'liveactivity'`.           |
| `interruptionLevel` | One of `'passive'`, `'active'`, `'time-sensitive'` or `'critical'`.                                  |
| `launchImage`       | The launch image file name.                                                                          |
| `action`            | The alert's action button text (legacy).                                                             |
| `urlArgs`           | URL arguments for Safari push notifications.                                                         |
| `mdm`               | The push magic string for MDM notifications.                                                         |
| `truncateAtWordEnd` | Truncates the alert at a word boundary when the payload is too large.                                |
| `encoding`          | The payload encoding.                                                                                |
| `retries`           | How many times node-apn retries a failed request.                                                    |
| `bodyLocArgs`       | Another name for `locArgs`.                                                                          |
| `rawPayload`        | A complete APNs payload. It replaces everything built from the other fields.                         |

## Web Push

The whole `data` value is the payload. Strings are sent as they are, and anything else is JSON-stringified. Your service worker receives it in its `push` event.

## WNS

`data` is passed to the `wns` function named in `settings.wns.notificationMethod`, so its fields depend on that function. For example, `sendToastText02` reads `text1` and `text2`.

`headers`, `launch` and `duration` are taken out of `data` and override the matching `settings.wns` options. This doesn't happen with `sendRaw`, which sends the whole `data` as a JSON string.

## ADM

- `consolidationKey` becomes the ADM `consolidationKey`.
- `expiry` or `timeToLive` becomes `expiresAfter`.
- Every other field, together with the contents of `custom`, becomes the ADM `data`.
