import path from 'path';
import { describe, it, before, after } from 'mocha'; // eslint-disable-line import/no-extraneous-dependencies
import { expect } from 'chai'; // eslint-disable-line import/no-extraneous-dependencies
import sinon from 'sinon'; // eslint-disable-line import/no-extraneous-dependencies
import apn from 'apn';
import PN from '../../src';

const method = 'apn';
const regIds = [
    '43e798c31a282d129a34d84472bbdd7632562ff0732b58a85a27c5d9fdf59b69',
    '43e798c31a282d129a34d84472bbdd7632562ff0732b58a85a27c5d9fdf59b69',
    '43e798c31a282d129a34d84472bbdd7632562ff0732b58a85a27c5d9fdf59b69',
];
const data = {
    title: 'title',
    body: 'body',
    sound: 'mySound.aiff',
    custom: {
        sender: 'appfeel-test',
    },
};
const pn = new PN({
    apn: {
        cert: path.resolve('./test/send/cert.pem'),
        key: path.resolve('./test/send/key.pem'),
    },
});
const fErr = new Error('Forced error');
let sendMethod;

function sendOkMethod() {
    return sinon.stub(apn.Provider.prototype, 'send', (message, _regIds) => {
        expect(_regIds).to.be.instanceOf(Array);
        _regIds.forEach(regId => expect(regIds).to.include(regId));
        expect(message).to.be.instanceOf(apn.Notification);
        expect(message).to.have.deep.property('aps.sound', data.sound);
        expect(message).to.have.deep.property('aps.alert.title', data.title);
        expect(message).to.have.deep.property('aps.alert.body', data.body);
        expect(message).to.have.deep.property('priority', 10);
        expect(message).to.have.deep.property('payload', data.custom);
        return Promise.resolve({
            sent: _regIds,
        });
    });
}

function sendFailureMethod1() {
    return sinon.stub(apn.Provider.prototype, 'send', (message, _regIds) => Promise.resolve({
        failed: _regIds.map(regId => ({
            device: regId,
            response: fErr.message,
        })),
    }));
}
function sendFailureMethod2() {
    return sinon.stub(apn.Provider.prototype, 'send', (message, _regIds) => Promise.resolve({
        failed: _regIds.map(regId => ({
            device: regId,
            response: {
                reason: fErr.message,
            },
        })),
    }));
}

function sendErrorMethod() {
    return sinon.stub(apn.Provider.prototype, 'send', (message, _regIds) => Promise.resolve({
        failed: _regIds.map(regId => ({
            device: regId,
            error: fErr,
        })),
    }));
}

function sendThrowExceptionMethod() {
    return sinon.stub(apn.Provider.prototype, 'send', () => Promise.reject(fErr));
}

describe('push-notifications-apn', () => {
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

    describe('once notification has been sent', () => {
        before(() => {
            sendMethod = sendOkMethod();
            sinon.stub(apn.Provider.prototype, 'shutdown')
        });

        after(() => {
            sendMethod.restore();
            apn.Provider.prototype.shutdown.restore()
        });

        it('shuts down the provider instance', (done) => {
            pn.send(regIds, data, (err, results) => {
                sinon.assert.calledOnce(apn.Provider.prototype.shutdown)
                done()
            });
        });
    });

    describe('send push notifications successfully (no payload)', () => {
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
            sendMethod = sinon.stub(apn.Provider.prototype, 'send', (message, _regIds) => {
                expect(_regIds).to.be.instanceOf(Array);
                _regIds.forEach(regId => expect(regIds).to.include(regId));
                expect(message).to.be.instanceOf(apn.Notification);
                expect(message).to.have.deep.property('aps.sound', 'ping.aiff');
                expect(message).to.have.deep.property('aps.alert.title', data.title);
                expect(message).to.have.deep.property('aps.alert.body', data.body);
                expect(message).to.have.deep.property('payload').deep.equal({});
                return Promise.resolve({
                    sent: _regIds,
                });
            });
        });

        after(() => {
            sendMethod.restore();
        });

        it('all responses should be successful (callback no payload, no sound)', (done) => {
            const newData = Object.assign({}, data);
            delete newData.custom;
            delete newData.sound;
            pn.send(regIds, newData, (err, results) => test(err, results, done));
        });
    });

    describe('send push notifications with normal priority', () => {
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
            sendMethod = sinon.stub(apn.Provider.prototype, 'send', (message, _regIds) => {
                expect(_regIds).to.be.instanceOf(Array);
                _regIds.forEach(regId => expect(regIds).to.include(regId));
                expect(message).to.be.instanceOf(apn.Notification);
                expect(message).to.have.deep.property('priority', 5);
                return Promise.resolve({
                    sent: _regIds,
                });
            });
        });

        after(() => {
            sendMethod.restore();
        });

        it('all responses should be successful (callback no payload, no sound)', (done) => {
            const normalPrioData = Object.assign({}, data);
            normalPrioData.priority = 'normal';
            pn.send(regIds, normalPrioData, (err, results) => test(err, results, done));
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

        describe('send push notifications failure (response message)', () => {
            before(() => {
                sendMethod = sendFailureMethod1();
            });

            after(() => {
                sendMethod.restore();
            });

            it('all responses should be failed with response message (callback)', (done) => {
                pn.send(regIds, data, (err, results) => test(err, results, done));
            });

            it('all responses should be failed with response message (promise)', (done) => {
                pn.send(regIds, data)
                    .then(results => test(null, results, done))
                    .catch(done);
            });
        });

        describe('send push notifications failure (response reason)', () => {
            before(() => {
                sendMethod = sendFailureMethod2();
            });

            after(() => {
                sendMethod.restore();
            });

            it('all responses should be failed with response reason (callback)', (done) => {
                pn.send(regIds, data, (err, results) => test(err, results, done));
            });

            it('all responses should be failed with response reason (promise)', (done) => {
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
