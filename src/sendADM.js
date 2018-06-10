const adm = require('node-adm');

const method = 'adm';

const sendADM = (regIds, _data, settings) => {
    const resumed = {
        method,
        success: 0,
        failure: 0,
        message: [],
    };
    const promises = [];
    const admSender = new adm.Sender(settings.adm);
    const data = Object.assign({}, _data);
    const { consolidationKey, expiry, timeToLive } = data;

    delete data.consolidationKey;
    delete data.expiry;
    delete data.timeToLive;

    const message = {
        expiresAfter: expiry - Math.floor(Date.now() / 1000) || timeToLive || 28 * 86400,
        consolidationKey,
        data,
    };

    regIds.forEach((regId) => {
        admSender.send(message, regId, (err, response) => {
            const error = err instanceof Error ? err.message : response.error;
            resumed.success += err || response.error ? 0 : 1;
            resumed.failure += err || response.error ? 1 : 0;
            resumed.message.push({
                regId,
                error,
            });
            promises.push(Promise.resolve());
        });
    });

    return Promise.all(promises)
        .then(() => resumed);
};

module.exports = sendADM;
