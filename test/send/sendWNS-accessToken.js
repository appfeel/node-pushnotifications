/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import wns from 'wns';
import PN from '../../src';
import {
  sendOkMethodGCM,
  testPushSuccess,
  testPushError,
  testPushException,
} from '../util';

const method = 'wns';
const regIds = [
  'https://db5.notify.windows.com/?token=AwYAAAD8sfbDrL9h7mN%2bmwlkSkQZCIfv4QKeu1hYRipj2zNvXaMi9ZAax%2f6CDfysyHp61STCO1pCFPt%2b9L4Jod72JhIcjDr8b2GxuUOBMTP%2b6%2bqxEfSB9iZfSATdZbdF7cJHSRA%3d', // windows phone
  'https://db5.notify.windows.com/?token=AwYAAAD8sfbDrL9h7mN%2bmwlkSkQZCIfv4QKeu1hYRipj2zNvXaMi9ZAax%2f6CDfysyHp61STCO1pCFPt%2b9L4Jod72JhIcjDr8b2GxuUOBMTP%2b6%2bqxEfSB9iZfSATdZbdF7cJHSRA%3d', // windows phone
  'https://db5.notify.windows.com/?token=AwYAAAD8sfbDrL9h7mN%2bmwlkSkQZCIfv4QKeu1hYRipj2zNvXaMi9ZAax%2f6CDfysyHp61STCO1pCFPt%2b9L4Jod72JhIcjDr8b2GxuUOBMTP%2b6%2bqxEfSB9iZfSATdZbdF7cJHSRA%3d', // windows phone
];
const data = {
  title: 'title',
  body: 'body',
  sound: 'mySound.aiff',
  custom: {
    sender: 'appfeel-test',
  },
};
const wnsMethods = [
  'sendTileSquareBlock',
  'sendTileSquareText01',
  'sendTileSquareText02',
  'sendTileSquareText03',
  'sendTileSquareText04',
  'sendTileWideText01',
  'sendTileWideText02',
  'sendTileWideText03',
  'sendTileWideText04',
  'sendTileWideText05',
  'sendTileWideText06',
  'sendTileWideText07',
  'sendTileWideText08',
  'sendTileWideText09',
  'sendTileWideText10',
  'sendTileWideText11',
  'sendTileSquareImage',
  'sendTileSquarePeekImageAndText01',
  'sendTileSquarePeekImageAndText02',
  'sendTileSquarePeekImageAndText03',
  'sendTileSquarePeekImageAndText04',
  'sendTileWideImage',
  'sendTileWideImageCollection',
  'sendTileWideImageAndText01',
  'sendTileWideImageAndText02',
  'sendTileWideBlockAndText01',
  'sendTileWideBlockAndText02',
  'sendTileWideSmallImageAndText01',
  'sendTileWideSmallImageAndText02',
  'sendTileWideSmallImageAndText03',
  'sendTileWideSmallImageAndText04',
  'sendTileWideSmallImageAndText05',
  'sendTileWidePeekImageCollection01',
  'sendTileWidePeekImageCollection02',
  'sendTileWidePeekImageCollection03',
  'sendTileWidePeekImageCollection04',
  'sendTileWidePeekImageCollection05',
  'sendTileWidePeekImageCollection06',
  'sendTileWidePeekImageAndText01',
  'sendTileWidePeekImageAndText02',
  'sendTileWidePeekImage01',
  'sendTileWidePeekImage02',
  'sendTileWidePeekImage03',
  'sendTileWidePeekImage04',
  'sendTileWidePeekImage05',
  'sendTileWidePeekImage06',
];

const wnsOpts = {
  wns: {
    client_id: 'client', // PUT YOUR WNS CLIENT ID,
    client_secret: 'secret', // PUT YOUR WNS CLIENT SECRET,
    notificationMethod: 'sendTileSquareBlock',
    accessToken: '0',
  },
};
const pn = new PN(wnsOpts);
const fErr = new Error('Forced error');
const sendWNS = {
  restore: () => {
    wnsMethods.forEach((wnsMethod) => {
      sendWNS[wnsMethod].restore();
    });
  },
};

const testSuccess = testPushSuccess(method, regIds);
const testSuccessGCM = testPushSuccess('gcm', regIds);
const testError = testPushError(method, regIds, fErr.message);
const testException = testPushException(fErr.message);

let sendMethod;
let i = 0;

function sendOkMethod() {
  wnsMethods.forEach((wnsMethod) => {
    sendWNS[wnsMethod] = sinon.stub(
      wns,
      wnsMethod,
      (channel, message, options, cb) => {
        expect(options)
          .to.be.an('object')
          .includes.keys(['client_id', 'client_secret', 'accessToken']);
        ['client_id', 'client_secret'].forEach((key) =>
          expect(options[key]).equal(wnsOpts.wns[key])
        );
        expect(channel).to.be.a('string');
        expect(regIds).to.include(channel);
        expect(message).to.have.deep.property('title', data.title);
        expect(message).to.have.deep.property('body', data.body);
        expect(message).to.have.deep.property('custom', data.custom);
        expect(message).to.be.an('object');
        expect(options.accessToken).to.equal(`${i}`);
        i += 1;
        cb(null, {
          newAccessToken: `${i}`,
        });
      }
    );
  });
  return sendWNS;
}

function sendFailureMethod() {
  wnsMethods.forEach((wnsMethod) => {
    sendWNS[wnsMethod] = sinon.stub(
      wns,
      wnsMethod,
      (channel, message, options, cb) => {
        expect(options.accessToken).to.equal(`${i}`);
        i += 1;
        cb(null, {
          innerError: fErr.message,
          newAccessToken: `${i}`,
        });
      }
    );
  });
  return sendWNS;
}

function sendThrowExceptionMethod() {
  wnsMethods.forEach((wnsMethod) => {
    sendWNS[wnsMethod] = sinon.stub(wns, wnsMethod, () => {
      throw fErr;
    });
  });
  return sendWNS;
}

describe('push-notifications-wns-access-token', () => {
  describe('send push notifications successfully changing access token each request', () => {
    before(() => {
      sendMethod = sendOkMethod();
    });

    after(() => {
      sendMethod.restore();
    });

    it('all responses should be successful (callback)', (done) => {
      i = 0;
      pn.send(regIds, data, (err, results) => testSuccess(err, results, done));
    });

    it('all responses should be successful (promise)', (done) => {
      i = 0;
      pn.send(regIds, data)
        .then((results) => testSuccess(null, results, done))
        .catch(done);
    });
  });

  describe('send push notifications failure changing access token each request', () => {
    before(() => {
      sendMethod = sendFailureMethod();
    });

    after(() => {
      sendMethod.restore();
    });

    it('all responses should be failed (callback)', (done) => {
      i = 0;
      pn.send(regIds, data, (err, results) => testError(err, results, done));
    });

    it('all responses should be failed (promise)', (done) => {
      i = 0;
      pn.send(regIds, data)
        .then((results) => testError(null, results, done))
        .catch(done);
    });
  });

  describe('send push notifications throw exception changing access token each request', () => {
    before(() => {
      sendMethod = sendThrowExceptionMethod();
    });

    after(() => {
      sendMethod.restore();
    });

    it('the exception should be catched (callback)', (done) => {
      i = 0;
      pn.send(regIds, data, (err, results) =>
        testException(err, results, done)
      ).catch(() => {}); // This is to avoid UnhandledPromiseRejectionWarning
    });

    it('the exception should be catched (promise)', (done) => {
      i = 0;
      pn.send(regIds, data)
        .then((results) => testException(null, results, done))
        .catch((err) => testException(err, undefined, done));
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
