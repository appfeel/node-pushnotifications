const { Notification: ApnsMessage } = require('@parse/node-apn');
const { Message: GcmMessage } = require('node-gcm');

const { DEFAULT_TTL, GCM_MAX_TTL } = require('../constants');

const ttlFromExpiry = (expiry) => {
  const ttl = expiry - Math.floor(Date.now() / 1000);
  return Math.min(Math.max(ttl, 0), GCM_MAX_TTL);
};

const extractTimeToLive = (data) => {
  if (typeof data.expiry === 'number') {
    return ttlFromExpiry(data.expiry);
  }
  if (typeof data.timeToLive === 'number') {
    return data.timeToLive;
  }
  return DEFAULT_TTL;
};

const expiryFromTtl = (ttl) => ttl + Math.floor(Date.now() / 1000);

const extractExpiry = (data) => {
  if (typeof data.expiry === 'number') {
    return data.expiry;
  }
  if (typeof data.timeToLive === 'number') {
    return expiryFromTtl(data.timeToLive);
  }
  return expiryFromTtl(DEFAULT_TTL);
};

const getPropValueOrUndefinedIfIsSilent = (propName, data) => {
  if (data.silent) {
    return undefined;
  }
  return data[propName];
};

const toJSONorUndefined = (value) => {
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch (e) {
    return undefined;
  }
};

const alertLocArgsToJSON = (data) => {
  const alert = data.alert || {};
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

const alertOrDefault = (data) => {
  if (data.alert !== null && data.alert !== undefined) {
    return data;
  }
  return { ...data, alert: getDefaultAlert(data) };
};

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
