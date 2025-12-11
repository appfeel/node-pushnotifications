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
      });
    });
    done(err);
  } catch (e) {
    done(err || e);
  }
};

export const testPushError = (method, regIds, errMessage) => (err, results, done) => {
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
