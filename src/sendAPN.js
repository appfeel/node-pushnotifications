const apn = require('apn');

const method = 'apn';

module.exports = (regIds, data, settings) => {
    const notification = {
        retryLimit: data.retries || -1,
        expiry: data.expiry || ((data.timeToLive || 28 * 86400) + Math.floor(Date.now() / 1000)),
        priority: data.priority === 'normal' ? 5 : 10,
        encoding: data.encoding,
        payload: data.custom || {},
        badge: data.badge,
        topic: data.topic,
        category: data.category || data.clickAction,
        contentAvailable: data.contentAvailable,
        mdm: data.mdm,
        urlArgs: data.urlArgs,
        truncateAtWordEnd: data.truncateAtWordEnd,
        collapseId: data.collapseKey,
        mutableContent: data.mutableContent || 0,
    };

    if (!data.silent) {
        notification.sound = data.sound || 'ping.aiff';
        notification.alert = data.alert || {
            title: data.title,
            body: data.body,
            'title-loc-key': data.titleLocKey,
            'title-loc-args': data.titleLocArgs,
            'loc-key': data.locKey,
            'loc-args': data.bodyLocArgs,
            'launch-image': data.launchImage,
            action: data.action,
        };
    }

    const message = new apn.Notification(notification);

    const connection = new apn.Provider(settings.apn);

    return connection.send(message, regIds)
        .then((response) => {
            const resumed = {
                method,
                success: 0,
                failure: 0,
                message: [],
            };
            (response.sent || []).forEach((token) => {
                resumed.success += 1;
                resumed.message.push({
                    regId: token,
                    error: null,
                });
            });
            (response.failed || []).forEach((failure) => {
                resumed.failure += 1;
                if (failure.error) {
                    // A transport-level error occurred (e.g. network problem)
                    resumed.message.push({
                        regId: failure.device,
                        error: failure.error,
                    });
                } else {
                    // `failure.status` is the HTTP status code
                    // `failure.response` is the JSON payload
                    resumed.message.push({
                        regId: failure.device,
                        error: new Error(failure.response.reason || failure.response),
                    });
                }
            });
            return resumed;
        });
};
