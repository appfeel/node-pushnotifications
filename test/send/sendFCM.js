/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import { Messaging as fbMessaging } from 'firebase-admin/messaging';
import * as firebaseAdmin from 'firebase-admin';
import PN from '../../src/index.js';
import { testPushSuccess } from '../util.js';

const method = 'fcm';
const regIds = [
  'APA91bFQCD9Ndd8uVggMhj1usfeWsKIfGyBUWMprpZLGciWrMjS-77bIY24IMQNeEHzjidCcddnDxqYo-UEV03xw6ySmtIgQyzTqhSxhPGAi1maf6KDMAQGuUWc6L5Khze8YK9YrL9I_WD1gl49P3f_9hr08ZAS5Tw',
];
const message = {
  title: 'title',
  body: 'body',
  sound: 'mySound.aiff',
  icon: 'testIcon',
  color: '#FF0000',
  clickAction: 'OPEN_ACTIVITY_1',
  android_channel_id: 'test_channel',
  tag: 'test-tag',
  badge: 5,
  ticker: 'test-ticker',
  sticky: true,
  visibility: 'public',
  localOnly: false,
  eventTimestamp: new Date('2026-01-07T12:00:00Z'),
  notificationPriority: 'high',
  vibrateTimingsMillis: [100, 200, 100],
  defaultVibrateTimings: false,
  defaultSound: true,
  analyticsLabel: 'test_analytics',
  custom: {
    sender: 'banshi-test',
  },
};
const fcmOpts = {
  fcm: {
    name: 'testAppName',
    credential: { getAccessToken: () => Promise.resolve({}) },
  },
};
const pn = new PN(fcmOpts);

const testSuccess = testPushSuccess(method, regIds);

let sendMethod;

function sendOkMethod() {
  return sinon.stub(
    fbMessaging.prototype,
    'sendEachForMulticast',
    function sendFCM(firebaseMessage) {
      const { custom, analyticsLabel, android_channel_id, ...notificationData } = message;

      expect(firebaseMessage.tokens).to.deep.equal(regIds);

      expect(firebaseMessage.android.priority).to.equal('high');
      expect(firebaseMessage.android.notification).to.deep.include({
        title: notificationData.title,
        body: notificationData.body,
        sound: notificationData.sound,
        icon: notificationData.icon,
        color: notificationData.color,
        clickAction: notificationData.clickAction,
        channelId: android_channel_id,
        tag: notificationData.tag,
        notificationCount: notificationData.badge,
        ticker: notificationData.ticker,
        sticky: notificationData.sticky,
        visibility: notificationData.visibility,
        localOnly: notificationData.localOnly,
        eventTimestamp: notificationData.eventTimestamp,
        priority: notificationData.notificationPriority,
        vibrateTimingsMillis: notificationData.vibrateTimingsMillis,
        defaultVibrateTimings: notificationData.defaultVibrateTimings,
        defaultSound: notificationData.defaultSound,
      });

      expect(firebaseMessage.android.fcmOptions).to.deep.equal({
        analyticsLabel: analyticsLabel,
      });

      expect(firebaseMessage.apns.payload.aps.sound).to.equal(notificationData.sound);

      expect(firebaseMessage.apns.payload.aps.alert).to.deep.include({
        title: notificationData.title,
        body: notificationData.body,
      });

      expect(firebaseMessage.data).to.deep.equal(custom);

      return Promise.resolve({
        successCount: 1,
        failureCount: 0,
        responses: [{ error: null }],
      });
    }
  );
}

describe('push-notifications-fcm', () => {
  describe('send push notifications successfully', () => {
    before(() => {
      sendMethod = sendOkMethod();
    });

    after(() => {
      sendMethod.restore();
    });

    it('all responses should be successful', (done) => {
      pn.send(regIds, message)
        .then((results) => testSuccess(null, results, done))
        .catch(done);
    });
  });

  describe('proxy support', () => {
    it('should accept httpAgent in settings', (done) => {
      const mockHttpAgent = {};
      const mockInitializeApp = sinon.stub(firebaseAdmin, 'initializeApp').returns({
        messaging: () => ({
          sendEachForMulticast: () =>
            Promise.resolve({
              successCount: 1,
              failureCount: 0,
              responses: [{ error: null }],
            }),
        }),
      });

      const fcmOptsWithProxy = {
        fcm: {
          name: 'testAppNameProxy',
          credential: { getAccessToken: () => Promise.resolve({}) },
          httpAgent: mockHttpAgent,
        },
      };

      const pnWithProxy = new PN(fcmOptsWithProxy);

      pnWithProxy
        .send(regIds, message)
        .then(() => {
          // Verify that initializeApp was called with httpAgent
          const callArgs = mockInitializeApp.getCall(0).args[0];
          expect(callArgs.httpAgent).to.equal(mockHttpAgent);
          mockInitializeApp.restore();
          done();
        })
        .catch((err) => {
          mockInitializeApp.restore();
          done(err);
        });
    });

    it('should accept httpsAgent in settings', (done) => {
      const mockHttpsAgent = {};
      const mockInitializeApp = sinon.stub(firebaseAdmin, 'initializeApp').returns({
        messaging: () => ({
          sendEachForMulticast: () =>
            Promise.resolve({
              successCount: 1,
              failureCount: 0,
              responses: [{ error: null }],
            }),
        }),
      });

      const fcmOptsWithProxy = {
        fcm: {
          name: 'testAppNameProxyHttps',
          credential: { getAccessToken: () => Promise.resolve({}) },
          httpsAgent: mockHttpsAgent,
        },
      };

      const pnWithProxy = new PN(fcmOptsWithProxy);

      pnWithProxy
        .send(regIds, message)
        .then(() => {
          // Verify that initializeApp was called with httpsAgent
          const callArgs = mockInitializeApp.getCall(0).args[0];
          expect(callArgs.httpsAgent).to.equal(mockHttpsAgent);
          mockInitializeApp.restore();
          done();
        })
        .catch((err) => {
          mockInitializeApp.restore();
          done(err);
        });
    });

    it('should accept both httpAgent and httpsAgent in settings', (done) => {
      const mockHttpAgent = {};
      const mockHttpsAgent = {};
      const mockInitializeApp = sinon.stub(firebaseAdmin, 'initializeApp').returns({
        messaging: () => ({
          sendEachForMulticast: () =>
            Promise.resolve({
              successCount: 1,
              failureCount: 0,
              responses: [{ error: null }],
            }),
        }),
      });

      const fcmOptsWithProxy = {
        fcm: {
          name: 'testAppNameProxyBoth',
          credential: { getAccessToken: () => Promise.resolve({}) },
          httpAgent: mockHttpAgent,
          httpsAgent: mockHttpsAgent,
        },
      };

      const pnWithProxy = new PN(fcmOptsWithProxy);

      pnWithProxy
        .send(regIds, message)
        .then(() => {
          // Verify that initializeApp was called with both agents
          const callArgs = mockInitializeApp.getCall(0).args[0];
          expect(callArgs.httpAgent).to.equal(mockHttpAgent);
          expect(callArgs.httpsAgent).to.equal(mockHttpsAgent);
          mockInitializeApp.restore();
          done();
        })
        .catch((err) => {
          mockInitializeApp.restore();
          done(err);
        });
    });
  });

  describe('Firebase Admin SDK AppOptions support', () => {
    it('should accept projectId in settings', (done) => {
      const mockInitializeApp = sinon.stub(firebaseAdmin, 'initializeApp').returns({
        messaging: () => ({
          sendEachForMulticast: () =>
            Promise.resolve({
              successCount: 1,
              failureCount: 0,
              responses: [{ error: null }],
            }),
        }),
      });

      const fcmOptsWithProjectId = {
        fcm: {
          name: 'testAppNameProjectId',
          credential: { getAccessToken: () => Promise.resolve({}) },
          projectId: 'my-firebase-project',
        },
      };

      const pnWithProjectId = new PN(fcmOptsWithProjectId);

      pnWithProjectId
        .send(regIds, message)
        .then(() => {
          const callArgs = mockInitializeApp.getCall(0).args[0];
          expect(callArgs.projectId).to.equal('my-firebase-project');
          mockInitializeApp.restore();
          done();
        })
        .catch((err) => {
          mockInitializeApp.restore();
          done(err);
        });
    });

    it('should accept databaseURL in settings', (done) => {
      const mockInitializeApp = sinon.stub(firebaseAdmin, 'initializeApp').returns({
        messaging: () => ({
          sendEachForMulticast: () =>
            Promise.resolve({
              successCount: 1,
              failureCount: 0,
              responses: [{ error: null }],
            }),
        }),
      });

      const fcmOptsWithDatabaseURL = {
        fcm: {
          name: 'testAppNameDatabaseURL',
          credential: { getAccessToken: () => Promise.resolve({}) },
          databaseURL: 'https://my-database.firebaseio.com',
        },
      };

      const pnWithDatabaseURL = new PN(fcmOptsWithDatabaseURL);

      pnWithDatabaseURL
        .send(regIds, message)
        .then(() => {
          const callArgs = mockInitializeApp.getCall(0).args[0];
          expect(callArgs.databaseURL).to.equal('https://my-database.firebaseio.com');
          mockInitializeApp.restore();
          done();
        })
        .catch((err) => {
          mockInitializeApp.restore();
          done(err);
        });
    });

    it('should accept storageBucket in settings', (done) => {
      const mockInitializeApp = sinon.stub(firebaseAdmin, 'initializeApp').returns({
        messaging: () => ({
          sendEachForMulticast: () =>
            Promise.resolve({
              successCount: 1,
              failureCount: 0,
              responses: [{ error: null }],
            }),
        }),
      });

      const fcmOptsWithStorageBucket = {
        fcm: {
          name: 'testAppNameStorageBucket',
          credential: { getAccessToken: () => Promise.resolve({}) },
          storageBucket: 'my-bucket.appspot.com',
        },
      };

      const pnWithStorageBucket = new PN(fcmOptsWithStorageBucket);

      pnWithStorageBucket
        .send(regIds, message)
        .then(() => {
          const callArgs = mockInitializeApp.getCall(0).args[0];
          expect(callArgs.storageBucket).to.equal('my-bucket.appspot.com');
          mockInitializeApp.restore();
          done();
        })
        .catch((err) => {
          mockInitializeApp.restore();
          done(err);
        });
    });

    it('should accept serviceAccountId in settings', (done) => {
      const mockInitializeApp = sinon.stub(firebaseAdmin, 'initializeApp').returns({
        messaging: () => ({
          sendEachForMulticast: () =>
            Promise.resolve({
              successCount: 1,
              failureCount: 0,
              responses: [{ error: null }],
            }),
        }),
      });

      const fcmOptsWithServiceAccountId = {
        fcm: {
          name: 'testAppNameServiceAccountId',
          credential: { getAccessToken: () => Promise.resolve({}) },
          serviceAccountId: 'my-service@my-project.iam.gserviceaccount.com',
        },
      };

      const pnWithServiceAccountId = new PN(fcmOptsWithServiceAccountId);

      pnWithServiceAccountId
        .send(regIds, message)
        .then(() => {
          const callArgs = mockInitializeApp.getCall(0).args[0];
          expect(callArgs.serviceAccountId).to.equal(
            'my-service@my-project.iam.gserviceaccount.com'
          );
          mockInitializeApp.restore();
          done();
        })
        .catch((err) => {
          mockInitializeApp.restore();
          done(err);
        });
    });

    it('should accept databaseAuthVariableOverride in settings', (done) => {
      const mockInitializeApp = sinon.stub(firebaseAdmin, 'initializeApp').returns({
        messaging: () => ({
          sendEachForMulticast: () =>
            Promise.resolve({
              successCount: 1,
              failureCount: 0,
              responses: [{ error: null }],
            }),
        }),
      });

      const authOverride = { uid: 'test-user-123' };
      const fcmOptsWithAuthOverride = {
        fcm: {
          name: 'testAppNameAuthOverride',
          credential: { getAccessToken: () => Promise.resolve({}) },
          databaseAuthVariableOverride: authOverride,
        },
      };

      const pnWithAuthOverride = new PN(fcmOptsWithAuthOverride);

      pnWithAuthOverride
        .send(regIds, message)
        .then(() => {
          const callArgs = mockInitializeApp.getCall(0).args[0];
          expect(callArgs.databaseAuthVariableOverride).to.deep.equal(authOverride);
          mockInitializeApp.restore();
          done();
        })
        .catch((err) => {
          mockInitializeApp.restore();
          done(err);
        });
    });

    it('should accept multiple Firebase AppOptions together', (done) => {
      const mockInitializeApp = sinon.stub(firebaseAdmin, 'initializeApp').returns({
        messaging: () => ({
          sendEachForMulticast: () =>
            Promise.resolve({
              successCount: 1,
              failureCount: 0,
              responses: [{ error: null }],
            }),
        }),
      });

      const mockHttpAgent = {};
      const authOverride = { uid: 'test-user-456' };
      const fcmOptsWithMultiple = {
        fcm: {
          name: 'testAppNameMultiple',
          credential: { getAccessToken: () => Promise.resolve({}) },
          projectId: 'my-firebase-project',
          databaseURL: 'https://my-database.firebaseio.com',
          storageBucket: 'my-bucket.appspot.com',
          serviceAccountId: 'my-service@my-project.iam.gserviceaccount.com',
          databaseAuthVariableOverride: authOverride,
          httpAgent: mockHttpAgent,
        },
      };

      const pnWithMultiple = new PN(fcmOptsWithMultiple);

      pnWithMultiple
        .send(regIds, message)
        .then(() => {
          const callArgs = mockInitializeApp.getCall(0).args[0];
          expect(callArgs.projectId).to.equal('my-firebase-project');
          expect(callArgs.databaseURL).to.equal('https://my-database.firebaseio.com');
          expect(callArgs.storageBucket).to.equal('my-bucket.appspot.com');
          expect(callArgs.serviceAccountId).to.equal(
            'my-service@my-project.iam.gserviceaccount.com'
          );
          expect(callArgs.databaseAuthVariableOverride).to.deep.equal(authOverride);
          expect(callArgs.httpAgent).to.equal(mockHttpAgent);
          mockInitializeApp.restore();
          done();
        })
        .catch((err) => {
          mockInitializeApp.restore();
          done(err);
        });
    });
  });
});
