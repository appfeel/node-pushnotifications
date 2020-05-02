/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import webpush from 'web-push';
import PN from '../../src';
import { testPushSuccess, testPushError, testPushException } from '../util';

const method = 'webPush';
const regIds = [
  {
    endpoint:
      'https://android.googleapis.com/gcm/send/cfUDlZL9YBQ:APA91bExYfB9ymMLJrR6rrDDSdGR614iMWXDHYVQpE2ETwMjJrghcWDKrEHwnay5FTCI57IDZuDfSMyPKszTRwik6_LI4Be-wGb3O-ZlTLYABeRAyhNqQMgC-tDh1zL5xELer2dEZevZ',
    expirationTime: null,
    keys: {
      p256dh:
        'BHMUZrHFDscS3VsRB8tZAXFJLYvZlgaQukwAgeHc54JOZe9X-GdHYhepFlh50QH_zlpAfkXDo29avciaRJqzTzs',
      auth: 'Ou2Z6b2wRZSejPkSgjykGQ',
    },
  },
  {
    endpoint:
      'https://android.googleapis.com/gcm/send/cfUDlZL9YBQ:APA91bExYfB9ymMLJrR6rrDDSdGR614iMWXDHYVQpE2ETwMjJrghcWDKrEHwnay5FTCI57IDZuDfSMyPKszTRwik6_LI4Be-wGb3O-ZlTLYABeRAyhNqQMgC-tDh1zL5xELer2dEZevZ',
    expirationTime: null,
    keys: {
      p256dh:
        'BHMUZrHFDscS3VsRB8tZAXFJLYvZlgaQukwAgeHc54JOZe9X-GdHYhepFlh50QH_zlpAfkXDo29avciaRJqzTzs',
      auth: 'Ou2Z6b2wRZSejPkSgjykGQ',
    },
  },
];
const data = 'payloadString';
const dataObject = {
  message: 'payload',
  badge: 4,
};
const webOptions = {
  web: {
    vapidDetails: {
      subject: 'mailto@me.net',
      publicKey: '< URL Safe Base64 Encoded Public Key >',
      privateKey: '< URL Safe Base64 Encoded Private Key >',
    },
    gcmAPIKey: 'gcmKey',
  },
};
const pn = new PN(webOptions);
const pushError = new webpush.WebPushError(
  'forced error',
  400,
  {},
  'errorBody',
  {}
);

const testSuccess = testPushSuccess(method, regIds);
const testError = testPushError(method, regIds, pushError.message);
const testException = testPushException(pushError.message);

let sendMethod;

function sendOkMethodAsString() {
  return sinon.stub(webpush, 'sendNotification', (regId, message, settings) => {
    expect(regId).to.be.a('object');
    expect(regIds).to.include(regId);
    expect(message).to.be.a('string');
    expect(message).to.equal(data);
    expect(settings).to.eql(webOptions.web);
    return Promise.resolve({
      statusCode: 200,
      header: {},
      body: 'Success',
    });
  });
}

function sendOkMethodAsObject() {
  return sinon.stub(webpush, 'sendNotification', (regId, message, settings) => {
    expect(regId).to.be.a('object');
    expect(regIds).to.include(regId);
    expect(message).to.be.a('string');
    expect(message).to.equal(JSON.stringify(dataObject));
    expect(settings).to.eql(webOptions.web);
    return Promise.resolve({
      statusCode: 200,
      header: {},
      body: 'Success',
    });
  });
}

function sendFailureMethod() {
  return sinon.stub(webpush, 'sendNotification', () =>
    Promise.reject(pushError)
  );
}

function sendThrowExceptionMethod() {
  return sinon.stub(webpush, 'sendNotification', () => {
    throw pushError;
  });
}

describe('push-notifications-web', () => {
  describe('send push notifications successfully as strings', () => {
    before(() => {
      sendMethod = sendOkMethodAsString();
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

  describe('send push notifications successfully as objects', () => {
    before(() => {
      sendMethod = sendOkMethodAsObject();
    });

    after(() => {
      sendMethod.restore();
    });

    it('all responses should be successful (callback)', (done) => {
      pn.send(regIds, dataObject, (err, results) =>
        testSuccess(err, results, done)
      );
    });

    it('all responses should be successful (promise)', (done) => {
      pn.send(regIds, dataObject)
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
});
