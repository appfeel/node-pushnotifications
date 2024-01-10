/* eslint-disable import/no-unresolved */
/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import { Messaging as fbMessaging } from 'firebase-admin/messaging';
import PN from '../../src';
import { testPushSuccess } from '../util';

const method = 'fcm';
const regIds = [
  'APA91bFQCD9Ndd8uVggMhj1usfeWsKIfGyBUWMprpZLGciWrMjS-77bIY24IMQNeEHzjidCcddnDxqYo-UEV03xw6ySmtIgQyzTqhSxhPGAi1maf6KDMAQGuUWc6L5Khze8YK9YrL9I_WD1gl49P3f_9hr08ZAS5Tw',
];
const message = {
  title: 'title',
  body: 'body',
  sound: 'mySound.aiff',
  custom: {
    sender: 'banshi-test',
  },
};
const fcmOpts = {
  fcm: {
    name: 'testAppName',
    credential: { getAccessToken: () => Promise.resolve({}) },
  },
  useFCMMethodInsteadOfGCM: true,
};
const pn = new PN(fcmOpts);

const testSuccess = testPushSuccess(method, regIds);

let sendMethod;

function sendOkMethod() {
  return sinon.stub(
    fbMessaging.prototype,
    'sendEachForMulticast',
    function sendFCM(firebaseMessage) {
      const { custom, ...messageData } = message;

      expect(firebaseMessage.tokens).to.deep.equal(regIds);

      expect(firebaseMessage.android.priority).to.equal('high');
      expect(firebaseMessage.android.notification).to.deep.include(messageData);

      expect(firebaseMessage.apns.payload.aps.sound).to.equal(
        messageData.sound
      );

      expect(firebaseMessage.apns.payload.aps.alert).to.deep.include({
        title: messageData.title,
        body: messageData.body,
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
