# AGENTS.md

Node.js library that sends push notifications through FCM, APNs, Web Push, WNS and ADM with one API.

## Commands

- `npm test`: mocha with `@babel/register`
- `npm run lint`: ESLint and `prettier --check .`
- `npm run lint:fix`: fix ESLint and Prettier issues
- `npm run format`: Prettier
- `npm run build`: Babel `src/` to `lib/`

Run tests and lint before finishing a change.

## Layout

- `src/push-notifications.js`: `PN` class. `send()` routes each destination with `getPushMethodByRegId()` and calls the senders in parallel.
- `src/sendFCM.js`, `sendAPN.js`, `sendWeb.js`, `sendWNS.js`, `sendADM.js`: one sender per service. Each resolves to `{ method, success, failure, message: [{ regId, error, errorMsg, ... }] }`.
- `src/utils/tools.js`: builds the APNs notification and the FCM Android message from `data`.
- `src/utils/fcmMessage.js`: assembles the FCM message (`data`, `android`, `apns`).
- `src/constants.js`: method names and default settings.
- `lib/`: build output, gitignored. `index.js` requires `lib/`, so build before testing the package entry point.
- `test/`: mocha tests. Senders are tested by stubbing the provider library with sinon.

## Conventions

- CommonJS in `src/`. Code is Prettier formatted (see `.prettierrc`).
- Per-device failures go in `message[]`. Only service-level failures reject.
- When adding a `data` field: update the builder in `src/utils/tools.js`, add a test, and add it to `docs/payload.md`.
- Keep the results format stable. Changing it is a breaking change.
