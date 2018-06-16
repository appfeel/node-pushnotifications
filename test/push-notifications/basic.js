/* eslint-env mocha */
import path from 'path';
import chai from 'chai';
import dirtyChai from 'dirty-chai';
import sinonChai from 'sinon-chai';
import { spy } from 'sinon';
import PN from '../../src';

const { expect } = chai;
chai.use(dirtyChai);
chai.use(sinonChai);

describe('push-notifications: instantiation and class properties', () => {
    describe('empty options', () => {
        it('should have send methods and settings options', () => {
            const pn = new PN();
            expect(pn).to.have.property('send');
            expect(pn.settings).to.have.property('gcm');
            expect(pn.settings).to.have.property('apn');
            expect(pn.settings).to.have.property('adm');
            expect(pn.settings).to.have.property('wns');
            expect(pn.settings).to.have.property('web');
        });
    });

    describe('override options with constructor', () => {
        let pn;
        const settings = {
            gcm: {
                id: 'gcm id',
            },
            apn: {
                token: {
                    key: 'testKey',
                    keyId: 'testKeyId',
                    teamId: 'testTeamId',
                },
                cert: path.resolve('test/send/cert.pem'),
                key: path.resolve('test/send/key.pem'),
            },
            wns: {
                client_id: 'client id',
                client_secret: 'client secret',
                notificationMethod: 'sendTileSquareBlock',
            },
            adm: {
                client_id: 'client id',
                client_secret: 'client secret',
            },
            web: {
                vapidDetails: {
                    subject: '< \'mailto\' Address or URL >',
                    publicKey: '< URL Safe Base64 Encoded Public Key >',
                    privateKey: '< URL Safe Base64 Encoded Private Key >',
                },
                gcmAPIKey: 'gcmkey',
                TTL: 2419200,
                contentEncoding: 'aes128gcm',
                headers: {},
            },
        };

        before(() => {
            pn = new PN(settings);
        });

        it('should override the given options', () => {
            expect(pn.settings.apn).to.eql(settings.apn);
            expect(pn.settings.gcm).to.eql(settings.gcm);
            expect(pn.settings.adm).to.eql(settings.adm);
            expect(pn.settings.wns).to.eql(settings.wns);
            expect(pn.settings.web).to.eql(settings.web);
        });
    });

    describe('setOptions', () => {
        let pn;
        const settings = {
            gcm: {
                id: '123',
                phonegap: false,
            },
            apn: {
                token: {
                    key: 'test',
                },
            },
        };
        const apnShutdownSpy = spy();

        before(() => {
            pn = new PN();
            pn.apn.shutdown = apnShutdownSpy;
            pn.setOptions(settings);
        });

        it('should override the options', () => {
            expect(pn.settings.apn).to.eql(settings.apn);
            expect(pn.settings.gcm).to.eql(settings.gcm);
            expect(pn.settings).to.have.property('adm');
            expect(pn.settings).to.have.property('wns');
        });

        it('should shutdown any previous APN providers', () => {
            expect(apnShutdownSpy).to.have.been.calledOnce();
        });
    });

    describe('calling send with empty registration ids', () => {
        const test = (err, results, done) => {
            try {
                expect(err).to.equal(null);
                results.forEach((result) => {
                    expect(result.method).to.equal('none');
                    expect(result.success).to.equal(0);
                    expect(result.failure).to.equal(0);
                    expect(result.message.length).to.equal(0);
                });
                done(err);
            } catch (e) {
                done(err || e);
            }
        };
        it('should resolve the promise with an empty result', (done) => {
            const pn = new PN();
            pn.send()
                .then(results => test(null, results, done))
                .catch(done);
        });

        it('should fire callback with an empty result', (done) => {
            const pn = new PN();
            pn.send(undefined, undefined, (err, results) => test(null, results, done));
        });
    });
});
