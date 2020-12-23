const gcm = require('node-gcm');
const R = require('ramda');
const { DEFAULT_TTL, GCM_METHOD } = require('./constants');

const ttlFromExpiry = (expiry) => expiry - Math.floor(Date.now() / 1000);

const extractTimeToLive = R.cond([
  [R.propIs(Number, 'expiry'), ({ expiry }) => ttlFromExpiry(expiry)],
  [R.propIs(Number, 'timeToLive'), R.prop('timeToLive')],
  [R.T, R.always(DEFAULT_TTL)],
]);

const pathIsString = R.pathSatisfies(R.is(String));

const containsValidRecipients = R.either(
  pathIsString(['recipients', 'to']),
  pathIsString(['recipients', 'condition'])
);

const propValueToSingletonArray = (propName) =>
  R.compose(R.of, R.prop(propName));

const getRecipientList = R.cond([
  [R.has('registrationTokens'), R.prop('registrationTokens')],
  [R.has('to'), propValueToSingletonArray('to')],
  [R.has('condition'), propValueToSingletonArray('condition')],
]);

const sendChunk = (GCMSender, recipients, message, retries) =>
  new Promise((resolve) => {
    const recipientList = getRecipientList(recipients);

    GCMSender.send(message, recipients, retries, (err, response) => {
      // Response: see https://developers.google.com/cloud-messaging/http-server-ref#table5
      if (err) {
        resolve({
          method: GCM_METHOD,
          success: 0,
          failure: recipientList.length,
          message: recipientList.map((value) => ({
            originalRegId: value,
            regId: value,
            error: err,
            errorMsg: err instanceof Error ? err.message : err,
          })),
        });
      } else if (response && response.results !== undefined) {
        let regIndex = 0;
        resolve({
          method: GCM_METHOD,
          multicastId: response.multicast_id,
          success: response.success,
          failure: response.failure,
          message: response.results.map((value) => {
            const regToken = recipientList[regIndex];
            regIndex += 1;
            return {
              messageId: value.message_id,
              originalRegId: regToken,
              regId: value.registration_id || regToken,
              error: value.error ? new Error(value.error) : null,
              errorMsg: value.error ? value.error.message || value.error : null,
            };
          }),
        });
      } else {
        resolve({
          method: GCM_METHOD,
          multicastId: response.multicast_id,
          success: response.success,
          failure: response.failure,
          message: recipientList.map((value) => ({
            originalRegId: value,
            regId: value,
            error: new Error('unknown'),
            errorMsg: 'unknown',
          })),
        });
      }
    });
  });

const sendGCM = (regIds, data, settings) => {
  const opts = { ...settings.gcm };
  const { id } = opts;
  delete opts.id;
  const GCMSender = new gcm.Sender(id, opts);
  const promises = [];
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
  if (opts.phonegap === true && data.contentAvailable) {
    custom['content-available'] = 1;
  }

  const message = new gcm.Message({
    // See https://developers.google.com/cloud-messaging/http-server-ref#table5
    collapseKey: data.collapseKey,
    priority: data.priority === 'normal' || data.silent ? 'normal' : 'high',
    contentAvailable: data.silent ? true : data.contentAvailable || false,
    delayWhileIdle: data.delayWhileIdle || false,
    timeToLive: extractTimeToLive(data),
    restrictedPackageName: data.restrictedPackageName,
    dryRun: data.dryRun || false,
    data: opts.phonegap === true ? Object.assign(custom, notification) : custom, // See https://github.com/phonegap/phonegap-plugin-push/blob/master/docs/PAYLOAD.md#android-behaviour
    notification:
      opts.phonegap === true || data.silent === true ? undefined : notification,
  });
  let chunk = 0;

  /* allow to override device tokens with custom `to` or `condition` field:
   * https://github.com/ToothlessGear/node-gcm#recipients */
  if (containsValidRecipients(data)) {
    promises.push(
      sendChunk(GCMSender, data.recipients, message, data.retries || 0)
    );
  } else {
    // Split tokens in 1.000 chunks, see https://developers.google.com/cloud-messaging/http-server-ref#table1
    do {
      const registrationTokens = regIds.slice(chunk * 1000, (chunk + 1) * 1000);
      promises.push(
        sendChunk(GCMSender, { registrationTokens }, message, data.retries || 0)
      );
      chunk += 1;
    } while (1000 * chunk < regIds.length);
  }

  return Promise.all(promises).then((results) => {
    const resumed = {
      method: GCM_METHOD,
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
  });
};

module.exports = sendGCM;
