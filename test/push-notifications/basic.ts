/* eslint-env mocha */
import path from 'path';
import chai from 'chai';
import dirtyChai from 'dirty-chai';
import sinonChai from 'sinon-chai';
import { spy } from 'sinon';
import { DEFAULT_SETTINGS } from '../../src/constants';
import PN from '../../src';
import {
  DefaultSettings,
  RegId,
  RegIdNodePushNotifications,
  RegIdType,
} from '../../src/types';

chai.use(dirtyChai);
chai.use(sinonChai);
const { expect } = chai;

describe('push-notifications: instantiation and class properties', () => {
  describe('empty options', () => {
    it('should have send methods and settings options', () => {
      const pn = new PN(DEFAULT_SETTINGS);
      expect(pn).to.have.property('send');
      const settings = pn.getOptions();
      expect(settings).to.have.property('gcm');
      expect(settings).to.have.property('apn');
      expect(settings).to.have.property('adm');
      expect(settings).to.have.property('wns');
      expect(settings).to.have.property('web');
    });
  });

  describe('override options with constructor', () => {
    let pn;
    const settings: DefaultSettings = {
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
          subject: "< 'mailto' Address or URL >",
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
      pn = new PN(DEFAULT_SETTINGS);
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
      expect(apnShutdownSpy).to.have.been.calledOnce('');
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
      const pn = new PN(DEFAULT_SETTINGS);
      pn.send([], {})
        .then((results) => test(null, results, done))
        .catch(done);
    });

    it('should fire callback with an empty result', (done) => {
      const pn = new PN(DEFAULT_SETTINGS);
      pn.send([], undefined, (err, results) => test(null, results, done));
    });
  });

  describe('check getPushMethodByRegId returns expected push method types', () => {
    const regIds: { [key: string]: RegId } = {
      androidRegId:
        'APA91bFQCD9Ndd8uVggMhj1usfeWsKIfGyBUWMprpZLGciWrMjS-77bIY24IMQNeEHzjidCcddnDxqYo-UEV03xw6ySmtIgQyzTqhSxhPGAi1maf6KDMAQGuUWc6L5Khze8YK9YrL9I_WD1gl49P3f_9hr08ZAS5Tw',
      androidWithAdmSubstringRegId:
        'APA9admQCD9Ndd8uVggMhj1usfeWsKIfGyBUWMprpZLGciWrMjS-77bIY24IMQNeEHzjidCcddnDxqYo-UEV03xw6ySmtIgQyzTqhSxhPGAi1maf6KDMAQGuUWc6L5Khze8YK9YrL9I_WD1gl49P3f_9hr08ZAS5Tw',
      androidWithAmznSubscringRegId:
        'amzn1mQCD9Ndd8uVggMhj1usfeWsKIfGyBUWMprpZLGciWrMjS-77bIY24IMQNeEHzjidCcddnDxqYo-UEV03xw6ySmtIgQyzTqhSxhPGAi1maf6KDMAQGuUWc6L5Khze8YK9YrL9I_WD1gl49P3f_9hr08ZAS5Tw',
      iOSRegId:
        '43e798c31a282d129a34d84472bbdd7632562ff0732b58a85a27c5d9fdf59b69',
      iOSRegIdLong:
        '80C2D3913EE662DD25C5A3B7FCC8CBBADCA9DA429D13F106F37BF8EA268AFC610824D1B378D6E5FAFA86C63A63FDADA7A9067E1B0BC461E4020346199000D26418F38E73E32174D69F69DC35BEA27CE5',
      windowsPhoneRegId:
        'https://db5.notify.windows.com/?token=AwYAAAD8sfbDrL9h7mN%2bmwlkSkQZCIfv4QKeu1hYRipj2zNvXaMi9ZAax%2f6CDfysyHp61STCO1pCFPt%2b9L4Jod72JhIcjDr8b2GxuUOBMTP%2b6%2bqxEfSB9iZfSATdZbdF7cJHSRA%3d',
      amazonRegId:
        'amzn1.adm-registration.v2.Y29tLmFtYXpvbi5EZXZpY2VNZXNzYWdpbmcuUmVnaXN0cmF0aW9uSWRFbmNyeXB0aW9uS2V5ITEhOE9rZ2h5TXlhVEFFczg2ejNWL3JMcmhTa255Uk5BclhBbE1XMFZzcnU1aFF6cTlvdU5FbVEwclZmdk5oTFBVRXVDN1luQlRSNnRVRUViREdQSlBvSzRNaXVRRUlyUy9NYWZCYS9VWTJUaGZwb3ZVTHhlRTM0MGhvampBK01hVktsMEhxakdmQStOSXRjUXBTQUhNU1NlVVVUVkFreVRhRTBCYktaQ2ZkUFdqSmIwcHgzRDhMQnllVXdxQ2EwdHNXRmFVNklYL0U4UXovcHg0K3Jjb25VbVFLRUVVOFVabnh4RDhjYmtIcHd1ZThiekorbGtzR2taMG95cC92Y3NtZytrcTRPNjhXUUpiZEk3QzFvQThBRTFWWXM2NHkyMjdYVGV5RlhhMWNHS0k9IW5GNEJMSXNleC9xbWpHSU52NnczY0E9PQ',
      webRegId: {
        endpoint: 'https://push.subscription.url',
        // keys: {
        //   p256dh: 'userPublicEncryptionKey',
        //   auth: 'userAuthSecret',
        // },
      },
      androidObject: {
        id: 'APA91bFQCD9Ndd8uVggMhj1usfeWsKIfGyBUWMprpZLGciWrMjS-77bIY24IMQNeEHzjidCcddnDxqYo-UEV03xw6ySmtIgQyzTqhSxhPGAi1maf6KDMAQGuUWc6L5Khze8YK9YrL9I_WD1gl49P3f_9hr08ZAS5Tw',
        type: RegIdType.gcm,
      },
      androidObjectWhatever: {
        id: 'whatever',
        type: RegIdType.gcm,
      },
      iosObject: {
        id: '43e798c31a282d129a34d84472bbdd7632562ff0732b58a85a27c5d9fdf59b69',
        type: RegIdType.apn,
      },
      iosObjectWhatever: {
        id: 'whatever',
        type: RegIdType.apn,
      },
      unknownRegId: 'abcdef',
    };

    it('Android / GCM', () => {
      let pn = new PN(DEFAULT_SETTINGS);
      expect(pn.getPushMethodByRegId(regIds.androidRegId).regId).to.equal(
        regIds.androidRegId
      );
      expect(pn.getPushMethodByRegId(regIds.androidRegId).type).to.equal(
        RegIdType.gcm
      );

      expect(
        pn.getPushMethodByRegId(regIds.androidWithAdmSubstringRegId).regId
      ).to.equal(regIds.androidWithAdmSubstringRegId);
      expect(
        pn.getPushMethodByRegId(regIds.androidWithAdmSubstringRegId).type
      ).to.equal(RegIdType.gcm);

      expect(
        pn.getPushMethodByRegId(regIds.androidWithAmznSubscringRegId).regId
      ).to.equal(regIds.androidWithAmznSubscringRegId);
      expect(
        pn.getPushMethodByRegId(regIds.androidWithAmznSubscringRegId).type
      ).to.equal(RegIdType.gcm);

      const settings = {
        isAlwaysUseFCM: true,
      };
      pn = new PN(settings);
      expect(pn.getPushMethodByRegId(regIds.unknownRegId).regId).to.equal(
        regIds.unknownRegId
      );
      expect(pn.getPushMethodByRegId(regIds.unknownRegId).type).to.equal(
        RegIdType.gcm
      );

      expect(pn.getPushMethodByRegId(regIds.androidObject).regId).to.equal(
        (regIds.androidObject as RegIdNodePushNotifications).id
      );
      expect(pn.getPushMethodByRegId(regIds.androidObject).type).to.equal(
        RegIdType.gcm
      );

      expect(
        pn.getPushMethodByRegId(regIds.androidObjectWhatever).regId
      ).to.equal(
        (regIds.androidObjectWhatever as RegIdNodePushNotifications).id
      );
      expect(
        pn.getPushMethodByRegId(regIds.androidObjectWhatever).type
      ).to.equal(RegIdType.gcm);
    });

    it('iOS / APN', () => {
      const pn = new PN(DEFAULT_SETTINGS);
      expect(pn.getPushMethodByRegId(regIds.iOSRegId).regId).to.equal(
        regIds.iOSRegId
      );
      expect(pn.getPushMethodByRegId(regIds.iOSRegId).type).to.equal(
        RegIdType.apn
      );

      expect(pn.getPushMethodByRegId(regIds.iosObject).regId).to.equal(
        (regIds.iosObject as RegIdNodePushNotifications).id
      );
      expect(pn.getPushMethodByRegId(regIds.iosObject).type).to.equal(
        RegIdType.apn
      );

      expect(pn.getPushMethodByRegId(regIds.iosObjectWhatever).regId).to.equal(
        (regIds.iosObjectWhatever as RegIdNodePushNotifications).id
      );
      expect(pn.getPushMethodByRegId(regIds.iosObjectWhatever).type).to.equal(
        RegIdType.apn
      );
    });

    it('iOS / APN long', () => {
      const pn = new PN(DEFAULT_SETTINGS);
      expect(pn.getPushMethodByRegId(regIds.iOSRegIdLong).regId).to.equal(
        regIds.iOSRegIdLong
      );
      expect(pn.getPushMethodByRegId(regIds.iOSRegIdLong).type).to.equal(
        RegIdType.apn
      );
    });

    it('Windows Phone / WNS', () => {
      const pn = new PN(DEFAULT_SETTINGS);
      expect(pn.getPushMethodByRegId(regIds.windowsPhoneRegId).regId).to.equal(
        regIds.windowsPhoneRegId
      );
      expect(pn.getPushMethodByRegId(regIds.windowsPhoneRegId).type).to.equal(
        RegIdType.wns
      );
    });

    it('Amazon / ADM', () => {
      const pn = new PN(DEFAULT_SETTINGS);
      expect(pn.getPushMethodByRegId(regIds.amazonRegId).regId).to.equal(
        regIds.amazonRegId
      );
      expect(pn.getPushMethodByRegId(regIds.amazonRegId).type).to.equal(
        RegIdType.adm
      );
    });

    it('Web / WEB', () => {
      const pn = new PN(DEFAULT_SETTINGS);
      expect(pn.getPushMethodByRegId(regIds.webRegId).regId).to.equal(
        regIds.webRegId
      );
      expect(pn.getPushMethodByRegId(regIds.webRegId).type).to.equal(
        RegIdType.web
      );
    });

    it('Unknown / UNKNOWN', () => {
      const pn = new PN(DEFAULT_SETTINGS);
      expect(pn.getPushMethodByRegId(regIds.unknownRegId).regId).to.equal(
        regIds.unknownRegId
      );
      expect(pn.getPushMethodByRegId(regIds.unknownRegId).type).to.equal(
        RegIdType.unknown
      );
    });
  });
});
