/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import { Messaging as fbMessaging } from 'firebase-admin/messaging';
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
});
