const wns = require('wns');

const method = 'wns';
let resumed;

function processResponse(err, response, regId) {
    resumed.success += err || response.innerError ? 0 : 1;
    resumed.failure += err || response.innerError ? 1 : 0;
    resumed.message.push({
        regId,
        error: err || (response.innerError ? new Error(response.innerError) : null),
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
                    sendNotifications(regIds, notificationMethod, data, Object.assign({}, opts, {
                        accessToken: response.newAccessToken,
                    }), onFinish);
                });
            } catch (err) {
                sendPromises.push(Promise.reject(err));
                sendNotifications(regIds, notificationMethod, data, opts, onFinish);
            }
        } else {
            Promise.all(sendPromises)
                .then(() => onFinish(), onFinish);
        }
    }


    const promises = [];
    const notificationMethod = settings.wns.notificationMethod;
    const opts = Object.assign({}, settings.wns);
    const data = Object.assign({}, _data);

    resumed = {
        method,
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
        promises.push(new Promise((resolve, reject) =>
            sendNotifications(regIds, notificationMethod, data, opts, err =>
                (err ? reject(err) : resolve())
            )
        ));
    } else {
        _regIds.forEach(regId => promises.push(new Promise(resolve =>
            wns[notificationMethod](regId, data, opts, (err, response) => {
                processResponse(err, response, regId);
                resolve();
            })
        )));
    }

    return Promise.all(promises)
        .then(() => resumed);
};

module.exports = sendWNS;
