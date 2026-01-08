const { Notification: ApnsMessage } = require('@parse/node-apn');

const { DEFAULT_TTL, GCM_MAX_TTL } = require('../constants');

const ttlFromExpiry = (expiry) => {
  const ttl = expiry - Math.floor(Date.now() / 1000);
  return Math.min(Math.max(ttl, 0), GCM_MAX_TTL);
};

const extractTimeToLive = (data) => {
  if (typeof data?.expiry === 'number') return ttlFromExpiry(data.expiry);
  if (typeof data?.timeToLive === 'number') return data.timeToLive;
  return DEFAULT_TTL;
};

const expiryFromTtl = (ttl) => ttl + Math.floor(Date.now() / 1000);

const extractExpiry = (data) => {
  if (typeof data?.expiry === 'number') return data.expiry;
  if (typeof data?.timeToLive === 'number') return expiryFromTtl(data.timeToLive);
  return expiryFromTtl(DEFAULT_TTL);
};

const getPropValueOrUndefinedIfIsSilent = (propName, data) =>
  data.silent ? undefined : data[propName];

const toJSONorUndefined = (value) => {
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
};

const alertLocArgsToJSON = (data) => {
  const alert = data.alert ?? {};
  return {
    ...data,
    alert: {
      ...alert,
      'title-loc-args': toJSONorUndefined(alert['title-loc-args']),
      'loc-args': toJSONorUndefined(alert['loc-args']),
    },
  };
};

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

const alertOrDefault = (data) => ({
  ...data,
  alert: data.alert ?? getDefaultAlert(data),
});

const getParsedAlertOrDefault = (data) => {
  const withAlert = alertOrDefault(data);
  return alertLocArgsToJSON(withAlert);
};

const pathIsString = (path) => (val) => {
  const current = path.reduce((acc, key) => {
    if (acc && typeof acc === 'object') {
      return acc[key];
    }
    return null;
  }, val);
  return typeof current === 'string';
};

const containsValidRecipients = (obj) => {
  const checkTo = pathIsString(['recipients', 'to'])(obj);
  const checkCondition = pathIsString(['recipients', 'condition'])(obj);
  return checkTo || checkCondition;
};

const buildAndroidNotification = (data) => {
  const notification = data.fcm_notification || {
    title: data.title,
    body: data.body,
    icon: data.icon,
    imageUrl: data.image || data.picture,
    sound: data.sound,
    color: data.color,
    tag: data.tag,
    clickAction: data.clickAction || data.category,
    bodyLocKey: data.locKey,
    bodyLocArgs: toJSONorUndefined(data.locArgs),
    titleLocKey: data.titleLocKey,
    titleLocArgs: toJSONorUndefined(data.titleLocArgs),
    channelId: data.android_channel_id,
    notificationCount: data.notificationCount || data.badge,
    // Additional Firebase Admin SDK properties
    ticker: data.ticker,
    sticky: data.sticky,
    visibility: data.visibility,
    priority: data.notificationPriority,
    vibrateTimingsMillis: data.vibrateTimingsMillis,
    defaultVibrateTimings: data.defaultVibrateTimings,
    defaultSound: data.defaultSound,
    lightSettings: data.lightSettings,
    defaultLightSettings: data.defaultLightSettings,
    eventTimestamp: data.eventTimestamp,
    localOnly: data.localOnly,
    proxy: data.proxy,
  };

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(notification).filter(([, value]) => value !== undefined)
  );
};

const buildAndroidMessage = (data, options) => {
  const notification = buildAndroidNotification(data);

  let custom;
  if (typeof data.custom === 'string') {
    custom = { message: data.custom };
  } else if (typeof data.custom === 'object') {
    custom = { ...data.custom };
  } else {
    custom = { data: data.custom };
  }

  custom.title = custom.title || data.title;
  custom.message = custom.message || data.body;
  custom.sound = custom.sound || data.sound;
  custom.icon = custom.icon || data.icon;
  custom.msgcnt = custom.msgcnt || data.badge;
  if (options.phonegap === true && data.contentAvailable) {
    custom['content-available'] = 1;
  }

  const fcmAndroidMessage = {
    collapseKey: data.collapseKey,
    priority: data.priority === 'normal' ? 'normal' : 'high',
    ttl: extractTimeToLive(data) * 1000, // Convert seconds to milliseconds for FCM
    restrictedPackageName: data.restrictedPackageName,
    directBootOk: data.directBootOk,
    data: custom,
  };

  // Only add notification if not silent mode
  if (data.silent !== true && options.phonegap !== true) {
    fcmAndroidMessage.notification = notification;
  }

  // Add FCM options if provided
  if (data.fcmOptions || data.analyticsLabel) {
    fcmAndroidMessage.fcmOptions = {
      analyticsLabel: data.fcmOptions?.analyticsLabel || data.analyticsLabel,
    };
  }

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(fcmAndroidMessage).filter(([, value]) => value !== undefined)
  );
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
    alert: getPropValueOrUndefinedIfIsSilent('alert', getParsedAlertOrDefault(data)),
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
  buildAndroidMessage,
};
