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
    const consolidationKey = data.consolidationKey;
    const expiry = data.expiry;
    const timeToLive = data.timeToLive;

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
            resumed.success += err || response.error ? 0 : 1;
            resumed.failure += err || response.error ? 1 : 0;
            resumed.message.push({
                regId,
                error: err || (response.error ? new Error(response.error) : null),
            });
            promises.push(Promise.resolve());
        });
    });

    return Promise.all(promises)
        .then(() => resumed);
};

module.exports = sendADM;
