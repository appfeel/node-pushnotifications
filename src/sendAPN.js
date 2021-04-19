const apn = require('@parse/node-apn');
const R = require('ramda');
const { DEFAULT_TTL, APN_METHOD } = require('./constants');

const expiryFromTtl = (ttl) => ttl + Math.floor(Date.now() / 1000);

const extractExpiry = R.cond([
  [R.propIs(Number, 'expiry'), R.prop('expiry')],
  [
    R.propIs(Number, 'timeToLive'),
    ({ timeToLive }) => expiryFromTtl(timeToLive),
  ],
  [R.T, () => expiryFromTtl(DEFAULT_TTL)],
]);

const getPropValueOrUndefinedIfIsSilent = (propName, data) =>
  R.ifElse(
    R.propEq('silent', true),
    R.always(undefined),
    R.prop(propName)
  )(data);

const toJSONorUndefined = R.tryCatch(JSON.parse, R.always(undefined));

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
  // bodyLocArgs is kept for backward compatibility
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

const getDeviceTokenOrSelf = R.ifElse(
  R.has('device'),
  R.prop('device'),
  R.identity
);

class APN {
  constructor(settings) {
    try {
      this.connection = new apn.Provider(settings);
    } catch (e) {
      this.connectionError = e;
      this.connection = null;
    }
  }

  shutdown() {
    if (this.connection) {
      this.connection.shutdown();
    }
  }

  sendAPN(regIds, data) {
    const message = new apn.Notification({
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

    if (!this.connection) {
      return Promise.reject(
        this.connectionError ||
          new Error('Unknown error: APN connection not configured properly')
      );
    }

    return this.connection.send(message, regIds).then((response) => {
      const resumed = {
        method: APN_METHOD,
        success: 0,
        failure: 0,
        message: [],
      };
      (response.sent || []).forEach((token) => {
        resumed.success += 1;
        resumed.message.push({
          regId: getDeviceTokenOrSelf(token),
          error: null,
        });
      });
      (response.failed || []).forEach((failure) => {
        // See https://github.com/node-apn/node-apn/blob/master/doc/provider.markdown#failed
        resumed.failure += 1;
        if (failure.error) {
          // A transport-level error occurred (e.g. network problem)
          resumed.message.push({
            regId: failure.device,
            error: failure.error,
            errorMsg: failure.error.message || failure.error,
          });
        } else {
          // `failure.status` is the HTTP status code
          // `failure.response` is the JSON payload
          resumed.message.push({
            regId: failure.device,
            error:
              failure.response.reason || failure.status
                ? new Error(failure.response.reason || failure.status)
                : failure.response,
            errorMsg: failure.response.reason || failure.status,
          });
        }
      });

      return resumed;
    });
  }
}

module.exports = APN;
