const firebaseAdmin = require('firebase-admin');

const { FCM_METHOD } = require('./constants');
const FcmMessage = require('./utils/fcmMessage');
const { containsValidRecipients } = require('./utils/tools');

const getRecipientList = (obj) => {
  if (obj.tokens) {
    return obj.tokens;
  }
  if (obj.token) {
    return [obj.token];
  }
  if (obj.condition) {
    return [obj.condition];
  }
  if (obj.topic) {
    return [obj.topic];
  }
  return [];
};

const sendChunk = (firebaseApp, recipients, message) => {
  const firebaseMessage = message.buildWithRecipients(recipients);

  return firebaseAdmin
    .messaging(firebaseApp)
    .sendEachForMulticast(firebaseMessage)
    .then((response, err) => {
      const recipientList = getRecipientList(recipients);
      if (err) {
        return {
          method: FCM_METHOD,
          success: 0,
          failure: recipientList.length,
          message: recipientList.map((value) => ({
            originalRegId: value,
            regId: value,
            error: err,
            errorMsg: err instanceof Error ? err.message : err,
          })),
        };
      }
      if (response && response.responses !== undefined) {
        let regIndex = 0;
        return {
          method: FCM_METHOD,
          success: response.successCount,
          failure: response.failureCount,
          message: response.responses.map((value) => {
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
        };
      }
      return {
        method: FCM_METHOD,
        success: response.successCount,
        failure: response.failureCount,
        message: recipientList.map((value) => ({
          originalRegId: value,
          regId: value,
          error: new Error('unknown'),
          errorMsg: 'unknown',
        })),
      };
    });
};

const sendFCM = (regIds, data, settings) => {
  const appName = `${settings.fcm.appName}`;
  const opts = {
    credential:
      settings.fcm.credential ||
      firebaseAdmin.credential.cert(settings.fcm.serviceAccountKey),
  };

  const firebaseApp = firebaseAdmin.initializeApp(opts, appName);
  firebaseAdmin.INTERNAL.appStore.removeApp(appName);

  const promises = [];

  const fcmMessage = FcmMessage.build(data, settings.fcm);

  let chunk = 0;

  if (containsValidRecipients(data)) {
    if (data.recipients.to) {
      Object.assign(data.recipients, { topic: data.recipients.to });
    }

    promises.push(sendChunk(firebaseApp, data.recipients, fcmMessage));
  } else {
    do {
      const registrationTokens = regIds.slice(chunk * 1000, (chunk + 1) * 1000);
      promises.push(
        sendChunk(firebaseApp, { tokens: registrationTokens }, fcmMessage)
      );
      chunk += 1;
    } while (1000 * chunk < regIds.length);
  }

  return Promise.all(promises).then((results) => {
    const resumed = {
      method: FCM_METHOD,
      success: 0,
      failure: 0,
      message: [],
    };

    results.forEach((result) => {
      resumed.success += result.success;
      resumed.failure += result.failure;
      resumed.message.push(...result.message);
    });

    return resumed;
  });
};

module.exports = sendFCM;
