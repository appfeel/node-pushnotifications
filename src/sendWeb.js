const webPush = require('web-push');

const method = 'webPush';

const sendWebPush = async (regIds, data, settings) => {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    const promises = regIds.map(regId => (webPush.sendNotification(regId, payload, settings.web)
        .then(() => ({
            success: 1,
            failure: 0,
            message: [{
                regId,
                error: null,
            }],
        }))
        .catch(err => ({
            success: 0,
            failure: 1,
            message: [{
                regId,
                error: err,
                errorMsg: err.message,
            }],
        }))
    ));

    const results = await Promise.all(promises);

    const reduced = results.reduce((acc, current) => ({
        success: acc.success + current.success,
        failure: acc.failure + current.failure,
        message: [...acc.message, ...current.message],
    }));
    reduced.method = method;
    return reduced;
};

module.exports = sendWebPush;
