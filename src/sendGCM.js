const gcm = require('node-gcm');
const R = require('ramda');
const { DEFAULT_TTL, GCM_METHOD } = require('./constants');

const ttlFromExpiry = expiry => expiry - Math.floor(Date.now() / 1000);

const extractTimeToLive = R.cond([
  [R.propIs(Number, 'expiry'), ({ expiry }) => ttlFromExpiry(expiry)],
  [R.propIs(Number, 'timeToLive'), R.prop('timeToLive')],
  [R.T, R.always(DEFAULT_TTL)],
]);

const sendChunk = (GCMSender, registrationTokens, message, retries) =>
  new Promise(resolve => {
    GCMSender.send(
      message,
      { registrationTokens },
      retries,
      (err, response) => {
        // Response: see https://developers.google.com/cloud-messaging/http-server-ref#table5
        if (err) {
          resolve({
            method: GCM_METHOD,
            success: 0,
            failure: registrationTokens.length,
            message: registrationTokens.map(value => ({
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
            message: response.results.map(value => {
              const regToken = registrationTokens[regIndex];
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
            method: GCM_METHOD,
            multicastId: response.multicast_id,
            success: response.success,
            failure: response.failure,
            message: registrationTokens.map(value => ({
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

const sendGCM = (regIds, data, settings) => {
  const opts = Object.assign({}, settings.gcm);
  const { id } = opts;
  delete opts.id;
  const GCMSender = new gcm.Sender(id, opts);
  const promises = [];
  const notification = {
    id: data.id,
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
  };

  let custom;
  if (typeof data.custom === 'string') {
    custom = {
      message: data.custom,
    };
  } else if (typeof data.custom === 'object') {
    custom = Object.assign({}, data.custom);
  } else {
    custom = {
      data: data.custom,
    };
  }
  custom.id = custom.id || data.id;
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
    priority: data.priority === 'normal' ? data.priority : 'high',
    contentAvailable: data.contentAvailable || false,
    delayWhileIdle: data.delayWhileIdle || false,
    timeToLive: extractTimeToLive(data),
    restrictedPackageName: data.restrictedPackageName,
    dryRun: data.dryRun || false,
    data: opts.phonegap === true ? Object.assign(custom, notification) : custom, // See https://github.com/phonegap/phonegap-plugin-push/blob/master/docs/PAYLOAD.md#android-behaviour
    notification: opts.phonegap === true ? undefined : notification,
  });
  let chunk = 0;

  // Split in 1.000 chunks, see https://developers.google.com/cloud-messaging/http-server-ref#table1
  do {
    const tokens = regIds.slice(chunk * 1000, (chunk + 1) * 1000);
    promises.push(sendChunk(GCMSender, tokens, message, data.retries || 0));
    chunk += 1;
  } while (1000 * chunk < regIds.length);

  return Promise.all(promises).then(results => {
    const resumed = {
      method: GCM_METHOD,
      multicastId: [],
      success: 0,
      failure: 0,
      message: [],
    };

    results.forEach(result => {
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
