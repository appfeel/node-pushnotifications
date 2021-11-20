const wns = require('wns');
const { WNS_METHOD } = require('./constants');

const parseErrorMessage = (err) => (err instanceof Error ? err.message : err);
const parseError = (err) => {
  if (err instanceof Error) {
    return err;
  }
  if (err) {
    return new Error(err);
  }
  return null;
};

let resumed;

function processResponse(err, response, regId) {
  const error = parseError(err) || parseError(response.innerError);
  const errorMsg =
    parseErrorMessage(err) || parseErrorMessage(response.innerError);
  resumed.success += error ? 0 : 1;
  resumed.failure += error ? 1 : 0;
  resumed.message.push({
    regId,
    error,
    errorMsg,
  });
}

const sendWNS = (_regIds, _data, settings) => {
  // sendNotifications and sendPromises are inside exports as in this way,
  // successive calls to this module doesn't override previous ones
  let sendPromises;

  function sendNotifications(regIds, notificationMethod, data, opts, onFinish) {
    const regId = regIds.shift();
    if (regId) {
      try {
        wns[notificationMethod](regId, data, opts, (err, response) => {
          sendPromises.push(Promise.resolve());
          processResponse(err, response, regId);
          sendNotifications(
            regIds,
            notificationMethod,
            data,
            { ...opts, accessToken: response.newAccessToken },
            onFinish
          );
        });
      } catch (err) {
        sendPromises.push(Promise.reject(err));
        sendNotifications(regIds, notificationMethod, data, opts, onFinish);
      }
    } else {
      Promise.all(sendPromises).then(() => onFinish(), onFinish);
    }
  }

  const promises = [];
  const opts = { ...settings.wns };
  const { notificationMethod } = opts;
  const data =
    notificationMethod === 'sendRaw' ? JSON.stringify(_data) : { ..._data };

  resumed = {
    method: WNS_METHOD,
    success: 0,
    failure: 0,
    message: [],
  };
  opts.headers = data.headers || opts.headers;
  opts.launch = data.launch || opts.launch;
  opts.duration = data.duration || opts.duration;

  delete opts.notificationMethod;
  delete data.headers;
  delete data.launch;
  delete data.duration;

  if (opts.accessToken) {
    sendPromises = [];
    const regIds = [..._regIds];
    // eslint-disable-next-line max-len
    promises.push(
      new Promise((resolve, reject) => {
        sendNotifications(regIds, notificationMethod, data, opts, (err) =>
          err ? reject(err) : resolve()
        );
      })
    );
  } else {
    // eslint-disable-next-line max-len
    _regIds.forEach((regId) =>
      promises.push(
        new Promise((resolve) => {
          wns[notificationMethod](regId, data, opts, (err, response) => {
            processResponse(err, response, regId);
            resolve();
          });
        })
      )
    );
  }

  return Promise.all(promises).then(() => resumed);
};

module.exports = sendWNS;
