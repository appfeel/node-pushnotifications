import gcm from 'node-gcm';
import * as R from 'ramda';
import { DEFAULT_TTL, GCM_MAX_TTL } from './constants';
import { DefaultSettings, Data, RegIdType } from './types';

const ttlFromExpiry = (expiry: number) => {
  const subtracted = expiry - Math.floor(Date.now() / 1000);
  return Math.min(GCM_MAX_TTL, subtracted);
};

const extractTimeToLive = R.cond<Data[], number>([
  [R.propIs(Number, 'expiry'), ({ expiry = 0 }) => ttlFromExpiry(expiry)],
  [
    R.propIs(Number, 'timeToLive'),
    R.pipe(R.prop('timeToLive'), R.defaultTo(DEFAULT_TTL)),
  ],
  [R.T, R.always(DEFAULT_TTL)],
]);

// const pathIsString = R.pathSatisfies(R.is(String));
const pathIsString = (path: (string | number)[]): ((obj: any) => boolean) => {
  return (obj: any) => R.pathSatisfies(R.is(String), path, obj);
};

const containsValidRecipients = R.either(
  pathIsString(['recipients', 'to']),
  pathIsString(['recipients', 'condition'])
);

const propValueToSingletonArray = (propName: string) =>
  R.compose(R.of, R.prop(propName));

const getRecipientList = R.cond<any[], any[]>([
  [R.has('registrationTokens'), R.prop('registrationTokens')],
  [R.has('to'), propValueToSingletonArray('to')],
  [R.has('condition'), propValueToSingletonArray('condition')],
  [R.T, R.always([])],
]);

const sendChunk = (
  GCMSender: any,
  recipients: any,
  message: any,
  retries: number
) =>
  new Promise((resolve) => {
    const recipientList = getRecipientList(recipients);

    GCMSender.send(
      message,
      recipients,
      retries,
      (err: Error | null, response: any) => {
        if (err) {
          resolve({
            method: RegIdType.gcm,
            success: 0,
            failure: recipientList.length,
            message: recipientList.map((value: any) => ({
              originalRegId: value,
              regId: value,
              error: err,
              errorMsg: err instanceof Error ? err.message : err,
            })),
          });
        } else if (response && response.results !== undefined) {
          let regIndex = 0;
          resolve({
            method: RegIdType.gcm,
            multicastId: response.multicast_id,
            success: response.success,
            failure: response.failure,
            message: response.results.map((value: any) => {
              const regToken = recipientList[regIndex];
              regIndex += 1;
              return {
                messageId: value.message_id,
                originalRegId: regToken,
                regId: value.registration_id || regToken,
                error: value.error ? new Error(value.error) : null,
                errorMsg: value.error
                  ? value.error.message || value.error
                  : null,
              };
            }),
          });
        } else {
          resolve({
            method: RegIdType.gcm,
            multicastId: response.multicast_id,
            success: response.success,
            failure: response.failure,
            message: recipientList.map((value: any) => ({
              originalRegId: value,
              regId: value,
              error: new Error('unknown'),
              errorMsg: 'unknown',
            })),
          });
        }
      }
    );
  });

const sendGCM = async (
  regIds: string[],
  data: Data,
  settings: DefaultSettings
) => {
  const opts = { ...settings.gcm };
  const { id } = opts;
  delete opts.id;
  const GCMSender = new gcm.Sender(id, opts);
  const promises: Promise<any>[] = [];
  const notification = {
    title: data.title, // Android, iOS (Watch)
    body: data.body, // Android, iOS
    icon: data.icon, // Android
    image: data.image, // Android
    picture: data.picture, // Android
    style: data.style, // Android
    sound: data.sound, // Android, iOS
    badge: data.badge, // iOS
    tag: data.tag, // Android
    color: data.color, // Android
    click_action: data.clickAction || data.category, // Android, iOS
    body_loc_key: data.locKey, // Android, iOS
    body_loc_args: data.locArgs, // Android, iOS
    title_loc_key: data.titleLocKey, // Android, iOS
    title_loc_args: data.titleLocArgs, // Android, iOS
    android_channel_id: data.android_channel_id, // Android
    notification_count: data.notificationCount || data.badge, // Android
  };

  let custom: any;
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
  if (opts.phonegap === true && data.contentAvailable) {
    custom['content-available'] = 1;
  }

  const message = new gcm.Message({
    collapseKey: data.collapseKey,
    priority: data.priority === 'normal' ? 'normal' : 'high',
    contentAvailable: data.silent ? true : data.contentAvailable || false,
    delayWhileIdle: data.delayWhileIdle || false,
    timeToLive: extractTimeToLive(data),
    restrictedPackageName: data.restrictedPackageName,
    dryRun: data.dryRun || false,
    data: opts.phonegap === true ? Object.assign(custom, notification) : custom,
    notification:
      opts.phonegap === true || data.silent === true ? undefined : notification,
  });
  let chunk = 0;

  if (containsValidRecipients(data)) {
    promises.push(
      sendChunk(GCMSender, data.recipients, message, data.retries || 0)
    );
  } else {
    do {
      const registrationTokens = regIds.slice(chunk * 1000, (chunk + 1) * 1000);
      promises.push(
        sendChunk(GCMSender, { registrationTokens }, message, data.retries || 0)
      );
      chunk += 1;
    } while (1000 * chunk < regIds.length);
  }

  const results = await Promise.all(promises);
  const resumed: any = {
    method: RegIdType.gcm,
    multicastId: [],
    success: 0,
    failure: 0,
    message: [],
  };
  results.forEach((result) => {
    if (result.multicastId) {
      resumed.multicastId.push(result.multicastId);
    }
    resumed.success += result.success;
    resumed.failure += result.failure;
    resumed.message.push(...result.message);
  });
  return resumed;
};

export default sendGCM;
