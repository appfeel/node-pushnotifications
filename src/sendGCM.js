const gcm = require('node-gcm');
const { GCM_METHOD } = require('./constants');
const { containsValidRecipients, buildGcmMessage } = require('./utils/tools');

const getRecipientList = (obj) =>
  obj.registrationTokens ?? [obj.to, obj.condition].filter(Boolean);

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
            const errorMsg = value.error
              ? value.error.message || value.error
              : null;
            return {
              messageId: value.message_id,
              originalRegId: regToken,
              regId: value.registration_id || regToken,
              error: value.error ? new Error(value.error) : null,
              errorMsg,
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

  const message = buildGcmMessage(data, opts);

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
