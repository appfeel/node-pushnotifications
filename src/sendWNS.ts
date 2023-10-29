import wns from 'wns';
import { Data, DefaultSettings, RegIdType } from './types';

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

const sendWNS = (_regIds: string[], _data: Data, settings: DefaultSettings) => {
  let sendPromises;

  function sendNotifications(
    regIds: string[],
    notificationMethod: string,
    data: string | Data,
    opts,
    onFinish
  ) {
    const regId = regIds.shift();
    if (regId) {
      try {
        const wnsOpts = { ...opts };
        delete wnsOpts.notificationMethod;
        wns[notificationMethod](regId, data, wnsOpts, (err, response) => {
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

  const promises: any[] = [];
  const opts = { ...settings.wns };
  const { notificationMethod = 'send' } = opts;
  const data =
    notificationMethod === 'sendRaw' ? JSON.stringify(_data) : { ..._data };

  resumed = {
    method: RegIdType.wns,
    success: 0,
    failure: 0,
    message: [],
  };
  opts.headers =
    typeof data === 'object' && data.headers ? data.headers : opts.headers;
  opts.launch =
    typeof data === 'object' && data.launch ? data.launch : opts.launch;
  opts.duration =
    typeof data === 'object' && data.duration ? data.duration : opts.duration;

  if (typeof data === 'object') {
    delete data.headers;
    delete data.launch;
    delete data.duration;
  }

  if (opts.accessToken) {
    sendPromises = [];
    const regIds = [..._regIds];
    promises.push(
      new Promise((resolve, reject) => {
        sendNotifications(regIds, notificationMethod, data, opts, (err) =>
          err ? reject(err) : resolve(true)
        );
      })
    );
  } else {
    _regIds.forEach((regId) =>
      promises.push(
        new Promise((resolve) => {
          wns[notificationMethod](regId, data, opts, (err, response) => {
            processResponse(err, response, regId);
            resolve(true);
          });
        })
      )
    );
  }

  return Promise.all(promises).then(() => resumed);
};

export default sendWNS;
