import * as nodeApn from '@parse/node-apn';
import * as webPush from 'web-push';

export interface GcmSettings {
  id?: string;
  phonegap?: boolean;
}

export interface ApnSettings extends nodeApn.ProviderOptions {
  // voip: boolean; // VOIP is in Notification type, not in settings
  address?: string;
  port?: number;
  rejectUnauthorized?: boolean;
  connectionRetryLimit?: number;
  cacheLength?: number;
  connectionTimeout?: number;
  autoAdjustCache?: boolean;
  maxConnections?: number;
  minConnections?: number;
  connectTimeout?: number;
  buffersNotifications?: boolean;
  fastMode?: boolean;
  disableNagle?: boolean;
  disableEPIPEFix?: boolean;
}

export interface AdmSettings {
  client_id?: string;
  client_secret?: string;
}

export interface WnsSettings {
  client_id?: string;
  client_secret?: string;
  accessToken?: string;
  headers?: any;
  notificationMethod: string;
  launch?: any;
  duration?: any;
}

export interface WebSettings {
  vapidDetails: {
    subject: string;
    publicKey: string;
    privateKey: string;
  };
  gcmAPIKey?: string;
}

export interface DefaultSettings {
  /** Google Cloud Messaging settings */
  gcm?: GcmSettings;
  /** Apple Push Notifications settings */
  apn?: ApnSettings;
  /** Amazon Device Messaging settings */
  adm?: AdmSettings;
  /** Web Push notifications settings */
  wns?: WnsSettings;
  /** Microsoft Push Notification Service settings */
  web?: webPush.RequestOptions;
  /** When true FCM will be used in any case except if regId is an object without type or id, in wich case WEB will be used */
  isAlwaysUseFCM?: boolean;
}

export const APN = 'apn';
export const GCM = 'gcm';
export const ADM = 'adm';
export const WNS = 'wns';
export const WEB = 'webPush';
export const UNKNOWN = 'unknown';

export enum RegIdType {
  apn = APN,
  gcm = GCM,
  adm = ADM,
  wns = WNS,
  web = WEB,
  unknown = UNKNOWN,
}

/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/PushSubscription) */
export interface IPushSubscription {
  id?: never;
  type?: never;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/PushSubscription/endpoint) */
  endpoint: string;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/PushSubscription/expirationTime) */
  expirationTime?: EpochTimeStamp | null;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/PushSubscription/options) */
  options?: PushSubscriptionOptions | null;
  /** @deprecated [MDN Reference](https://developer.mozilla.org/docs/Web/API/PushSubscription/options) */
  subscriptionId?: string;
}

export interface RegIdNodePushNotifications {
  id: string;
  type: RegIdType;
  endpoint?: never;
  expirationTime?: never;
  options?: never;
  subscriptionId?: never;
}

export type RegId = string | RegIdNodePushNotifications | IPushSubscription;

export interface Data {
  /** REQUIRED */
  title: string;
  /** REQUIRED */
  body: string;
  custom?: { [key: string]: string | number } | string;
  /**
   * gcm, apn. Supported values are 'high' or 'normal' (gcm). Will be translated to 10 and 5 for apn. Defaults
   * to 'high'
   */
  priority?: string;
  /** gcm for android, used as collapseId in apn */
  collapseKey?: string;
  /** gcm for android */
  contentAvailable?: boolean | string;
  /** gcm for android */
  delayWhileIdle?: boolean;
  /** gcm for android */
  restrictedPackageName?: string;
  /** gcm for android */
  dryRun?: boolean;
  /** gcm for android */
  icon?: string;
  /** gcm for android */
  tag?: string;
  /** gcm for android */
  color?: string;
  /** gcm for android. In ios, category will be used if not supplied */
  clickAction?: string;
  /** gcm, apn */
  locKey?: string;
  /** gcm, apn */
  bodyLocArgs?: string;
  /** gcm, apn */
  titleLocKey?: string;
  /** gcm, apn */
  titleLocArgs?: string;
  /** gcm, apn */
  retries?: number;
  // TODO: review
  /** gcm recipients */
  recipients?: any[];
  /** gcm silent notification */
  silent?: boolean;
  /** gcm Android: image */
  image?: any;
  /** gcm Android: picture */
  picture?: any;
  /** gcm Android: style */
  style?: any;
  /** gcm Android, iOS: locArgs */
  locArgs?: any;
  /** gcm Android: android_channel_id */
  android_channel_id?: any;
  /** gcm Android: notificationCount if not present will be taken from badge */
  notificationCount?: any;

  /** apn threadId */
  threadId?: any;
  /** apn pushType */
  pushType?: any;

  /** apn */
  encoding?: string;
  /** gcm for ios, apn */
  badge?: number;
  /** gcm, apn */
  sound?: string;
  /** apn, will take precedence over title and body. It is also accepted a text message in alert */
  alert?: any | string;
  /** apn and gcm for ios */
  launchImage?: string;
  /** apn and gcm for ios */
  action?: string;
  /** apn and gcm for ios */
  topic?: string;
  /** apn and gcm for ios */
  category?: string;
  /** apn and gcm for ios */
  mdm?: string;
  /** apn and gcm for ios */
  urlArgs?: string;
  /** apn and gcm for ios */
  truncateAtWordEnd?: boolean;
  /** apn */
  mutableContent?: number;
  /** seconds */
  expiry?: number;
  /** if both expiry and timeToLive are given, expiry will take precedency */
  timeToLive?: number;
  /** wns */
  headers?: string[];
  /** wns */
  launch?: string;
  /** wns */
  duration?: string;
  /** ADM */
  consolidationKey?: string;
}
