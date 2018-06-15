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
            const errorMsg = err instanceof Error ? err.message : response.error;
            const error = err || (response.error ? new Error(response.error) : null);
            resumed.success += error ? 0 : 1;
            resumed.failure += error ? 1 : 0;
            resumed.message.push({
                regId,
                error,
                errorMsg,
            });
            promises.push(Promise.resolve());
        });
    });

    return Promise.all(promises)
        .then(() => resumed);
};

module.exports = sendADM;
