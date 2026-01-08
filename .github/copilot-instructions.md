# Copilot Instructions for AI Agents

## Project Overview

This repository implements a Node.js module for sending push notifications across multiple platforms: Apple (APN), Google (FCM), Windows (WNS), Amazon (ADM), and Web-Push. The core logic is in `lib/` and `src/`, with each platform handled by a dedicated file (e.g., `sendAPN.js`, `sendFCM.js`).

**Note:** Legacy GCM (Google Cloud Messaging) support has been removed. All Android push notifications now route exclusively through Firebase Cloud Messaging (FCM) using the Firebase Admin SDK.

## Architecture & Data Flow

- **Entry Point:** Use `PushNotifications` from `lib/index.js` or `src/index.js`.
- **Settings:** Each platform's credentials/config are passed to the constructor. See the example in `README.md`.
- **Sending:** The main method is `push.send(registrationIds, data, callback)` or as a Promise. It auto-detects device type and routes to the correct sender.
- **Platform Senders:** Each sender (e.g., `sendAPN.js`, `sendFCM.js`) implements the logic for its platform. Shared utilities are in `lib/utils/` and `src/utils/`.
- **RegId Detection:** Device type is inferred from the registration ID structure. See `PN.getPushMethodByRegId` for details.

## Developer Workflows

- **Install:** `npm install` (requires Node.js 18+)
- **Test:** Run all tests with `npm test`. Tests are in `test/` and cover basic flows and platform-specific cases (87 tests, all passing).
- **Debug:** Use the callback or Promise error/result from `push.send`. Each result object includes method, success/failure counts, and error details per device.
- **Build:** No build step required for basic usage. ES6 is used, but compatible with ES5 via Babel if needed.

## Conventions & Patterns

- **Platform-specific files:** Each push service has its own file for isolation and clarity. Legacy GCM is no longer supported.
- **Unified Data Model:** The `data` object for notifications is normalized across platforms. See `README.md` for all supported fields.
- **Error Handling:** Errors are unified and returned in the result array from `push.send`.
- **RegId Format:** Prefer object format for registration IDs (`{id, type}`), but string format is supported for legacy reasons.
- **Android Routing:** All Android push notifications route through FCM using Firebase Admin SDK.
- **Chunking:** Android tokens are chunked in batches of 1,000 automatically by FCM.
- **Constants:** Use constants from `constants.js` for platform types. Available constants: `FCM_METHOD`, `APN_METHOD`, `WNS_METHOD`, `ADM_METHOD`, `WEB_METHOD`, `UNKNOWN_METHOD`.

## Firebase Cloud Messaging (FCM) - Modern Implementation

### Message Building (src/utils/tools.js)

**buildAndroidMessage(data, options)**
- Converts unified notification data to Firebase Admin SDK AndroidMessage format
- Returns plain JavaScript object (no wrapper functions)
- Properties mapped to camelCase (Firebase SDK standard)
- Removes undefined values for clean API calls
- Converts TTL from seconds to milliseconds
- Supports all 20+ AndroidNotification properties

**buildAndroidNotification(data)**
- Maps input `data` object to AndroidNotification interface
- Supported properties:
  - Basic: `title`, `body`, `icon`, `color`, `sound`, `tag`, `imageUrl`
  - Localization: `titleLocKey`, `titleLocArgs`, `bodyLocKey`, `bodyLocArgs`
  - Android-specific: `channelId`, `notificationCount`, `ticker`, `sticky`, `visibility`
  - Behavior: `clickAction`, `priority`, `localOnly`, `eventTimestamp`
  - Accessibility: `ticker`
  - Vibration: `vibrateTimingsMillis`, `defaultVibrateTimings`
  - Sound: `defaultSound`
  - LED: `lightSettings`, `defaultLightSettings`
  - Proxy: `proxy` (notification-level, values: 'allow', 'deny', 'if_priority_lowered')

### FCM Configuration (src/sendFCM.js)

**Initialization Options:**
- `credential` or `serviceAccountKey` (required) - Firebase authentication
- `projectId` (optional) - Explicit Google Cloud project ID
- `databaseURL` (optional) - Realtime Database URL
- `storageBucket` (optional) - Cloud Storage bucket
- `serviceAccountId` (optional) - Service account email
- `databaseAuthVariableOverride` (optional) - Auth override for RTDB rules
- `httpAgent` (optional) - HTTP proxy agent for network requests
- `httpsAgent` (optional) - HTTPS proxy agent for network requests

All optional properties are dynamically added to Firebase initialization if defined.

### Proxy Support

**Two levels of proxy configuration:**

1. **Network-level (SDK initialization)**
   - `settings.fcm.httpAgent` and `settings.fcm.httpsAgent`
   - Controls how Firebase Admin SDK communicates with Google servers
   - Uses proxy agent libraries (http-proxy-agent, https-proxy-agent)
   - Applied at app initialization

2. **Notification-level (Android device)**
   - `data.proxy` property in notification message
   - Controls how Android devices handle notifications in proxy scenarios
   - Values: 'allow', 'deny', 'if_priority_lowered'
   - Per-message configuration

### Message Format

Firebase Admin SDK expects:
```javascript
{
  tokens: [...],
  android: {
    collapseKey: string,
    priority: 'high' | 'normal',
    ttl: number (milliseconds),
    restrictedPackageName: string,
    directBootOk: boolean,
    data: { [key: string]: string },
    notification: { ...AndroidNotification properties... },
    fcmOptions: { analyticsLabel: string }
  },
  apns: { ...APNs payload... }
}
```

## Integration Points

- **External Libraries:**
  - APN: `@parse/node-apn`
  - FCM: `firebase-admin` (all Android push notifications)
  - ADM: `node-adm`
  - WNS: `wns`
  - Web-Push: `web-push`
  - Proxy: `http-proxy-agent`, `https-proxy-agent` (user-supplied)
  - Note: Legacy `node-gcm` library has been removed
- **Credentials:** Place service account keys and certificates in appropriate locations (see `README.md` for examples).

## Key Files & Directories

- `lib/` and `src/`: Main implementation (mirrored structure, both CommonJS)
- `lib/sendFCM.js` / `src/sendFCM.js`: Firebase Admin SDK integration
- `lib/utils/tools.js` / `src/utils/tools.js`: Message building utilities
- `lib/utils/fcmMessage.js` / `src/utils/fcmMessage.js`: FCM message formatting
- `test/send/sendFCM.js`: FCM test suite (10 test cases covering message format, proxy support, and Firebase AppOptions)
- `test/`: Test cases (87 tests total, all passing)
- `README.md`: Complete usage guide, configuration examples, and property documentation
- `.github/copilot-instructions.md`: This file - AI agent guidance

## Recent Changes - Legacy GCM Removal & Firebase Admin SDK Alignment

### What Changed

**Removed:**
- `buildGcmMessage()` function (wrapper pattern with toJson() method)
- `buildGcmNotification()` function
- Post-processing delete statements for undefined properties
- References to legacy `node-gcm` library

**Added:**
- `buildAndroidMessage()` - Direct Firebase Admin SDK compatible builder
- `buildAndroidNotification()` - Proper Android notification interface
- 15+ new Android notification properties (ticker, sticky, visibility, LED settings, etc.)
- Support for all 9 Firebase Admin SDK AppOptions (projectId, databaseURL, storageBucket, etc.)
- Proxy support at both SDK and notification levels
- Comprehensive test coverage (10 FCM-specific tests)

### Migration Pattern

**Before (Legacy GCM):**
```javascript
const message = buildGcmMessage(data).toJson();
// Result: wrapper object with toJson() method
```

**After (Firebase Admin SDK):**
```javascript
const message = buildAndroidMessage(data);
// Result: plain object directly compatible with firebase-admin
```

### Property Naming

All properties now use **camelCase** (Firebase Admin SDK standard):
- `android_channel_id` → `channelId`
- `title_loc_key` → `titleLocKey`
- `body_loc_key` → `bodyLocKey`
- `body_loc_args` → `bodyLocArgs`
- etc.

### Testing

New test suite added with 7 test cases:
- `should accept projectId in settings`
- `should accept databaseURL in settings`
- `should accept storageBucket in settings`
- `should accept serviceAccountId in settings`
- `should accept databaseAuthVariableOverride in settings`
- `should accept multiple Firebase AppOptions together`
- Plus 3 existing proxy tests (httpAgent, httpsAgent, both)

All 87 tests passing, zero regressions.

## Example Usage

See `README.md` for complete examples including:
- FCM settings configuration with all AppOptions
- Notification data with all supported properties
- Network proxy agent setup
- Notification-level proxy configuration

## Future Considerations

- Monitor Firebase Admin SDK updates for new AndroidMessage properties
- Consider typed interfaces for better TypeScript support
- Track Android notification API changes and feature additions
- Evaluate performance of dynamic property filtering approach

---

For unclear or incomplete sections, please provide feedback or specify which workflows, patterns, or integrations need further documentation.
