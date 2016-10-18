import path from 'path';
import { describe, it } from 'mocha'; // eslint-disable-line import/no-extraneous-dependencies
import { expect } from 'chai'; // eslint-disable-line import/no-extraneous-dependencies
import PN from '../../src';

describe('push-notifications: instantiation and class properties', () => {
    describe('empty options', () => {
        it('should have send methods and settings options', () => {
            const pn = new PN();
            expect(pn).to.have.property('send');
            expect(pn.settings).to.have.property('gcm');
            expect(pn.settings).to.have.property('apn');
            expect(pn.settings).to.have.property('adm');
            expect(pn.settings).to.have.property('wns');
        });

        it('should override gcm options', () => {
            const settings = {
                gcm: {
                    id: 'gcm id',
                },
                apn: {
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
            };
            const pn = new PN(settings);
            expect(pn.settings.gcm).to.deep.equal(settings.gcm);
            expect(pn.settings.apn).to.deep.equal(settings.apn);
            expect(pn.settings.wns).to.deep.equal(settings.wns);
            expect(pn.settings.adm).to.deep.equal(settings.adm);
        });
    });

    describe('override options', () => {
        let pn;
        const settings = {
            apn: {
                options: {
                    token: {
                        key: '',
                        keyId: '',
                        teamId: '',
                    },
                },
            },
        };
        const test = () => {
            expect(pn.settings.apn).to.deep.equal(settings.apn);
            expect(pn.settings).to.have.property('apn');
            expect(pn.settings).to.have.property('adm');
            expect(pn.settings).to.have.property('wns');
        };
        it('should override apn options', () => {
            pn = new PN(settings);
            test();
        });

        it('update options after creation', () => {
            pn = new PN();
            pn.setOptions(settings);
            test();
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
