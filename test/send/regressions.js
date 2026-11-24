import { expect } from 'chai';
import sinon from 'sinon';
import wns from 'wns';
import PN from '../../src/index.js';
import sendWNS from '../../src/sendWNS.js';

const channel = 'https://db5.notify.windows.com/?token=regression';
const data = { title: 'title', body: 'body' };

describe('regressions', () => {
  describe('callback that throws', () => {
    it('send() invokes the callback once and rejects with its error', () => {
      const pn = new PN({});
      const boom = new Error('boom');
      let calls = 0;

      return pn
        .send(['unknown-reg-id'], data, (err) => {
          calls += 1;
          if (!err) throw boom;
        })
        .then(
          () => expect.fail('expected rejection'),
          (err) => {
            expect(err).to.equal(boom);
            expect(calls).to.equal(1);
          }
        );
    });

    it('sendWith() invokes the callback once and rejects with its error', () => {
      const pn = new PN({});
      const boom = new Error('boom');
      let calls = 0;
      const method = () => Promise.resolve({ method: 'fake', success: 1, failure: 0, message: [] });

      return pn
        .sendWith(method, ['id'], data, (err) => {
          calls += 1;
          if (!err) throw boom;
        })
        .then(
          () => expect.fail('expected rejection'),
          (err) => {
            expect(err).to.equal(boom);
            expect(calls).to.equal(1);
          }
        );
    });
  });

  describe('sendWNS', () => {
    let stub;
    afterEach(() => stub.restore());

    const settings = (extra = {}) => ({
      wns: {
        client_id: 'client',
        client_secret: 'secret',
        notificationMethod: 'sendTileSquareBlock',
        ...extra,
      },
    });

    it('settles when wns calls back with only an error while using an accessToken', () => {
      // Matches wns on request errors and non-2xx HTTP statuses: callback(err), no response
      const tokens = [];
      stub = sinon.stub(wns, 'sendTileSquareBlock', (regId, payload, options, cb) => {
        tokens.push(options.accessToken);
        const err = new Error('Channel expired');
        err.newAccessToken = 'refreshed';
        process.nextTick(() => cb(err));
      });

      return sendWNS([channel, channel], data, settings({ accessToken: 'initial' })).then(
        (result) => {
          expect(result.success).to.equal(0);
          expect(result.failure).to.equal(2);
          expect(result.message[0].errorMsg).to.equal('Channel expired');
          // The refreshed token from the error is used for the next send
          expect(tokens).to.deep.equal(['initial', 'refreshed']);
        }
      );
    });

    it('keeps the current accessToken when wns does not issue a new one', () => {
      const tokens = [];
      stub = sinon.stub(wns, 'sendTileSquareBlock', (regId, payload, options, cb) => {
        tokens.push(options.accessToken);
        process.nextTick(() => cb(null, {}));
      });

      return sendWNS([channel, channel], data, settings({ accessToken: 'initial' })).then(() => {
        expect(tokens).to.deep.equal(['initial', 'initial']);
      });
    });

    it('keeps results of concurrent calls separate', () => {
      const pending = [];
      stub = sinon.stub(wns, 'sendTileSquareBlock', (regId, payload, options, cb) => {
        pending.push(() => cb(null, {}));
      });

      const first = sendWNS([channel], data, settings());
      const second = sendWNS([channel, channel], data, settings());
      pending.forEach((respond) => respond());

      return Promise.all([first, second]).then(([a, b]) => {
        expect(a).to.not.equal(b);
        expect(a.success).to.equal(1);
        expect(a.message).to.have.lengthOf(1);
        expect(b.success).to.equal(2);
        expect(b.message).to.have.lengthOf(2);
      });
    });
  });
});
