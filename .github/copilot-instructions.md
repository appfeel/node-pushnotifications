# Copilot Instructions for AI Agents

## Project Overview

This repository implements a Node.js module for sending push notifications across multiple platforms: Apple (APN), Google (FCM), Windows (WNS), Amazon (ADM), and Web-Push. The core logic is in `lib/` and `src/`, with each platform handled by a dedicated file (e.g., `sendAPN.js`, `sendFCM.js`).

**Note:** Legacy GCM (Google Cloud Messaging) support has been removed. All Android push notifications now route exclusively through Firebase Cloud Messaging (FCM).

## Architecture & Data Flow

- **Entry Point:** Use `PushNotifications` from `lib/index.js` or `src/index.js`.
- **Settings:** Each platform's credentials/config are passed to the constructor. See the example in `README.md`.
- **Sending:** The main method is `push.send(registrationIds, data, callback)` or as a Promise. It auto-detects device type and routes to the correct sender.
- **Platform Senders:** Each sender (e.g., `sendAPN.js`, `sendFCM.js`) implements the logic for its platform. Shared utilities are in `lib/utils/` and `src/utils/`.
- **RegId Detection:** Device type is inferred from the registration ID structure. See `PN.getPushMethodByRegId` for details.

## Developer Workflows

- **Install:** `npm install`
- **Test:** Run all tests with `npm test`. Tests are in `test/` and cover basic flows and platform-specific cases.
- **Debug:** Use the callback or Promise error/result from `push.send`. Each result object includes method, success/failure counts, and error details per device.
- **Build:** No build step required for basic usage. ES6 is used, but compatible with ES5 via Babel if needed.

## Conventions & Patterns

- **Platform-specific files:** Each push service has its own file for isolation and clarity. Legacy GCM is no longer supported.
- **Unified Data Model:** The `data` object for notifications is normalized across platforms. See `README.md` for all supported fields.
- **Error Handling:** Errors are unified and returned in the result array from `push.send`.
- **RegId Format:** Prefer object format for registration IDs (`{id, type}`), but string format is supported for legacy reasons.
- **Android Routing:** All Android push notifications (both long regIds and ADM/AMZN tokens without explicit type) route through FCM.
- **Chunking:** Android tokens are chunked in batches of 1,000 automatically by FCM.
- **Constants:** Use constants from `constants.js` for platform types. Available constants: `FCM_METHOD`, `APN_METHOD`, `WNS_METHOD`, `ADM_METHOD`, `WEB_METHOD`, `UNKNOWN_METHOD`.

## Integration Points

- **External Libraries:**
  - APN: `@parse/node-apn`
  - FCM: `firebase-admin` (all Android push notifications)
  - ADM: `node-adm`
  - WNS: `wns`
  - Web-Push: `web-push`
  - Note: Legacy `node-gcm` library has been removed
- **Credentials:** Place service account keys and certificates in appropriate locations (see `README.md` for examples).

## Key Files & Directories

- `lib/` and `src/`: Main implementation (mirrored structure, both CommonJS)
- `test/`: Test cases (78 tests, all passing) and sample credentials
- `README.md`: Usage, configuration, and data model reference
- `.github/copilot-instructions.md`: This file - AI agent guidance

## Example Usage

See `README.md` for a full example of settings, registration ID formats, and sending notifications.

---

For unclear or incomplete sections, please provide feedback or specify which workflows, patterns, or integrations need further documentation.
