const wns = require('wns');
const { WNS_METHOD } = require('./constants');

const parseErrorMessage = (err) => (err instanceof Error ? err.message : err);
const parseError = (err) => {
  if (err instanceof Error) return err;
  if (err) return new Error(err);
  return null;
};

// wns calls back with only an error (no response) on request and HTTP failures
function processResponse(resumed, err, response, regId) {
  const error = parseError(err) || parseError(response?.innerError);
  const errorMsg = parseErrorMessage(err) || parseErrorMessage(response?.innerError);
  resumed.success += error ? 0 : 1;
  resumed.failure += error ? 1 : 0;
  resumed.message.push({
    regId,
    error,
    errorMsg,
  });
}

const sendWNS = (_regIds, _data, settings) => {
  // Per-call state, so concurrent sendWNS calls don't mix their results
  let sendPromises;
  const resumed = {
    method: WNS_METHOD,
    success: 0,
    failure: 0,
    message: [],
  };

  function sendNotifications(regIds, notificationMethod, data, opts, onFinish) {
    const regId = regIds.shift();
    if (regId) {
      try {
        wns[notificationMethod](regId, data, opts, (err, response) => {
          // TODO: replace this callback recursion with a promisified wns client
          // eslint-disable-next-line promise/no-promise-in-callback
          sendPromises.push(Promise.resolve());
          processResponse(resumed, err, response, regId);
          // On failure wns attaches newAccessToken to the error instead of a response.
          // Keep the current token when no refreshed one was issued.
          const newAccessToken = (response ?? err)?.newAccessToken;
          sendNotifications(
            regIds,
            notificationMethod,
            data,
            { ...opts, accessToken: newAccessToken ?? opts.accessToken },
            onFinish
          );
        });
      } catch (err) {
        sendPromises.push(Promise.reject(err));
        sendNotifications(regIds, notificationMethod, data, opts, onFinish);
      }
    } else {
      // onFinish settles the outer promise for both outcomes
      // eslint-disable-next-line promise/catch-or-return
      Promise.all(sendPromises).then(() => onFinish(), onFinish);
    }
  }

  const promises = [];
  const opts = { ...settings.wns };
  const { notificationMethod } = opts;
  const data = notificationMethod === 'sendRaw' ? JSON.stringify(_data) : { ..._data };

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
    promises.push(
      new Promise((resolve, reject) => {
        sendNotifications(regIds, notificationMethod, data, opts, (err) =>
          err ? reject(err) : resolve()
        );
      })
    );
  } else {
    _regIds.forEach((regId) =>
      promises.push(
        new Promise((resolve) => {
          wns[notificationMethod](regId, data, opts, (err, response) => {
            processResponse(resumed, err, response, regId);
            resolve();
          });
        })
      )
    );
  }

  return Promise.all(promises).then(() => resumed);
};

module.exports = sendWNS;
