import { describe, it, before, after } from 'mocha'; // eslint-disable-line import/no-extraneous-dependencies
import { expect } from 'chai'; // eslint-disable-line import/no-extraneous-dependencies
import sinon from 'sinon'; // eslint-disable-line import/no-extraneous-dependencies
import adm from 'node-adm';
import PN from '../../src';

const method = 'adm';
const regIds = [
    'amzn1.adm-registration.v2.Y29tLmFtYXpvbi5EZXZpY2VNZXNzYWdpbmcuUmVnaXN0cmF0aW9uSWRFbmNyeXB0aW9uS2V5ITEhOE9rZ2h5TXlhVEFFczg2ejNWL3JMcmhTa255Uk5BclhBbE1XMFZzcnU1aFF6cTlvdU5FbVEwclZmdk5oTFBVRXVDN1luQlRSNnRVRUViREdQSlBvSzRNaXVRRUlyUy9NYWZCYS9VWTJUaGZwb3ZVTHhlRTM0MGhvampBK01hVktsMEhxakdmQStOSXRjUXBTQUhNU1NlVVVUVkFreVRhRTBCYktaQ2ZkUFdqSmIwcHgzRDhMQnllVXdxQ2EwdHNXRmFVNklYL0U4UXovcHg0K3Jjb25VbVFLRUVVOFVabnh4RDhjYmtIcHd1ZThiekorbGtzR2taMG95cC92Y3NtZytrcTRPNjhXUUpiZEk3QzFvQThBRTFWWXM2NHkyMjdYVGV5RlhhMWNHS0k9IW5GNEJMSXNleC9xbWpHSU52NnczY0E9PQ',
    'amzn1.adm-registration.v2.Y29tLmFtYXpvbi5EZXZpY2VNZXNzYWdpbmcuUmVnaXN0cmF0aW9uSWRFbmNyeXB0aW9uS2V5ITEhOE9rZ2h5TXlhVEFFczg2ejNWL3JMcmhTa255Uk5BclhBbE1XMFZzcnU1aFF6cTlvdU5FbVEwclZmdk5oTFBVRXVDN1luQlRSNnRVRUViREdQSlBvSzRNaXVRRUlyUy9NYWZCYS9VWTJUaGZwb3ZVTHhlRTM0MGhvampBK01hVktsMEhxakdmQStOSXRjUXBTQUhNU1NlVVVUVkFreVRhRTBCYktaQ2ZkUFdqSmIwcHgzRDhMQnllVXdxQ2EwdHNXRmFVNklYL0U4UXovcHg0K3Jjb25VbVFLRUVVOFVabnh4RDhjYmtIcHd1ZThiekorbGtzR2taMG95cC92Y3NtZytrcTRPNjhXUUpiZEk3QzFvQThBRTFWWXM2NHkyMjdYVGV5RlhhMWNHS0k9IW5GNEJMSXNleC9xbWpHSU52NnczY0E9PQ',
    'amzn1.adm-registration.v2.Y29tLmFtYXpvbi5EZXZpY2VNZXNzYWdpbmcuUmVnaXN0cmF0aW9uSWRFbmNyeXB0aW9uS2V5ITEhOE9rZ2h5TXlhVEFFczg2ejNWL3JMcmhTa255Uk5BclhBbE1XMFZzcnU1aFF6cTlvdU5FbVEwclZmdk5oTFBVRXVDN1luQlRSNnRVRUViREdQSlBvSzRNaXVRRUlyUy9NYWZCYS9VWTJUaGZwb3ZVTHhlRTM0MGhvampBK01hVktsMEhxakdmQStOSXRjUXBTQUhNU1NlVVVUVkFreVRhRTBCYktaQ2ZkUFdqSmIwcHgzRDhMQnllVXdxQ2EwdHNXRmFVNklYL0U4UXovcHg0K3Jjb25VbVFLRUVVOFVabnh4RDhjYmtIcHd1ZThiekorbGtzR2taMG95cC92Y3NtZytrcTRPNjhXUUpiZEk3QzFvQThBRTFWWXM2NHkyMjdYVGV5RlhhMWNHS0k9IW5GNEJMSXNleC9xbWpHSU52NnczY0E9PQ',
];
const data = {
    title: 'title',
    body: 'body',
    sound: 'mySound.aiff',
    custom: {
        sender: 'appfeel-test',
    },
};
const pn = new PN();
const fErr = new Error('Forced error');
let sendMethod;

function sendOkMethod() {
    return sinon.stub(adm.Sender.prototype, 'send', (message, regId, cb) => {
        expect(regId).to.be.a('string');
        expect(regIds).to.include(regId);
        expect(message).to.have.deep.property('data.title', data.title);
        expect(message).to.have.deep.property('data.body', data.body);
        expect(message).to.have.deep.property('data.custom', data.custom);
        expect(message).to.be.an('object');
        cb(null, {});
    });
}

function sendFailureMethod() {
    return sinon.stub(adm.Sender.prototype, 'send', (message, regId, cb) => {
        cb(null, {
            error: fErr.message,
        });
    });
}

function sendErrorMethod() {
    return sinon.stub(adm.Sender.prototype, 'send', (message, regId, cb) => {
        cb(fErr);
    });
}

function sendThrowExceptionMethod() {
    return sinon.stub(adm.Sender.prototype, 'send', () => {
        throw fErr;
    });
}

describe('push-notifications-adm', () => {
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

    describe('send push notifications failure', () => {
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

        before(() => {
            sendMethod = sendFailureMethod();
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
