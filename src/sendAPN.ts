import apn from '@parse/node-apn';
import * as R from 'ramda';
import { DEFAULT_TTL } from './constants';
import { Data, RegIdType } from './types';

const expiryFromTtl = (ttl: number) => ttl + Math.floor(Date.now() / 1000);

const extractExpiry = R.cond<Data[], number>([
  [R.propIs(Number, 'expiry'), R.prop<number>('expiry')],
  [
    R.propIs(Number, 'timeToLive'),
    ({ timeToLive = 0 }) => expiryFromTtl(timeToLive),
  ],
  [R.T, () => expiryFromTtl(DEFAULT_TTL)],
]);

const getPropValueOrUndefinedIfIsSilent = (propName: string, data: any) => {
  if (data.silent === true) {
    return undefined;
  }
  return data[propName];
};

const toJSONorUndefined = R.tryCatch(JSON.parse, R.always(undefined));

const alertLocArgsToJSON = R.evolve({
  alert: {
    'title-loc-args': toJSONorUndefined,
    'loc-args': toJSONorUndefined,
  },
});

const getDefaultAlert = (data: any) => ({
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

const alertOrDefault = (data: any) =>
  R.when(
    R.propSatisfies(R.isNil, 'alert'),
    R.assoc('alert', getDefaultAlert(data))
  );

const getParsedAlertOrDefault = (data: any) =>
  R.pipe(alertOrDefault(data), alertLocArgsToJSON)(data);

const getDeviceTokenOrSelf = R.ifElse(
  R.has('device'),
  R.prop('device'),
  R.identity
);

export default class APNSender {
  private connection?: apn.Provider;

  private connectionError: any;

  constructor(settings: apn.ProviderOptions) {
    try {
      this.connection = new apn.Provider(settings);
    } catch (e) {
      this.connectionError = e;
      this.connection = undefined;
    }
  }

  shutdown() {
    if (this.connection) {
      this.connection.shutdown();
    }
  }

  async sendAPN(regIds: string[], data: Data): Promise<any> {
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
      throw new Error(
        this.connectionError ||
          new Error('Unknown error: APN connection not configured properly')
      );
    }

    const response = await this.connection.send(message, regIds);
    const resumed: any = {
      method: RegIdType.apn,
      success: 0,
      failure: 0,
      message: [],
    };
    (response.sent || []).forEach((token: any) => {
      resumed.success += 1;
      resumed.message.push({
        regId: getDeviceTokenOrSelf(token),
        error: null,
      });
    });
    (response.failed || []).forEach((failure: any) => {
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
            failure.response?.reason || failure.status
              ? new Error(failure.response?.reason || failure.status)
              : failure.response,
          errorMsg: failure.response?.reason || failure.status,
        });
      }
    });

    return resumed;
  }
}
