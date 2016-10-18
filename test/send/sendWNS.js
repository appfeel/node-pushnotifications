import { describe, it, before, after } from 'mocha'; // eslint-disable-line import/no-extraneous-dependencies
import { expect } from 'chai'; // eslint-disable-line import/no-extraneous-dependencies
import sinon from 'sinon'; // eslint-disable-line import/no-extraneous-dependencies
import wns from 'wns';
import PN from '../../src';

const method = 'wns';
const regIds = [
    'https://db5.notify.windows.com/?token=AwYAAAD8sfbDrL9h7mN%2bmwlkSkQZCIfv4QKeu1hYRipj2zNvXaMi9ZAax%2f6CDfysyHp61STCO1pCFPt%2b9L4Jod72JhIcjDr8b2GxuUOBMTP%2b6%2bqxEfSB9iZfSATdZbdF7cJHSRA%3d',
    'https://db5.notify.windows.com/?token=AwYAAAD8sfbDrL9h7mN%2bmwlkSkQZCIfv4QKeu1hYRipj2zNvXaMi9ZAax%2f6CDfysyHp61STCO1pCFPt%2b9L4Jod72JhIcjDr8b2GxuUOBMTP%2b6%2bqxEfSB9iZfSATdZbdF7cJHSRA%3d',
    'https://db5.notify.windows.com/?token=AwYAAAD8sfbDrL9h7mN%2bmwlkSkQZCIfv4QKeu1hYRipj2zNvXaMi9ZAax%2f6CDfysyHp61STCO1pCFPt%2b9L4Jod72JhIcjDr8b2GxuUOBMTP%2b6%2bqxEfSB9iZfSATdZbdF7cJHSRA%3d',
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
const pn = new PN({
    wns: {
        notificationMethod: 'sendTileSquareBlock',
    },
});
const fErr = new Error('Forced error');
const sendWNS = {
    restore: () => {
        wnsMethods.forEach((wnsMethod) => {
            sendWNS[wnsMethod].restore();
        });
    },
};
let sendMethod;

function sendOkMethod() {
    wnsMethods.forEach((wnsMethod) => {
        sendWNS[wnsMethod] = sinon.stub(wns, wnsMethod, (channel, message, options, cb) => {
            expect(message).to.have.deep.property('title', data.title);
            expect(message).to.have.deep.property('body', data.body);
            expect(message).to.have.deep.property('custom', data.custom);
            expect(message).to.be.an('object');
            cb(null, {});
        });
    });
    return sendWNS;
}

function sendFailureMethod() {
    wnsMethods.forEach((wnsMethod) => {
        sendWNS[wnsMethod] = sinon.stub(wns, wnsMethod, (channel, message, options, cb) => {
            cb(null, {
                innerError: fErr.message,
            });
        });
    });
    return sendWNS;
}

function sendErrorMethod() {
    wnsMethods.forEach((wnsMethod) => {
        sendWNS[wnsMethod] = sinon.stub(wns, wnsMethod, (channel, message, options, cb) => {
            cb(fErr);
        });
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

describe('push-notifications-wns', () => {
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
            pn.send(regIds, data, (err, results) => test(err, results, done));
        });

        it('the exception should be catched (promise)', (done) => {
            pn.send(regIds, data)
                .then(results => test(null, results, done))
                .catch(err => test(err, undefined, done));
        });
    });
});
