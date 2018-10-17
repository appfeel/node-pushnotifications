/* eslint-env mocha */
import chai from 'chai';
import sinon from 'sinon';
import dirtyChai from 'dirty-chai';
import gcm from 'node-gcm';
import PN from '../../src';
import {
    sendOkMethodGCM, testPushSuccess,
    testPushError, testPushException,
} from '../util';

const { expect } = chai;
chai.use(dirtyChai);

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
        sender: 'appfeel-test',
    },
};
const gcmOpts = {
    gcm: {
        id: 'your id',
    },
};
const pn = new PN(gcmOpts);
const fErr = new Error('Forced error');

const testSuccess = testPushSuccess(method, regIds);
const testError = testPushError(method, regIds, fErr.message);
const testUnknownError = testPushError(method, regIds, 'unknown');
const testException = testPushException(fErr.message);

let sendMethod;

function sendFailureMethod1() {
    // Don't use arrow function because we use this!!
    return sinon.stub(gcm.Sender.prototype, 'send', function SenderSend(message, recipients, retries, cb) {
        const { registrationTokens } = recipients;
        expect(this.key).equal(gcmOpts.gcm.id);
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
        cb(null, {
            multicast_id: 'abc',
            success: 0,
            failure: regIds.length,
        });
    });
}

function sendErrorMethod() {
    return sinon.stub(gcm.Sender.prototype, 'send', (message, recipients, retries, cb) => {
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
        before(() => {
            sendMethod = sendOkMethodGCM(regIds, data);
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

    describe('send push notifications successfully, data no title', () => {
        before(() => {
            sendMethod = sinon.stub(gcm.Sender.prototype, 'send', (message, recipients, retries, cb) => {
                expect(recipients).to.be.instanceOf(Object);
                expect(recipients).to.have.property('registrationTokens');
                const { registrationTokens } = recipients;
                expect(registrationTokens).to.be.instanceOf(Array);
                registrationTokens.forEach(regId => expect(regIds).to.include(regId));
                expect(retries).to.be.a('number');
                expect(message).to.be.instanceOf(gcm.Message);
                expect(message.params.notification.title).to.be.undefined();
                expect(message.params.notification.body).to.eql(data.body);
                expect(message.params.notification.sound).to.eql(data.sound);
                expect(message.params.data.sender).to.eql(data.custom.sender);
                // This params are duplicated in order to facilitate extraction
                // So they are available as `gcm.notification.title` and as `title`
                expect(message.params.data.title).to.be.undefined();
                expect(message.params.data.message).to.eql(data.body);
                expect(message.params.data.sound).to.eql(data.sound);
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

        it('all responses should be successful (callback, no title)', (done) => {
            const newData = Object.assign({}, data);
            delete newData.title;
            const callback = (err, results) => testSuccess(err, results, done);
            pn.send(regIds, newData, callback)
                .catch(() => { });
        });
    });

    describe('send push notifications successfully, (callback, no sound, icon, msgcnt)', () => {
        before(() => {
            sendMethod = sinon.stub(gcm.Sender.prototype, 'send', (message, recipients, retries, cb) => {
                expect(recipients).to.be.instanceOf(Object);
                expect(recipients).to.have.property('registrationTokens');
                const { registrationTokens } = recipients;
                expect(registrationTokens).to.be.instanceOf(Array);
                registrationTokens.forEach(regId => expect(regIds).to.include(regId));
                expect(retries).to.be.a('number');
                expect(message).to.be.instanceOf(gcm.Message);
                expect(message.params.notification.title).to.eql(data.title);
                expect(message.params.notification.body).to.eql(data.body);
                expect(message.params.notification.sound).to.be.undefined();
                expect(message.params.notification.icon).to.equal('myicon.png');
                expect(message.params.data.sender).to.eql(data.custom.sender);
                // This params are duplicated in order to facilitate extraction
                // So they are available as `gcm.notification.title` and as `title`
                expect(message.params.data.title).to.eql(data.title);
                expect(message.params.data.message).to.eql(data.body);
                expect(message.params.data.sound).to.be.undefined();
                expect(message.params.data.icon).to.equal('myicon.png');
                expect(message.params.data.msgcnt).to.equal(2);
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

        it('all responses should be successful (callback, no sound, icon, msgcnt)', (done) => {
            const newData = Object.assign({}, data);
            delete newData.sound;
            newData.icon = 'myicon.png';
            newData.custom.msgcnt = 2;
            const callback = (err, results) => testSuccess(err, results, done);
            pn.send(regIds, newData, callback)
                .catch(() => { });
        });
    });

    describe('send push notifications successfully, (callback, no contentAvailable)', () => {
        before(() => {
            sendMethod = sinon.stub(gcm.Sender.prototype, 'send', (message, recipients, retries, cb) => {
                expect(recipients).to.be.instanceOf(Object);
                expect(recipients).to.have.property('registrationTokens');
                const { registrationTokens } = recipients;
                expect(registrationTokens).to.be.instanceOf(Array);
                registrationTokens.forEach(regId => expect(regIds).to.include(regId));
                expect(retries).to.be.a('number');
                expect(message).to.be.instanceOf(gcm.Message);
                expect(message.params.notification.title).to.eql(data.title);
                expect(message.params.notification.body).to.eql(data.body);
                expect(message.params.notification.sound).to.eql(data.sound);
                expect(message.params.data.sender).to.eql(data.custom.sender);
                // This params are duplicated in order to facilitate extraction
                // So they are available as `gcm.notification.title` and as `title`
                expect(message.params.data.title).to.eql(data.title);
                expect(message.params.data.message).to.eql(data.body);
                expect(message.params.data.sound).to.eql(data.sound);
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

        it('all responses should be successful (callback, no contentAvailable)', (done) => {
            const newData = Object.assign({}, data);
            delete newData.contentAvailable;
            const callback = (err, results) => testSuccess(err, results, done);
            pn.send(regIds, newData, callback)
                .catch(() => { });
        });
    });

    describe('send push notifications successfully, data no body', () => {
        before(() => {
            sendMethod = sinon.stub(gcm.Sender.prototype, 'send', (message, recipients, retries, cb) => {
                expect(recipients).to.be.instanceOf(Object);
                expect(recipients).to.have.property('registrationTokens');
                const { registrationTokens } = recipients;
                expect(registrationTokens).to.be.instanceOf(Array);
                registrationTokens.forEach(regId => expect(regIds).to.include(regId));
                expect(retries).to.be.a('number');
                expect(message).to.be.instanceOf(gcm.Message);
                expect(message.params.notification.title).to.eql(data.title);
                expect(message.params.notification.body).to.be.undefined();
                expect(message.params.notification.sound).to.eql(data.sound);
                expect(message.params.data.sender).to.eql(data.custom.sender);
                // This params are duplicated in order to facilitate extraction
                // So they are available as `gcm.notification.title` and as `title`
                expect(message.params.data.title).to.eql(data.title);
                expect(message.params.data.message).to.be.undefined();
                expect(message.params.data.sound).to.eql(data.sound);
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

        it('all responses should be successful (callback, no body)', (done) => {
            const newData = Object.assign({}, data);
            delete newData.body;
            const callback = (err, results) => testSuccess(err, results, done);
            pn.send(regIds, newData, callback)
                .catch(() => { });
        });
    });

    describe('send push notifications successfully, custom data string', () => {
        before(() => {
            sendMethod = sinon.stub(gcm.Sender.prototype, 'send', (message, recipients, retries, cb) => {
                expect(recipients).to.be.instanceOf(Object);
                expect(recipients).to.have.property('registrationTokens');
                const { registrationTokens } = recipients;
                expect(registrationTokens).to.be.instanceOf(Array);
                registrationTokens.forEach(regId => expect(regIds).to.include(regId));
                expect(retries).to.be.a('number');
                expect(message).to.be.instanceOf(gcm.Message);
                expect(message.params.notification.title).to.eql(data.title);
                expect(message.params.notification.body).to.eql(data.body);
                expect(message.params.notification.sound).to.eql(data.sound);
                expect(message.params.data.message).to.equal('this is a string');
                // This params are duplicated in order to facilitate extraction
                // So they are available as `gcm.notification.title` and as `title`
                expect(message.params.data.title).to.eql(data.title);
                expect(message.params.data.message).to.equal('this is a string');
                expect(message.params.data.sound).to.eql(data.sound);
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

        it('all responses should be successful (callback, custom data as string)', (done) => {
            const newData = Object.assign({}, data, { custom: 'this is a string' });
            pn.send(regIds, newData, (err, results) => testSuccess(err, results, done));
        });
    });

    describe('send push notifications successfully, custom data undefined', () => {
        before(() => {
            sendMethod = sinon.stub(gcm.Sender.prototype, 'send', (message, recipients, retries, cb) => {
                expect(recipients).to.be.instanceOf(Object);
                expect(recipients).to.have.property('registrationTokens');
                const { registrationTokens } = recipients;
                expect(registrationTokens).to.be.instanceOf(Array);
                registrationTokens.forEach(regId => expect(regIds).to.include(regId));
                expect(retries).to.be.a('number');
                expect(message).to.be.an.instanceOf(gcm.Message);
                expect(message.params.notification.title).to.eql(data.title);
                expect(message.params.notification.body).to.eql(data.body);
                expect(message.params.notification.sound).to.eql(data.sound);
                expect(message.params.notification.data).to.be.undefined();
                // This params are duplicated in order to facilitate extraction
                // So they are available as `gcm.notification.title` and as `title`
                expect(message.params.data.title).to.eql(data.title);
                expect(message.params.data.message).to.eql(data.body);
                expect(message.params.data.sound).to.eql(data.sound);
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

        it('all responses should be successful (callback, custom data undefined)', (done) => {
            const newData = Object.assign({}, data);
            delete newData.custom;
            pn.send(regIds, newData, (err, results) => testSuccess(err, results, done));
        });
    });

    describe('send push notifications successfully, normal priority', () => {
        before(() => {
            sendMethod = sinon.stub(gcm.Sender.prototype, 'send', (message, recipients, retries, cb) => {
                expect(recipients).to.be.instanceOf(Object);
                expect(recipients).to.have.property('registrationTokens');
                const { registrationTokens } = recipients;
                expect(registrationTokens).to.be.instanceOf(Array);
                registrationTokens.forEach(regId => expect(regIds).to.include(regId));
                expect(retries).to.be.a('number');
                expect(message).to.be.instanceOf(gcm.Message);
                expect(message.params.priority).to.equal('normal');
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

        it('all responses should be successful (callback, custom data undefined)', (done) => {
            const normalPrioData = Object.assign({}, data);
            normalPrioData.priority = 'normal';
            pn.send(regIds, normalPrioData, (err, results) => testSuccess(err, results, done));
        });
    });

    describe('send silent push notifications', () => {
        before(() => {
            sendMethod = sinon.stub(gcm.Sender.prototype, 'send', (message, recipients, retries, cb) => {
                expect(recipients).to.be.instanceOf(Object);
                expect(recipients).to.have.property('registrationTokens');
                const { registrationTokens } = recipients;
                expect(registrationTokens).to.be.instanceOf(Array);
                registrationTokens.forEach(regId => expect(regIds).to.include(regId));
                expect(retries).to.be.a('number');
                expect(message).to.be.instanceOf(gcm.Message);
                expect(message.params.priority).to.equal('normal');
                expect(message.params.contentAvailable).to.be.true();
                expect(message.params.data.testKey).to.eql('testValue');
                expect(message.params.data.title).to.be.undefined();
                expect(message.params.data.message).to.be.undefined();
                expect(message.params.data.body).to.be.undefined();
                expect(message.params.data.sound).to.be.undefined();
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

        it('all responses should be successful (callback, custom data undefined)', (done) => {
            const silentPushData = {
                contentAvailable: true,
                priority: 'normal',
                custom: {
                    testKey: 'testValue',
                },
            };
            pn.send(regIds, silentPushData, (err, results) => testSuccess(err, results, done));
        });
    });

    describe('send push notifications in phonegap-push compatibility mode', () => {
        const pushPhoneGap = new PN({
            gcm: {
                phonegap: true,
            },
        });

        before(() => {
            sendMethod = sinon.stub(gcm.Sender.prototype, 'send', (message, recipients, retries, cb) => {
                expect(recipients).to.be.instanceOf(Object);
                expect(recipients).to.have.property('registrationTokens');
                const { registrationTokens } = recipients;
                expect(registrationTokens).to.be.an.instanceOf(Array);
                registrationTokens.forEach(regId => expect(regIds).to.include(regId));
                expect(retries).to.be.a('number');
                expect(message).to.be.instanceOf(gcm.Message);
                expect(message.notification).to.be.undefined();
                expect(message.params.data.sender).to.eql(data.custom.sender);
                expect(message.params.data.title).to.eql(data.title);
                expect(message.params.data.body).to.eql(data.body);
                expect(message.params.data.sound).to.eql(data.sound);
                expect(message.params.data['content-available']).to.equal(1);
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
            pushPhoneGap.send(regIds, data, (err, results) => testSuccess(err, results, done));
        });

        it('all responses should be successful (promise)', (done) => {
            pushPhoneGap.send(regIds, data)
                .then(results => testSuccess(null, results, done))
                .catch(done);
        });
    });


    describe('send push notifications failure (with response)', () => {
        before(() => {
            sendMethod = sendFailureMethod1();
        });

        after(() => {
            sendMethod.restore();
        });

        it('all responses should be failed (callback)', (done) => {
            pn.send(regIds, data, (err, results) => testError(err, results, done));
        });

        it('all responses should be failed (promise)', (done) => {
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

    describe('send push notifications failure (without response)', () => {
        before(() => {
            sendMethod = sendFailureMethod2();
        });

        after(() => {
            sendMethod.restore();
        });

        it('all responses should be failed (callback)', (done) => {
            pn.send(regIds, data, (err, results) => testUnknownError(err, results, done));
        });

        it('all responses should be failed (promise)', (done) => {
            pn.send(regIds, data)
                .then(results => testUnknownError(null, results, done))
                .catch(done);
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
});
