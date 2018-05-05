const apn = require('apn');

const method = 'apn';
const defaultExpiry = ttl => (typeof ttl === 'number' ? ttl : 28 * 86400) + Math.floor(Date.now() / 1000);

class APN {
    constructor(settings) {
        try {
            this.connection = new apn.Provider(settings);
        } catch (e) {
            this.connection = null;
        }
    }

    shutdown() {
        if (this.connection) {
            this.connection.shutdown();
        }
    }

    sendAPN(regIds, data) {
        const message = new apn.Notification({
            retryLimit: data.retries || -1,
            expiry: data.expiry || defaultExpiry(data.timeToLive),
            priority: data.priority === 'normal' ? 5 : 10,
            encoding: data.encoding,
            payload: data.custom || {},
            badge: data.badge,
            sound: data.sound,
            alert: data.alert || {
                title: data.title,
                body: data.body,
                'title-loc-key': data.titleLocKey,
                'title-loc-args': data.titleLocArgs,
                'loc-key': data.locKey,
                'loc-args': data.bodyLocArgs,
                'launch-image': data.launchImage,
                action: data.action,
            },
            topic: data.topic,
            category: data.category || data.clickAction,
            contentAvailable: data.contentAvailable,
            mdm: data.mdm,
            urlArgs: data.urlArgs,
            truncateAtWordEnd: data.truncateAtWordEnd,
            collapseId: data.collapseKey,
            mutableContent: data.mutableContent || 0,
            threadId: data.threadId,
        });

        if (!this.connection) {
            return Promise.reject(new Error('APN connection not configured properly'));
        }

        return this.connection.send(message, regIds)
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
    }
}

module.exports = APN;
