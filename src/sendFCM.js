const firebaseAdmin = require('firebase-admin');

const { FCM_METHOD } = require('./constants');
const FcmMessage = require('./utils/fcmMessage');
const { containsValidRecipients } = require('./utils/tools');

// https://firebase.google.com/docs/cloud-messaging/send/admin-sdk?hl=en#send-a-batch-of-messages
const FCM_BATCH_SIZE = 500;

const getRecipientList = (obj) =>
  obj.tokens ?? [obj.token, obj.condition, obj.topic].filter(Boolean);

const sendChunk = (firebaseApp, recipients, message) => {
  const firebaseMessage = message.buildWithRecipients(recipients);

  return firebaseAdmin
    .messaging(firebaseApp)
    .sendEachForMulticast(firebaseMessage)
    .then((response) => {
      if (!response) {
        throw new Error('FCM returned an empty response');
      }
      const recipientList = getRecipientList(recipients);
      if (response.responses !== undefined) {
        return {
          method: FCM_METHOD,
          success: response.successCount,
          failure: response.failureCount,
          message: response.responses.map((value, index) => {
            const regToken = recipientList[index];
            const errorMsg = value.error ? value.error.message || value.error : null;
            let error = null;
            if (value.error) {
              error = value.error instanceof Error ? value.error : new Error(errorMsg);
            }
            return {
              messageId: value.messageId,
              originalRegId: regToken,
              regId: regToken,
              error,
              errorMsg,
            };
          }),
        };
      }
      return {
        method: FCM_METHOD,
        success: 0,
        failure: recipientList.length,
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
      settings.fcm.credential || firebaseAdmin.credential.cert(settings.fcm.serviceAccountKey),
  };

  // Add optional Firebase AppOptions properties if provided
  const optionalProps = [
    'httpAgent',
    'httpsAgent',
    'projectId',
    'databaseURL',
    'storageBucket',
    'serviceAccountId',
    'databaseAuthVariableOverride',
  ];
  optionalProps.forEach((prop) => {
    if (settings.fcm[prop] !== undefined) {
      opts[prop] = settings.fcm[prop];
    }
  });

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
      const registrationTokens = regIds.slice(chunk * FCM_BATCH_SIZE, (chunk + 1) * FCM_BATCH_SIZE);
      promises.push(sendChunk(firebaseApp, { tokens: registrationTokens }, fcmMessage));
      chunk += 1;
    } while (FCM_BATCH_SIZE * chunk < regIds.length);
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
