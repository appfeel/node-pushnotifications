/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import adm from 'node-adm';
import PN from '../../src';
import {
  sendOkMethodGCM,
  testPushSuccess,
  testPushError,
  testPushException,
} from '../util';

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
const admOpts = {
  adm: {
    client_id: 'client_id',
    client_secret: 'secret',
  },
};
const pn = new PN(admOpts);
const fErr = new Error('Forced error');

const testSuccess = testPushSuccess(method, regIds);
const testSuccessGCM = testPushSuccess('gcm', regIds);
const testError = testPushError(method, regIds, fErr.message);
const testException = testPushException(fErr.message);

let sendMethod;

function sendOkMethod() {
  // Don't use arrow function because we use this!!
  return sinon.stub(
    adm.Sender.prototype,
    'send',
    function sedADM(message, regId, cb) {
      expect(this.options)
        .to.be.an('object')
        .includes.keys(['client_id', 'client_secret']);
      expect(this.options.client_id).to.equal(admOpts.adm.client_id);
      expect(this.options.client_secret).to.equal(admOpts.adm.client_secret);
      expect(regId).to.be.a('string');
      expect(regIds).to.include(regId);
      expect(message.data).to.be.an('object');
      expect(message.data.title).to.eql(data.title);
      expect(message.data.body).to.eql(data.body);
      expect(message.data.sender).to.eql(data.custom.sender);
      cb(null, {});
    }
  );
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
        .then((results) => testSuccess(null, results, done))
        .catch(done);
    });
  });

  describe('send push notifications failure', () => {
    before(() => {
      sendMethod = sendFailureMethod();
    });

    after(() => {
      sendMethod.restore();
    });

    it('all responses should be failed (callback)', (done) => {
      pn.send(regIds, data, (err, results) => testError(err, results, done));
    });

    it('all responses should be failed (promise)', (done) => {
      pn.send(regIds, data)
        .then((results) => testError(null, results, done))
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
        .then((results) => testError(null, results, done))
        .catch((err) => testError(err, undefined, done));
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
      pn.send(regIds, data, (err, results) =>
        testException(err, results, done)
      ).catch(() => {}); // This is to avoid UnhandledPromiseRejectionWarning
    });

    it('the exception should be catched (promise)', (done) => {
      pn.send(regIds, data)
        .then((results) => testException(null, results, done))
        .catch((err) => testException(err, undefined, done));
    });
  });

  describe('send push notifications using FCM', () => {
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
      pnGCM.send(regIds, data, (err, results) =>
        testSuccessGCM(err, results, done)
      );
    });

    it('all responses should be successful (promise)', (done) => {
      pnGCM
        .send(regIds, data)
        .then((results) => testSuccessGCM(null, results, done))
        .catch(done);
    });
  });
});
