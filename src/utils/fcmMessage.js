const { buildGcmMessage, buildApnsMessage } = require('./tools');

class FcmMessage {
  constructor(params) {
    this.data = params.data;
    this.android = params.android;
    this.apns = params.apns;
  }

  buildWithRecipients(recipients) {
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
      if (value == null) return normalized;
      const stringifyValue = typeof value === 'string' ? value : JSON.stringify(value);
      return { ...normalized, [key]: stringifyValue };
    }, {});
  }

  static buildAndroidMessage(params, options) {
    const message = buildGcmMessage(params, options);

    const androidMessage = message.toJson();

    androidMessage.ttl = androidMessage.time_to_live * 1000;
    androidMessage.data = this.normalizeDataParams(androidMessage.data);

    delete androidMessage.content_available;
    delete androidMessage.mutable_content;
    delete androidMessage.delay_while_idle;
    delete androidMessage.time_to_live;
    delete androidMessage.dry_run;

    return androidMessage;
  }

  static buildApnsMessage(params) {
    const message = buildApnsMessage(params);
    delete message.payload;

    const headers = message.headers() || {};
    const payload = message.toJSON() || {};

    return { headers: this.normalizeDataParams(headers), payload };
  }

  static build(params, options) {
    const { providersExclude = [], ...fcmMessageParams } = params;

    const data = this.normalizeDataParams(fcmMessageParams.custom);

    const createParams = { data };

    if (!providersExclude.includes('apns')) {
      createParams.apns = this.buildApnsMessage(fcmMessageParams);
    }

    if (!providersExclude.includes('android')) {
      createParams.android = this.buildAndroidMessage(fcmMessageParams, options);
    }

    return new this(createParams);
  }
}

module.exports = FcmMessage;
