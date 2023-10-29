import adm from 'node-adm';
import { Data, DefaultSettings, RegIdType } from './types';

const sendADM = async (
  regIds: string[],
  _data: Data,
  settings: DefaultSettings
) => {
  const resumed: any = {
    method: RegIdType.adm,
    success: 0,
    failure: 0,
    message: [],
  };
  const promises: any[] = [];
  const admSender = new adm.Sender(settings.adm);
  const data = { ..._data };
  const { consolidationKey, expiry, timeToLive, custom = {} } = data;

  delete data.consolidationKey;
  delete data.expiry;
  delete data.timeToLive;
  delete data.custom;

  const message = {
    expiresAfter: expiry
      ? expiry - Math.floor(Date.now() / 1000) || timeToLive || 28 * 86400
      : undefined,
    consolidationKey,
    data: { ...data, ...(typeof custom === 'object' ? custom : {}) },
  };

  regIds.forEach((regId) => {
    promises.push(
      new Promise((resolve) => {
        admSender.send(message, regId, (err, response) => {
          const errorMsg = err instanceof Error ? err.message : response.error;
          const error =
            err || (response.error ? new Error(response.error) : null);
          resumed.success += error ? 0 : 1;
          resumed.failure += error ? 1 : 0;
          resumed.message.push({
            regId,
            error,
            errorMsg,
          });
          resolve(true);
        });
      })
    );
  });

  await Promise.all(promises);
  return resumed;
};

export default sendADM;
