const { buildAndroidMessage, buildApnsMessage } = require('./tools');

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
    const androidMessage = buildAndroidMessage(params, options);
    androidMessage.data = this.normalizeDataParams(androidMessage.data);
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
