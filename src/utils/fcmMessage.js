const { buildGsmMessage, buildApnsMessage } = require('./tools');

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
      if (value === undefined || value === null) {
        return normalized;
      }

      normalized[key] =
        typeof value === 'string' ? value : JSON.stringify(value);

      return normalized;
    }, {});
  }

  static buildAndroidMessage(params) {
    const message = buildGsmMessage(params, {});

    const androidMessage = message.toJson();

    androidMessage.ttl = androidMessage.time_to_live * 1000;

    delete androidMessage.content_available;
    delete androidMessage.mutable_content;
    delete androidMessage.delay_while_idle;
    delete androidMessage.time_to_live;
    delete androidMessage.dry_run;
    delete androidMessage.data;

    return androidMessage;
  }

  static buildApnsMessage(params) {
    const message = buildApnsMessage(params);
    delete message.payload;

    const headers = message.headers() || {};
    const payload = message.toJSON() || {};

    return { headers: this.normalizeDataParams(headers), payload };
  }

  static build(params) {
    const providersExclude = params.providersExclude || [];
    delete params.providersExclude;

    const data = this.normalizeDataParams(params.custom);

    const createParams = { data };

    if (!providersExclude.includes('apns')) {
      createParams.apns = this.buildApnsMessage(params);
    }

    if (!providersExclude.includes('android')) {
      createParams.android = this.buildAndroidMessage(params);
    }

    return new this(createParams);
  }
}

module.exports = FcmMessage;
