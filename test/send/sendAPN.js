/* eslint-env mocha */
import path from 'path';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import dirtyChai from 'dirty-chai';

import apn from 'apn';
import PN from '../../src';
import APN from '../../src/sendAPN';
import { sendOkMethodGCM, testPushSuccess, testPushError, testPushException } from '../util';

const { expect } = chai;
chai.use(dirtyChai);
chai.use(sinonChai);

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
const apnOptions = {
    cert: path.resolve('./test/send/cert.pem'),
    key: path.resolve('./test/send/key.pem'),
};
const pn = new PN({
    apn: apnOptions,
});
const fErr = new Error('Forced error');

const testSuccess = testPushSuccess(method, regIds);
const testSuccessGCM = testPushSuccess('gcm', regIds);
const testError = testPushError(method, regIds, fErr.message);
const testException = testPushException(fErr.message);

let sendMethod;

function sendOkMethod() {
    return sinon.stub(apn.Provider.prototype, 'send', (message, _regIds) => {
        expect(_regIds).to.be.instanceOf(Array);
        _regIds.forEach(regId => expect(regIds).to.include(regId));
        expect(message).to.be.instanceOf(apn.Notification);
        expect(message.aps.sound).to.eql(data.sound);
        expect(message.aps.alert.title).to.eql(data.title);
        expect(message.aps.alert.body).to.equal(data.body);
        expect(message.priority).to.equal(10);
        expect(message.payload).to.eql(data.custom);
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
        before(() => {
            sendMethod = sendOkMethod();
        });

        after(() => {
            sendMethod.restore();
        });

        it('all responses should be successful (callback)', (done) => {
            pn.send(regIds, data, (err, results) => testSuccess(err, results, done));
        });

        it('all responses should be successful (promise)', (done) => {
            pn.send(regIds, data)
                .then(results => testSuccess(null, results, done))
                .catch(done);
        });
    });

    describe('send push notifications successfully (no payload)', () => {
        before(() => {
            sendMethod = sinon.stub(apn.Provider.prototype, 'send', (message, _regIds) => {
                expect(_regIds).to.be.instanceOf(Array);
                _regIds.forEach(regId => expect(regIds).to.include(regId));
                expect(message).to.be.instanceOf(apn.Notification);
                expect(message.aps.alert.title).to.eql(data.title);
                expect(message.aps.alert.body).to.eql(data.body);
                expect(message.payload).to.eql({});
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
            pn.send(regIds, newData, (err, results) => testSuccess(err, results, done));
        });
    });

    describe('send silent push notifications', () => {
        before(() => {
            sendMethod = sinon.stub(apn.Provider.prototype, 'send', (message, _regIds) => {
                expect(_regIds).to.be.instanceOf(Array);
                _regIds.forEach(regId => expect(regIds).to.include(regId));
                expect(message).to.be.instanceOf(apn.Notification);
                expect(message.aps.sound).to.be.undefined();
                expect(message.aps.alert.title).to.be.undefined();
                expect(message.aps.alert.body).to.be.undefined();
                expect(message.aps.badge).to.be.undefined();
                expect(message.topic).to.equal('testTopic');
                expect(message.priority).to.equal(5);
                expect(message.aps['content-available']).to.equal(1);
                expect(message.payload).to.eql({ testKey: 'testValue' });
                return Promise.resolve({
                    sent: _regIds,
                });
            });
        });

        after(() => {
            sendMethod.restore();
        });

        it('all responses should be successful', (done) => {
            const silentPushData = {
                topic: 'testTopic',
                contentAvailable: true,
                priority: 'normal',
                custom: {
                    testKey: 'testValue',
                },
            };
            pn.send(regIds, silentPushData, (err, results) => testSuccess(err, results, done));
        });
    });

    describe('send push notifications with normal priority', () => {
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
            pn.send(regIds, normalPrioData, (err, results) => testSuccess(err, results, done));
        });
    });

    describe('send push notifications failure (response message)', () => {
        before(() => {
            sendMethod = sendFailureMethod1();
        });

        after(() => {
            sendMethod.restore();
        });

        it('all responses should be failed with response message (callback)', (done) => {
            pn.send(regIds, data, (err, results) => testError(err, results, done));
        });

        it('all responses should be failed with response message (promise)', (done) => {
            pn.send(regIds, data)
                .then(results => testError(null, results, done))
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
            pn.send(regIds, data, (err, results) => testError(err, results, done));
        });

        it('all responses should be failed with response reason (promise)', (done) => {
            pn.send(regIds, data)
                .then(results => testError(null, results, done))
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
            pn.send(regIds, data, (err, results) => testError(err, results, done));
        });

        it('the error should be reported (promise)', (done) => {
            pn.send(regIds, data)
                .then(results => testError(null, results, done))
                .catch(err => testError(err, undefined, done));
        });
    });

    describe('send push notifications throw exception', () => {
        before(() => {
            sendMethod = sendThrowExceptionMethod();
        });

        after(() => {
            sendMethod.restore();
        });

        it('the exception should be catched (callback)', (done) => {
            pn.send(regIds, data, (err, results) => testException(err, results, done))
                .catch(() => { }); // This is to avoid UnhandledPromiseRejectionWarning
        });

        it('the exception should be catched (promise)', (done) => {
            pn.send(regIds, data)
                .then(results => testException(null, results, done))
                .catch(err => testException(err, undefined, done));
        });
    });

    describe('shutdown', () => {
        const connectionStub = sinon.stub(apn.Provider.prototype, 'shutdown');
        const apnInstance = new APN(apnOptions);

        before(() => {
            apnInstance.shutdown();
        });

        after(() => {
            connectionStub.restore();
        });

        it('should shutdown the apn provider instance', () => {
            expect(connectionStub).to.have.been.calledOnce();
        });
    });

    describe('invalid provider settings', () => {
        const apnInstance = new APN();

        it('should not instantiate an APN provider instance', () => {
            expect(apnInstance.connection).to.be.null();
        });

        describe('send called if no provider instantiated', () => {
            it('should return a rejected promise', async () => {
                try {
                    await apnInstance.sendAPN(regIds, data);
                    throw new Error('failed to throw correct error');
                } catch (e) {
                    expect(e).to.be.an.instanceof(Error);
                    expect(e.message).to.equal('APN connection not configured properly');
                }
            });
        });
    });

    describe('send push notifications successfully using FCM', () => {
        const pnGCM = new PN({
            isAlwaysUseFCM: true,
        });
        before(() => {
            sendMethod = sendOkMethodGCM(regIds, data);
        });

        after(() => {
            sendMethod.restore();
        });

        it('all responses should be successful (callback)', (done) => {
            pnGCM.send(regIds, data, (err, results) => testSuccessGCM(err, results, done));
        });

        it('all responses should be successful (promise)', (done) => {
            pnGCM.send(regIds, data)
                .then(results => testSuccessGCM(null, results, done))
                .catch(done);
        });
    });
});
