import sinon from 'sinon';
import gcm from 'node-gcm';
import { expect } from 'chai';

export const testPushSuccess = (method, regIds) => (err, results, done) => {
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
        if (method === 'gcm') {
          expect(message).to.have.property('originalRegId');
          expect(regIds).to.include(message.originalRegId);
        }
      });
    });
    done(err);
  } catch (e) {
    done(err || e);
  }
};

export const testPushError = (method, regIds, errMessage) => (
  err,
  results,
  done
) => {
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
        expect(message.error.message).to.equal(errMessage);
        expect(message.errorMsg).to.be.a('string');
        expect(message.errorMsg).to.equal(errMessage);
      });
    });
    done(err);
  } catch (e) {
    done(err || e);
  }
};

export const testPushException = (errMessage) => (err, results, done) => {
  try {
    expect(results).to.equal(undefined);
    expect(err).to.be.instanceOf(Error);
    expect(err.message).to.equal(errMessage);
    done();
  } catch (e) {
    done(err || e);
  }
};

export const sendOkMethodGCM = (regIds, data) =>
  sinon.stub(
    gcm.Sender.prototype,
    'send',
    (message, recipients, retries, cb) => {
      expect(recipients).to.be.instanceOf(Object);
      expect(recipients).to.have.property('registrationTokens');
      const { registrationTokens } = recipients;
      expect(registrationTokens).to.be.instanceOf(Array);
      registrationTokens.forEach((regId) => expect(regIds).to.include(regId));
      expect(retries).to.be.a('number');
      expect(message).to.be.instanceOf(gcm.Message);
      expect(message.params.notification.title).to.eql(data.title);
      expect(message.params.notification.body).to.eql(data.body);
      expect(message.params.notification.sound).to.eql(data.sound);
      expect(message.params.data.sender).to.eql(data.custom.sender);
      expect(message.params.priority).to.equal('high');
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
