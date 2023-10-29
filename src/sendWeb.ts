import webPush from 'web-push';
import { is, unless, assoc } from 'ramda';
import { Data, DefaultSettings, RegIdType } from './types';

const stringify = unless(is(String), JSON.stringify);

const sendWebPush = async (
  regIds: (string | webPush.PushSubscription)[],
  data: Data,
  settings: DefaultSettings
) => {
  const payload = stringify(data);
  const promises = regIds.map((regId) =>
    webPush
      // regId might be a JSON string
      .sendNotification(
        typeof regId === 'string' ? JSON.parse(regId) : regId,
        payload,
        settings.web
      )
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
  return assoc('method', RegIdType.web, reduced);
};

export default sendWebPush;
