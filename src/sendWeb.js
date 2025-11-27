const webPush = require('web-push');
const { WEB_METHOD } = require('./constants');

const stringify = (data) => typeof data === 'string' ? data : JSON.stringify(data);

const sendWebPush = async (regIds, data, settings) => {
  const payload = stringify(data);
  const promises = regIds.map((regId) =>
    webPush
      .sendNotification(regId, payload, settings.web)
      .then(() => ({
        success: 1,
        failure: 0,
        message: [
          {
            regId,
            error: null,
          },
        ],
      }))
      .catch((err) => ({
        success: 0,
        failure: 1,
        message: [
          {
            regId,
            error: err,
            errorMsg: err.message,
          },
        ],
      }))
  );

  const results = await Promise.all(promises);

  const reduced = results.reduce((acc, current) => ({
    success: acc.success + current.success,
    failure: acc.failure + current.failure,
    message: [...acc.message, ...current.message],
  }));
  return { ...reduced, method: WEB_METHOD };
};

module.exports = sendWebPush;
