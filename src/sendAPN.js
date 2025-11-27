const apn = require('@parse/node-apn');
const { APN_METHOD } = require('./constants');
const { buildApnsMessage } = require('./utils/tools');

const getDeviceTokenOrSelf = (token) => token?.device ?? token;

class APN {
  constructor(settings) {
    try {
      this.connection = new apn.Provider(settings);
    } catch (e) {
      this.connectionError = e;
      this.connection = null;
    }
  }

  shutdown() {
    if (this.connection) {
      this.connection.shutdown();
    }
  }

  sendAPN(regIds, data) {
    const message = buildApnsMessage(data);

    if (!this.connection) {
      return Promise.reject(
        this.connectionError ||
          new Error('Unknown error: APN connection not configured properly')
      );
    }

    return this.connection.send(message, regIds).then((response) => {
      const resumed = {
        method: APN_METHOD,
        success: 0,
        failure: 0,
        message: [],
      };
      (response.sent || []).forEach((token) => {
        resumed.success += 1;
        resumed.message.push({
          regId: getDeviceTokenOrSelf(token),
          error: null,
        });
      });
      (response.failed || []).forEach((failure) => {
        // See https://github.com/node-apn/node-apn/blob/master/doc/provider.markdown#failed
        resumed.failure += 1;
        if (failure.error) {
          // A transport-level error occurred (e.g. network problem)
          resumed.message.push({
            regId: failure.device,
            error: failure.error,
            errorMsg: failure.error.message || failure.error,
          });
        } else {
          // `failure.status` is the HTTP status code
          // `failure.response` is the JSON payload
          resumed.message.push({
            regId: failure.device,
            error:
              failure.response.reason || failure.status
                ? new Error(failure.response.reason || failure.status)
                : failure.response,
            errorMsg: failure.response.reason || failure.status,
          });
        }
      });

      return resumed;
    });
  }
}

module.exports = APN;
