const R = require('ramda');
const { Notification: ApnsMessage } = require('@parse/node-apn');
const { Message: GcmMessage } = require('node-gcm');

const { DEFAULT_TTL, GCM_MAX_TTL } = require('../constants');
const { interruptionLevel } = require('@parse/node-apn/lib/notification/apsProperties');

const ttlFromExpiry = R.compose(
  R.min(GCM_MAX_TTL),
  R.max(0),
  (expiry) => expiry - Math.floor(Date.now() / 1000)
);

const extractTimeToLive = R.cond([
  [R.propIs(Number, 'expiry'), ({ expiry }) => ttlFromExpiry(expiry)],
  [R.propIs(Number, 'timeToLive'), R.prop('timeToLive')],
  [R.T, R.always(DEFAULT_TTL)],
]);

const expiryFromTtl = (ttl) => ttl + Math.floor(Date.now() / 1000);

const extractExpiry = R.cond([
  [R.propIs(Number, 'expiry'), R.prop('expiry')],
  [
    R.propIs(Number, 'timeToLive'),
    ({ timeToLive }) => expiryFromTtl(timeToLive),
  ],
  [R.T, () => expiryFromTtl(DEFAULT_TTL)],
]);

const getPropValueOrUndefinedIfIsSilent = (propName, data) => {
  if (data.silent) {
    return undefined;
  }
  return data[propName];
};

const toJSONorUndefined = R.when(
  R.is(String),
  R.tryCatch(JSON.parse, R.always(undefined))
);

const alertLocArgsToJSON = R.evolve({
  alert: {
    'title-loc-args': toJSONorUndefined,
    'loc-args': toJSONorUndefined,
  },
});

const getDefaultAlert = (data) => ({
  title: data.title,
  body: data.body,
  'title-loc-key': data.titleLocKey,
  'title-loc-args': data.titleLocArgs,
  'loc-key': data.locKey,
  'loc-args': data.locArgs || data.bodyLocArgs,
  'launch-image': data.launchImage,
  action: data.action,
});

const alertOrDefault = (data) =>
  R.when(
    R.propSatisfies(R.isNil, 'alert'),
    R.assoc('alert', getDefaultAlert(data))
  );

const getParsedAlertOrDefault = (data) =>
  R.pipe(alertOrDefault(data), alertLocArgsToJSON)(data);

const pathIsString = R.pathSatisfies(R.is(String));

const containsValidRecipients = R.either(
  pathIsString(['recipients', 'to']),
  pathIsString(['recipients', 'condition'])
);

const buildGcmNotification = (data) => {
  const notification = data.fcm_notification || {
    title: data.title,
    body: data.body,
    icon: data.icon,
    image: data.image,
    picture: data.picture,
    style: data.style,
    sound: data.sound,
    badge: data.badge,
    tag: data.tag,
    color: data.color,
    click_action: data.clickAction || data.category,
    body_loc_key: data.locKey,
    body_loc_args: toJSONorUndefined(data.locArgs),
    title_loc_key: data.titleLocKey,
    title_loc_args: toJSONorUndefined(data.titleLocArgs),
    android_channel_id: data.android_channel_id,
    notification_count: data.notificationCount || data.badge,
  };

  return notification;
};

const buildGcmMessage = (data, options) => {
  const notification = buildGcmNotification(data);

  let custom;
  if (typeof data.custom === 'string') {
    custom = {
      message: data.custom,
    };
  } else if (typeof data.custom === 'object') {
    custom = { ...data.custom };
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
  if (options.phonegap === true && data.contentAvailable) {
    custom['content-available'] = 1;
  }

  const message = new GcmMessage({
    collapseKey: data.collapseKey,
    priority: data.priority === 'normal' ? 'normal' : 'high',
    contentAvailable: data.silent ? true : data.contentAvailable || false,
    delayWhileIdle: data.delayWhileIdle || false,
    timeToLive: extractTimeToLive(data),
    restrictedPackageName: data.restrictedPackageName,
    dryRun: data.dryRun || false,
    data:
      options.phonegap === true ? Object.assign(custom, notification) : custom,
    notification:
      options.phonegap === true || data.silent === true
        ? undefined
        : notification,
  });

  return message;
};

const buildApnsMessage = (data) => {
  const message = new ApnsMessage({
    retryLimit: data.retries || -1,
    expiry: extractExpiry(data),
    priority: data.priority === 'normal' || data.silent === true ? 5 : 10,
    encoding: data.encoding,
    payload: data.custom || {},
    badge: getPropValueOrUndefinedIfIsSilent('badge', data),
    sound: getPropValueOrUndefinedIfIsSilent('sound', data),
    alert: getPropValueOrUndefinedIfIsSilent(
      'alert',
      getParsedAlertOrDefault(data)
    ),
    topic: data.topic,
    category: data.category || data.clickAction,
    contentAvailable: data.contentAvailable,
    mdm: data.mdm,
    urlArgs: data.urlArgs,
    truncateAtWordEnd: data.truncateAtWordEnd,
    collapseId: data.collapseKey,
    mutableContent: data.mutableContent || 0,
    threadId: data.threadId,
    pushType: data.pushType,
    interruptionLevel: data.interruptionLevel,
  });

  if (data.rawPayload) {
    message.rawPayload = data.rawPayload;
  }

  return message;
};

module.exports = {
  ttlAndroid: extractTimeToLive,
  apnsExpiry: extractExpiry,

  containsValidRecipients,

  buildApnsMessage,
  buildGcmMessage,
};
