const { Notification: ApnsMessage } = require('@parse/node-apn');
const { Message: GsmMessage } = require('node-gcm');
const {
  ttlAndroid,
  expiryApns,
  getPropValueOrUndefinedIfIsSilent,
  getParsedAlertOrDefault,
} = require('./tools');

class FcmMessage {
  constructor(params) {
    this.data = params.data;
    this.android = params.android;
    this.apns = params.apns;
  }

  build(recipients) {
    return {
      data: this.data,
      android: this.android,
      apns: this.apns,

      ...recipients,
    };
  }

  static normalizeDataParams(data) {
    if (!data) return {};
    return Object.entries(data).reduce((normalized, [key, value]) => {
      if (value === undefined || value === null) {
        return normalized;
      }

      normalized[key] =
        typeof value === 'string' ? value : JSON.stringify(value);

      return normalized;
    }, {});
  }

  static buildAndroidMessage(params) {
    const notification = params.silent
      ? undefined
      : params.fcm_notification || undefined;

    const message = new GsmMessage({
      collapseKey: params.collapseKey,
      priority: params.priority === 'normal' ? 'normal' : 'high',
      timeToLive: ttlAndroid(params),
      restrictedPackageName: params.restrictedPackageName,
      notification,
    });

    const androidMessage = message.toJson();

    androidMessage.ttl = androidMessage.time_to_live * 1000;

    delete androidMessage.content_available;
    delete androidMessage.delay_while_idle;
    delete androidMessage.time_to_live;

    return androidMessage;
  }

  static buildApnsMessage(params) {
    const message = new ApnsMessage({
      expiry: expiryApns(params),
      priority: params.priority === 'normal' || params.silent ? 5 : 10,
      encoding: params.encoding,
      badge: getPropValueOrUndefinedIfIsSilent('badge', params),
      sound: getPropValueOrUndefinedIfIsSilent('sound', params),
      alert: getPropValueOrUndefinedIfIsSilent(
        'alert',
        getParsedAlertOrDefault(params)
      ),
      topic: params.topic,
      category: params.category || params.clickAction,
      contentAvailable: params.contentAvailable,
      mdm: params.mdm,
      urlArgs: params.urlArgs,
      truncateAtWordEnd: params.truncateAtWordEnd,
      collapseId: params.collapseKey,
      mutableContent: params.mutableContent || 0,
      threadId: params.threadId,
      pushType: params.pushType,
    });

    if (params.rawPayload) {
      message.rawPayload = params.rawPayload;
    }

    const headers = message.headers() || {};
    const payload = message.toJSON() || {};

    return { headers: this.normalizeDataParams(headers), payload };
  }

  static build(params, recipients) {
    const data = this.normalizeDataParams(params.custom);
    const android = this.buildAndroidMessage(params);
    const apns = this.buildApnsMessage(params);

    return new this({ data, android, apns }, recipients);
  }
}

module.exports = FcmMessage;
