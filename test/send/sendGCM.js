import { describe, it, before, after } from 'mocha'; // eslint-disable-line import/no-extraneous-dependencies
import { expect } from 'chai'; // eslint-disable-line import/no-extraneous-dependencies
import sinon from 'sinon'; // eslint-disable-line import/no-extraneous-dependencies
import gcm from 'node-gcm';
import PN from '../../src';

const method = 'gcm';
const regIds = [
    'APA91bFQCD9Ndd8uVggMhj1usfeWsKIfGyBUWMprpZLGciWrMjS-77bIY24IMQNeEHzjidCcddnDxqYo-UEV03xw6ySmtIgQyzTqhSxhPGAi1maf6KDMAQGuUWc6L5Khze8YK9YrL9I_WD1gl49P3f_9hr08ZAS5Tw',
    'APA91bFQCD9Ndd8uVggMhj1usfeWsKIfGyBUWMprpZLGciWrMjS-77bIY24IMQNeEHzjidCcddnDxqYo-UEV03xw6ySmtIgQyzTqhSxhPGAi1maf6KDMAQGuUWc6L5Khze8YK9YrL9I_WD1gl49P3f_9hr08ZAS5Tw',
    'APA91bFQCD9Ndd8uVggMhj1usfeWsKIfGyBUWMprpZLGciWrMjS-77bIY24IMQNeEHzjidCcddnDxqYo-UEV03xw6ySmtIgQyzTqhSxhPGAi1maf6KDMAQGuUWc6L5Khze8YK9YrL9I_WD1gl49P3f_9hr08ZAS5Tw',
];
const data = {
    title: 'title',
    body: 'body',
    sound: 'mySound.aiff',
    contentAvailable: true,
    custom: {
        sender: 'appfeel-test'
    },
};
const pn = new PN();
const fErr = new Error('Forced error');
let sendMethod;

function sendOkMethod() {
    return sinon.stub(gcm.Sender.prototype, 'send', (message, recipients, retries, cb) => {
        expect(recipients).to.be.instanceOf(Object);
        expect(recipients).to.have.property('registrationTokens');
        const { registrationTokens } = recipients;
        expect(registrationTokens).to.be.instanceOf(Array);
        registrationTokens.forEach(regId => expect(regIds).to.include(regId));
        expect(retries).to.be.a('number');
        expect(message).to.be.instanceOf(gcm.Message);
        expect(message).to.have.deep.property('params.notification.title', data.title);
        expect(message).to.have.deep.property('params.notification.body', data.body);
        expect(message).to.have.deep.property('params.notification.sound', data.sound);
        expect(message).to.have.deep.property('params.data.sender', data.custom.sender);
        // This params are duplicated in order to facilitate extraction
        // So they are available as `gcm.notification.title` and as `title`
        expect(message).to.have.deep.property('params.data.title', data.title);
        expect(message).to.have.deep.property('params.data.message', data.body);
        expect(message).to.have.deep.property('params.data.sound', data.sound);
        cb(null, {
            multicast_id: 'abc',
            success: registrationTokens.length,
            failure: 0,
            results: registrationTokens.map(token => ({
                message_id: '',
                registration_id: token,
                error: null,
            })),
        });
    });
}

function sendFailureMethod1() {
    return sinon.stub(gcm.Sender.prototype, 'send', (message, recipients, retries, cb) => {
        const { registrationTokens } = recipients;
        cb(null, {
            multicast_id: 'abc',
            success: 0,
            failure: regIds.length,
            results: registrationTokens.map(token => ({
                message_id: '',
                registration_id: token,
                error: fErr.message,
            })),
        });
    });
}

function sendFailureMethod2() {
    return sinon.stub(gcm.Sender.prototype, 'send', (message, recipients, retries, cb) => {
        const { registrationTokens } = recipients;
        cb(null, {
            multicast_id: 'abc',
            success: 0,
            failure: regIds.length,
        });
    });
}

function sendErrorMethod() {
    return sinon.stub(gcm.Sender.prototype, 'send', (message, recipients, retries, cb) => {
        const { registrationTokens } = recipients;
        cb(fErr);
    });
}

function sendThrowExceptionMethod() {
    return sinon.stub(gcm.Sender.prototype, 'send', () => {
        throw fErr;
    });
}

describe('push-notifications-gcm', () => {
    describe('send push notifications successfully', () => {
        const test = (err, results, done) => {
            try {
                expect(err).to.equal(null);
                results.forEach((result) => {
                    expect(result.method).to.equal(method);
                    expect(result.success).to.equal(regIds.length);
                    expect(result.failure).to.equal(0);
                    expect(result.message.length).to.equal(regIds.length);
                    result.message.forEach((message) => {
                        expect(message).to.have.property('regId');
                        expect(regIds).to.include(message.regId);
                    });
                });
                done(err);
            } catch (e) {
                done(err || e);
            }
        };

        before(() => {
            sendMethod = sendOkMethod();
        });

        after(() => {
            sendMethod.restore();
        });

        it('all responses should be successful (callback)', (done) => {
            pn.send(regIds, data, (err, results) => test(err, results, done));
        });

        it('all responses should be successful (promise)', (done) => {
            pn.send(regIds, data)
                .then(results => test(null, results, done))
                .catch(done);
        });
    });

    describe('send push notifications in phonegap-push compatibility mode', () => {
        const pushPhoneGap = new PN({
            gcm: {
              phonegap: true
            }
        });

        const test = (err, results, done) => {
            try {
                expect(err).to.equal(null);
                results.forEach((result) => {
                    expect(result.method).to.equal(method);
                    expect(result.success).to.equal(regIds.length);
                    expect(result.failure).to.equal(0);
                    expect(result.message.length).to.equal(regIds.length);
                    result.message.forEach((message) => {
                        expect(message).to.have.property('regId');
                        expect(regIds).to.include(message.regId);
                    });
                });
                done(err);
            } catch (e) {
                done(err || e);
            }
        };

        before(() => {
            sendMethod = sinon.stub(gcm.Sender.prototype, 'send', (message, recipients, retries, cb) => {
                expect(recipients).to.be.instanceOf(Object);
                expect(recipients).to.have.property('registrationTokens');
                const { registrationTokens } = recipients;
                expect(registrationTokens).to.be.instanceOf(Array);
                registrationTokens.forEach(regId => expect(regIds).to.include(regId));
                expect(retries).to.be.a('number');
                expect(message).to.be.instanceOf(gcm.Message);
                expect(message.notification).to.be.undefined;
                expect(message).to.have.deep.property('params.data.sender', data.custom.sender);
                expect(message).to.have.deep.property('params.data.title', data.title);
                expect(message).to.have.deep.property('params.data.message', data.body);
                expect(message).to.have.deep.property('params.data.sound', data.sound);
                expect(message).to.have.deep.property('params.data.content-available', 1);
                cb(null, {
                    multicast_id: 'abc',
                    success: registrationTokens.length,
                    failure: 0,
                    results: registrationTokens.map(token => ({
                        message_id: '',
                        registration_id: token,
                        error: null,
                    })),
                });
            });
        });

        after(() => {
            sendMethod.restore();
        });

        it('all responses should be successful (callback)', (done) => {
            pushPhoneGap.send(regIds, data, (err, results) => test(err, results, done));
        });

        it('all responses should be successful (promise)', (done) => {
            pushPhoneGap.send(regIds, data)
                .then(results => test(null, results, done))
                .catch(done);
        });
    });

    {
        const test = (err, results, done) => {
            try {
                expect(err).to.equal(null);
                results.forEach((result) => {
                    expect(result.method).to.equal(method);
                    expect(result.success).to.equal(0);
                    expect(result.failure).to.equal(regIds.length);
                    expect(result.message.length).to.equal(regIds.length);
                    result.message.forEach((message) => {
                        expect(message).to.have.property('regId');
                        expect(regIds).to.include(message.regId);
                        expect(message).to.have.property('error');
                        expect(message.error).to.be.instanceOf(Error);
                        expect(message.error.message).to.equal(fErr.message);
                    });
                });
                done(err);
            } catch (e) {
                done(err || e);
            }
        };

        describe('send push notifications failure (with response)', () => {
            before(() => {
                sendMethod = sendFailureMethod1();
            });

            after(() => {
                sendMethod.restore();
            });

            it('all responses should be failed (callback)', (done) => {
                pn.send(regIds, data, (err, results) => test(err, results, done));
            });

            it('all responses should be failed (promise)', (done) => {
                pn.send(regIds, data)
                    .then(results => test(null, results, done))
                    .catch(done);
            });
        });


        describe('send push notifications error', () => {
            before(() => {
                sendMethod = sendErrorMethod();
            });

            after(() => {
                sendMethod.restore();
            });

            it('the error should be reported (callback)', (done) => {
                pn.send(regIds, data, (err, results) => test(err, results, done));
            });

            it('the error should be reported (promise)', (done) => {
                pn.send(regIds, data)
                    .then(results => test(null, results, done))
                    .catch(err => test(err, undefined, done));
            });
        });
    }

    {
        const test = (err, results, done) => {
            try {
                expect(err).to.equal(null);
                results.forEach((result) => {
                    expect(result.method).to.equal(method);
                    expect(result.success).to.equal(0);
                    expect(result.failure).to.equal(regIds.length);
                    expect(result.message.length).to.equal(regIds.length);
                    result.message.forEach((message) => {
                        expect(message).to.have.property('regId');
                        expect(regIds).to.include(message.regId);
                        expect(message).to.have.property('error');
                        expect(message.error).to.be.instanceOf(Error);
                        expect(message.error.message).to.equal('unknown');
                    });
                });
                done(err);
            } catch (e) {
                done(err || e);
            }
        };
        describe('send push notifications failure (without response)', () => {
            before(() => {
                sendMethod = sendFailureMethod2();
            });

            after(() => {
                sendMethod.restore();
            });

            it('all responses should be failed (callback)', (done) => {
                pn.send(regIds, data, (err, results) => test(err, results, done));
            });

            it('all responses should be failed (promise)', (done) => {
                pn.send(regIds, data)
                    .then(results => test(null, results, done))
                    .catch(done);
            });
        });
    }

    describe('send push notifications throw exception', () => {
        const test = (err, results, done) => {
            try {
                expect(results).to.equal(undefined);
                expect(err).to.be.instanceOf(Error);
                expect(err.message).to.equal(fErr.message);
                done();
            } catch (e) {
                done(err || e);
            }
        };

        before(() => {
            sendMethod = sendThrowExceptionMethod();
        });

        after(() => {
            sendMethod.restore();
        });

        it('the exception should be catched (callback)', (done) => {
            pn.send(regIds, data, (err, results) => test(err, results, done))
                .catch(() => { }); // This is to avoid UnhandledPromiseRejectionWarning
        });

        it('the exception should be catched (promise)', (done) => {
            pn.send(regIds, data)
                .then(results => test(null, results, done))
                .catch(err => test(err, undefined, done));
        });
    });
});
