/* eslint-env mocha */
import chai from 'chai';
import sinon from 'sinon';
import dirtyChai from 'dirty-chai';
import gcm from 'node-gcm';
import PN from '../../src';
import {
  sendOkMethodGCM,
  testPushSuccess,
  testPushError,
  testPushException,
} from '../util';

const { DEFAULT_TTL, GCM_MAX_TTL } = require('../../src/constants');

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
  badge: 42,
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
  return sinon.stub(
    gcm.Sender.prototype,
    'send',
    function SenderSend(message, recipients, retries, cb) {
      const { registrationTokens } = recipients;
      expect(this.key).equal(gcmOpts.gcm.id);
      cb(null, {
        multicast_id: 'abc',
        success: 0,
        failure: regIds.length,
        results: registrationTokens.map((token) => ({
          message_id: '',
          registration_id: token,
          error: fErr.message,
        })),
      });
    }
  );
}

function sendFailureMethod2() {
  return sinon.stub(
    gcm.Sender.prototype,
    'send',
    (message, recipients, retries, cb) => {
      cb(null, {
        multicast_id: 'abc',
        success: 0,
        failure: regIds.length,
      });
    }
  );
}

function sendErrorMethod() {
  return sinon.stub(
    gcm.Sender.prototype,
    'send',
    (message, recipients, retries, cb) => {
      cb(fErr);
    }
  );
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
        .then((results) => testSuccess(null, results, done))
        .catch(done);
    });
  });

  describe('send push notifications successfully, data no title', () => {
    before(() => {
      sendMethod = sinon.stub(
        gcm.Sender.prototype,
        'send',
        (message, recipients, retries, cb) => {
          expect(recipients).to.be.instanceOf(Object);
          expect(recipients).to.have.property('registrationTokens');
          const { registrationTokens } = recipients;
          expect(registrationTokens).to.be.instanceOf(Array);
          registrationTokens.forEach((regId) =>
            expect(regIds).to.include(regId)
          );
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
            results: registrationTokens.map((token) => ({
              message_id: '',
              registration_id: token,
              error: null,
            })),
          });
        }
      );
    });

    after(() => {
      sendMethod.restore();
    });

    it('all responses should be successful (callback, no title)', (done) => {
      const newData = { ...data };
      delete newData.title;
      const callback = (err, results) => testSuccess(err, results, done);
      pn.send(regIds, newData, callback).catch(() => {});
    });
  });

  describe('send push notifications successfully, (callback, no sound, icon, msgcnt, badge)', () => {
    before(() => {
      sendMethod = sinon.stub(
        gcm.Sender.prototype,
        'send',
        (message, recipients, retries, cb) => {
          expect(recipients).to.be.instanceOf(Object);
          expect(recipients).to.have.property('registrationTokens');
          const { registrationTokens } = recipients;
          expect(registrationTokens).to.be.instanceOf(Array);
          registrationTokens.forEach((regId) =>
            expect(regIds).to.include(regId)
          );
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
          expect(message.params.notification.notification_count).to.eql(42);
          cb(null, {
            multicast_id: 'abc',
            success: registrationTokens.length,
            failure: 0,
            results: registrationTokens.map((token) => ({
              message_id: '',
              registration_id: token,
              error: null,
            })),
          });
        }
      );
    });

    after(() => {
      sendMethod.restore();
    });

    it('all responses should be successful (callback, no sound, icon, msgcnt)', (done) => {
      const newData = { ...data };
      delete newData.sound;
      newData.icon = 'myicon.png';
      newData.custom.msgcnt = 2;
      const callback = (err, results) => testSuccess(err, results, done);
      pn.send(regIds, newData, callback).catch(() => {});
    });
  });

  describe('send push notifications successfully, (callback, no contentAvailable, notificationCount)', () => {
    before(() => {
      sendMethod = sinon.stub(
        gcm.Sender.prototype,
        'send',
        (message, recipients, retries, cb) => {
          expect(recipients).to.be.instanceOf(Object);
          expect(recipients).to.have.property('registrationTokens');
          const { registrationTokens } = recipients;
          expect(registrationTokens).to.be.instanceOf(Array);
          registrationTokens.forEach((regId) =>
            expect(regIds).to.include(regId)
          );
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
          expect(message.params.notification.notification_count).to.eql(42);
          cb(null, {
            multicast_id: 'abc',
            success: registrationTokens.length,
            failure: 0,
            results: registrationTokens.map((token) => ({
              message_id: '',
              registration_id: token,
              error: null,
            })),
          });
        }
      );
    });

    after(() => {
      sendMethod.restore();
    });

    it('all responses should be successful (callback, no contentAvailable)', (done) => {
      const newData = { ...data };
      delete newData.contentAvailable;
      delete newData.badge;
      newData.notificationCount = 42;
      const callback = (err, results) => testSuccess(err, results, done);
      pn.send(regIds, newData, callback).catch(() => {});
    });
  });

  describe('send push notifications successfully, data no body', () => {
    before(() => {
      sendMethod = sinon.stub(
        gcm.Sender.prototype,
        'send',
        (message, recipients, retries, cb) => {
          expect(recipients).to.be.instanceOf(Object);
          expect(recipients).to.have.property('registrationTokens');
          const { registrationTokens } = recipients;
          expect(registrationTokens).to.be.instanceOf(Array);
          registrationTokens.forEach((regId) =>
            expect(regIds).to.include(regId)
          );
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
            results: registrationTokens.map((token) => ({
              message_id: '',
              registration_id: token,
              error: null,
            })),
          });
        }
      );
    });

    after(() => {
      sendMethod.restore();
    });

    it('all responses should be successful (callback, no body)', (done) => {
      const newData = { ...data };
      delete newData.body;
      const callback = (err, results) => testSuccess(err, results, done);
      pn.send(regIds, newData, callback).catch(() => {});
    });
  });

  describe('send push notifications successfully, custom data string', () => {
    before(() => {
      sendMethod = sinon.stub(
        gcm.Sender.prototype,
        'send',
        (message, recipients, retries, cb) => {
          expect(recipients).to.be.instanceOf(Object);
          expect(recipients).to.have.property('registrationTokens');
          const { registrationTokens } = recipients;
          expect(registrationTokens).to.be.instanceOf(Array);
          registrationTokens.forEach((regId) =>
            expect(regIds).to.include(regId)
          );
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
            results: registrationTokens.map((token) => ({
              message_id: '',
              registration_id: token,
              error: null,
            })),
          });
        }
      );
    });

    after(() => {
      sendMethod.restore();
    });

    it('all responses should be successful (callback, custom data as string)', (done) => {
      const newData = { ...data, custom: 'this is a string' };
      pn.send(regIds, newData, (err, results) =>
        testSuccess(err, results, done)
      );
    });
  });

  describe('send push notifications successfully, custom data undefined', () => {
    before(() => {
      sendMethod = sinon.stub(
        gcm.Sender.prototype,
        'send',
        (message, recipients, retries, cb) => {
          expect(recipients).to.be.instanceOf(Object);
          expect(recipients).to.have.property('registrationTokens');
          const { registrationTokens } = recipients;
          expect(registrationTokens).to.be.instanceOf(Array);
          registrationTokens.forEach((regId) =>
            expect(regIds).to.include(regId)
          );
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
            results: registrationTokens.map((token) => ({
              message_id: '',
              registration_id: token,
              error: null,
            })),
          });
        }
      );
    });

    after(() => {
      sendMethod.restore();
    });

    it('all responses should be successful (callback, custom data undefined)', (done) => {
      const newData = { ...data };
      delete newData.custom;
      pn.send(regIds, newData, (err, results) =>
        testSuccess(err, results, done)
      );
    });
  });

  describe('send push notifications successfully, normal priority', () => {
    before(() => {
      sendMethod = sinon.stub(
        gcm.Sender.prototype,
        'send',
        (message, recipients, retries, cb) => {
          expect(recipients).to.be.instanceOf(Object);
          expect(recipients).to.have.property('registrationTokens');
          const { registrationTokens } = recipients;
          expect(registrationTokens).to.be.instanceOf(Array);
          registrationTokens.forEach((regId) =>
            expect(regIds).to.include(regId)
          );
          expect(retries).to.be.a('number');
          expect(message).to.be.instanceOf(gcm.Message);
          expect(message.params.priority).to.equal('normal');
          cb(null, {
            multicast_id: 'abc',
            success: registrationTokens.length,
            failure: 0,
            results: registrationTokens.map((token) => ({
              message_id: '',
              registration_id: token,
              error: null,
            })),
          });
        }
      );
    });

    after(() => {
      sendMethod.restore();
    });

    it('all responses should be successful (callback, custom data undefined)', (done) => {
      const normalPrioData = { ...data };
      normalPrioData.priority = 'normal';
      pn.send(regIds, normalPrioData, (err, results) =>
        testSuccess(err, results, done)
      );
    });
  });

  describe('timeToLive', () => {
    describe('send push notifications with custom timeToLive', () => {
      const timeToLive = 4004;

      before(() => {
        sendMethod = sinon.stub(
          gcm.Sender.prototype,
          'send',
          (message, recipients, retries, cb) => {
            expect(recipients).to.be.instanceOf(Object);
            expect(recipients).to.have.property('registrationTokens');
            const { registrationTokens } = recipients;
            expect(registrationTokens).to.be.instanceOf(Array);
            registrationTokens.forEach((regId) =>
              expect(regIds).to.include(regId)
            );
            expect(message.params.timeToLive).to.equal(timeToLive);
            cb(null, {
              multicast_id: 'abc',
              success: registrationTokens.length,
              failure: 0,
              results: registrationTokens.map((token) => ({
                message_id: '',
                registration_id: token,
                error: null,
              })),
            });
          }
        );
      });

      after(() => {
        sendMethod.restore();
      });

      it('timeToLive set correctly', (done) => {
        const expiryData = { ...data, timeToLive };
        pn.send(regIds, expiryData, (err, results) =>
          testSuccess(err, results, done)
        );
      });
    });

    describe('send push notifications with tll 0', () => {
      const ttl = 0;

      before(() => {
        sendMethod = sinon.stub(
          gcm.Sender.prototype,
          'send',
          (message, recipients, retries, cb) => {
            expect(recipients).to.be.instanceOf(Object);
            expect(recipients).to.have.property('registrationTokens');
            const { registrationTokens } = recipients;
            expect(registrationTokens).to.be.instanceOf(Array);
            registrationTokens.forEach((regId) =>
              expect(regIds).to.include(regId)
            );
            expect(message.params.timeToLive).to.equal(ttl);
            cb(null, {
              multicast_id: 'abc',
              success: registrationTokens.length,
              failure: 0,
              results: registrationTokens.map((token) => ({
                message_id: '',
                registration_id: token,
                error: null,
              })),
            });
          }
        );
      });

      after(() => {
        sendMethod.restore();
      });

      it('timeToLive 0 should be accepted as a valid value', (done) => {
        const ttlData = { ...data, timeToLive: ttl };
        pn.send(regIds, ttlData, (err, results) =>
          testSuccess(err, results, done)
        );
      });
    });

    describe('send push notifications with timeToLive calculated from expiry', () => {
      const now = 150000;
      let clock;

      before(() => {
        const expectedTtl = 159850;

        clock = sinon.useFakeTimers(now);

        sendMethod = sinon.stub(
          gcm.Sender.prototype,
          'send',
          (message, recipients, retries, cb) => {
            expect(recipients).to.be.instanceOf(Object);
            expect(recipients).to.have.property('registrationTokens');
            const { registrationTokens } = recipients;
            expect(registrationTokens).to.be.instanceOf(Array);
            registrationTokens.forEach((regId) =>
              expect(regIds).to.include(regId)
            );
            expect(message.params.timeToLive).to.equal(expectedTtl);
            cb(null, {
              multicast_id: 'abc',
              success: registrationTokens.length,
              failure: 0,
              results: registrationTokens.map((token) => ({
                message_id: '',
                registration_id: token,
                error: null,
              })),
            });
          }
        );
      });

      after(() => {
        sendMethod.restore();
        clock.restore();
      });

      it('timeToLive should be calculated correctly from expiry. expiry takes precedence', (done) => {
        const expiryData = { ...data, expiry: 160000, timeToLive: 3000 };
        pn.send(regIds, expiryData, (err, results) =>
          testSuccess(err, results, done)
        );
      });
    });

    describe('send push notifications with timeToLive calculated from expiry must not exceed max TTL', () => {
      const now = 150000;
      let clock;

      before(() => {
        clock = sinon.useFakeTimers(now);

        sendMethod = sinon.stub(
          gcm.Sender.prototype,
          'send',
          (message, recipients, retries, cb) => {
            expect(recipients).to.be.instanceOf(Object);
            expect(recipients).to.have.property('registrationTokens');
            const { registrationTokens } = recipients;
            expect(registrationTokens).to.be.instanceOf(Array);
            registrationTokens.forEach((regId) =>
              expect(regIds).to.include(regId)
            );
            expect(message.params.timeToLive).to.equal(GCM_MAX_TTL);
            cb(null, {
              multicast_id: 'abc',
              success: registrationTokens.length,
              failure: 0,
              results: registrationTokens.map((token) => ({
                message_id: '',
                registration_id: token,
                error: null,
              })),
            });
          }
        );
      });

      after(() => {
        sendMethod.restore();
        clock.restore();
      });

      it('timeToLive from expiry must not exceed max TTL', (done) => {
        const expiryData = { ...data, expiry: 16000000, timeToLive: 3000 };
        pn.send(regIds, expiryData, (err, results) =>
          testSuccess(err, results, done)
        );
      });
    });

    describe('send push notifications with neither expiry nor timeToLive given', () => {
      before(() => {
        sendMethod = sinon.stub(
          gcm.Sender.prototype,
          'send',
          (message, recipients, retries, cb) => {
            expect(recipients).to.be.instanceOf(Object);
            expect(recipients).to.have.property('registrationTokens');
            const { registrationTokens } = recipients;
            expect(registrationTokens).to.be.instanceOf(Array);
            registrationTokens.forEach((regId) =>
              expect(regIds).to.include(regId)
            );
            expect(message.params.timeToLive).to.equal(DEFAULT_TTL);
            cb(null, {
              multicast_id: 'abc',
              success: registrationTokens.length,
              failure: 0,
              results: registrationTokens.map((token) => ({
                message_id: '',
                registration_id: token,
                error: null,
              })),
            });
          }
        );
      });

      after(() => {
        sendMethod.restore();
      });

      it('should set the default expiry', (done) => {
        pn.send(regIds, data, (err, results) =>
          testSuccess(err, results, done)
        );
      });
    });
  });

  describe('send silent push notifications', () => {
    before(() => {
      sendMethod = sinon.stub(
        gcm.Sender.prototype,
        'send',
        (message, recipients, retries, cb) => {
          expect(recipients).to.be.instanceOf(Object);
          expect(recipients).to.have.property('registrationTokens');
          const { registrationTokens } = recipients;
          expect(registrationTokens).to.be.instanceOf(Array);
          registrationTokens.forEach((regId) =>
            expect(regIds).to.include(regId)
          );
          expect(retries).to.be.a('number');
          expect(message).to.be.instanceOf(gcm.Message);
          expect(message.params.notification).to.be.undefined();
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
            results: registrationTokens.map((token) => ({
              message_id: '',
              registration_id: token,
              error: null,
            })),
          });
        }
      );
    });

    after(() => {
      sendMethod.restore();
    });

    it('all responses should be successful (callback, custom data undefined)', (done) => {
      const silentPushData = {
        priority: 'high',
        silent: true,
        custom: {
          testKey: 'testValue',
        },
      };
      pn.send(regIds, silentPushData, (err, results) =>
        testSuccess(err, results, done)
      );
    });
  });

  describe('include Android-specific fields, such as channel id, image, style etc.', () => {
    before(() => {
      sendMethod = sinon.stub(
        gcm.Sender.prototype,
        'send',
        (message, recipients, retries, cb) => {
          expect(recipients).to.be.instanceOf(Object);
          expect(recipients).to.have.property('registrationTokens');
          const { registrationTokens } = recipients;
          expect(registrationTokens).to.be.instanceOf(Array);
          registrationTokens.forEach((regId) =>
            expect(regIds).to.include(regId)
          );
          expect(retries).to.be.a('number');
          expect(message).to.be.instanceOf(gcm.Message);
          expect(message.params.notification.android_channel_id).to.equal(
            'channelId'
          );
          expect(message.params.notification.image).to.equal('imageData');
          expect(message.params.notification.style).to.equal('some-style');
          expect(message.params.notification.picture).to.equal(
            'http://example.com'
          );
          cb(null, {
            multicast_id: 'abc',
            success: registrationTokens.length,
            failure: 0,
            results: registrationTokens.map((token) => ({
              message_id: '',
              registration_id: token,
              error: null,
            })),
          });
        }
      );
    });

    after(() => {
      sendMethod.restore();
    });

    it('all responses should be successful (callback, custom data undefined)', (done) => {
      const androidData = {
        android_channel_id: 'channelId',
        image: 'imageData',
        style: 'some-style',
        picture: 'http://example.com',
      };
      pn.send(regIds, androidData, (err, results) =>
        testSuccess(err, results, done)
      );
    });
  });

  describe('send push notifications in phonegap-push compatibility mode', () => {
    const pushPhoneGap = new PN({
      gcm: {
        phonegap: true,
      },
    });

    before(() => {
      sendMethod = sinon.stub(
        gcm.Sender.prototype,
        'send',
        (message, recipients, retries, cb) => {
          expect(recipients).to.be.instanceOf(Object);
          expect(recipients).to.have.property('registrationTokens');
          const { registrationTokens } = recipients;
          expect(registrationTokens).to.be.an.instanceOf(Array);
          registrationTokens.forEach((regId) =>
            expect(regIds).to.include(regId)
          );
          expect(retries).to.be.a('number');
          expect(message).to.be.instanceOf(gcm.Message);
          expect(message.params.notification).to.be.undefined();
          expect(message.params.data.sender).to.eql(data.custom.sender);
          expect(message.params.data.title).to.eql(data.title);
          expect(message.params.data.body).to.eql(data.body);
          expect(message.params.data.sound).to.eql(data.sound);
          expect(message.params.data['content-available']).to.equal(1);
          cb(null, {
            multicast_id: 'abc',
            success: registrationTokens.length,
            failure: 0,
            results: registrationTokens.map((token) => ({
              message_id: '',
              registration_id: token,
              error: null,
            })),
          });
        }
      );
    });

    after(() => {
      sendMethod.restore();
    });

    it('all responses should be successful (callback)', (done) => {
      pushPhoneGap.send(regIds, data, (err, results) =>
        testSuccess(err, results, done)
      );
    });

    it('all responses should be successful (promise)', (done) => {
      pushPhoneGap
        .send(regIds, data)
        .then((results) => testSuccess(null, results, done))
        .catch(done);
    });
  });

  describe('send push notifications with { recipients: {to}}', () => {
    const recipient = 'recipientTo';
    const dataRecipientsTo = { ...data, recipients: { to: recipient } };
    const testSuccessRecipientTo = testPushSuccess(method, [recipient]);

    before(() => {
      sendMethod = sinon.stub(
        gcm.Sender.prototype,
        'send',
        (message, recipients, retries, cb) => {
          expect(recipients).to.be.instanceOf(Object);
          expect(recipients).to.have.property('to');
          expect(recipients).to.not.have.property('registrationTokens');
          const { to } = recipients;
          expect(to).to.be.a('string');
          expect(to).to.equal(recipient);
          expect(retries).to.be.a('number');
          expect(message).to.be.instanceOf(gcm.Message);
          expect(message.params.notification.title).to.eql(data.title);
          expect(message.params.notification.body).to.eql(data.body);
          expect(message.params.notification.sound).to.eql(data.sound);
          expect(message.params.data.sender).to.eql(data.custom.sender);
          expect(message.params.priority).to.equal('high');
          expect(message.params.data.title).to.eql(data.title);
          expect(message.params.data.message).to.eql(data.body);
          expect(message.params.data.sound).to.eql(data.sound);
          cb(null, {
            multicast_id: 'abc',
            success: 1,
            failure: 0,
            results: [
              {
                message_id: '',
                registration_id: to,
                error: null,
              },
            ],
          });
        }
      );
    });

    after(() => {
      sendMethod.restore();
    });

    it('all responses should be successful (callback)', (done) => {
      pn.send(regIds, dataRecipientsTo, (err, results) =>
        testSuccessRecipientTo(err, results, done)
      );
    });

    it('all responses should be successful (promise)', (done) => {
      pn.send(regIds, dataRecipientsTo)
        .then((results) => testSuccessRecipientTo(null, results, done))
        .catch(done);
    });
  });

  describe('send push notifications with { recipients: {condition}}', () => {
    const recipient = 'recipientCondition';
    const dataRecipientsCondition = {
      ...data,
      recipients: { condition: recipient },
    };
    const testSuccessRecipientCondition = testPushSuccess(method, [recipient]);

    before(() => {
      sendMethod = sinon.stub(
        gcm.Sender.prototype,
        'send',
        (message, recipients, retries, cb) => {
          expect(recipients).to.be.instanceOf(Object);
          expect(recipients).to.have.property('condition');
          expect(recipients).to.not.have.property('registrationTokens');
          const { condition } = recipients;
          expect(condition).to.be.a('string');
          expect(condition).to.equal(recipient);
          expect(retries).to.be.a('number');
          expect(message).to.be.instanceOf(gcm.Message);
          expect(message.params.notification.title).to.eql(data.title);
          expect(message.params.notification.body).to.eql(data.body);
          expect(message.params.notification.sound).to.eql(data.sound);
          expect(message.params.data.sender).to.eql(data.custom.sender);
          expect(message.params.priority).to.equal('high');
          expect(message.params.data.title).to.eql(data.title);
          expect(message.params.data.message).to.eql(data.body);
          expect(message.params.data.sound).to.eql(data.sound);
          cb(null, {
            multicast_id: 'abc',
            success: 1,
            failure: 0,
            results: [
              {
                message_id: '',
                registration_id: condition,
                error: null,
              },
            ],
          });
        }
      );
    });

    after(() => {
      sendMethod.restore();
    });

    it('all responses should be successful (callback)', (done) => {
      pn.send(regIds, dataRecipientsCondition, (err, results) =>
        testSuccessRecipientCondition(err, results, done)
      );
    });

    it('all responses should be successful (promise)', (done) => {
      pn.send(regIds, dataRecipientsCondition)
        .then((results) => testSuccessRecipientCondition(null, results, done))
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

  describe('send push notifications failure (without response)', () => {
    before(() => {
      sendMethod = sendFailureMethod2();
    });

    after(() => {
      sendMethod.restore();
    });

    it('all responses should be failed (callback)', (done) => {
      pn.send(regIds, data, (err, results) =>
        testUnknownError(err, results, done)
      );
    });

    it('all responses should be failed (promise)', (done) => {
      pn.send(regIds, data)
        .then((results) => testUnknownError(null, results, done))
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
