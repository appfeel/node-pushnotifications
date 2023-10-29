import * as webPush from 'web-push';

import sendGCM from './sendGCM';
import APNSender from './sendAPN';
import sendADM from './sendADM';
import sendWNS from './sendWNS';
import sendWebPush from './sendWeb';
import { DEFAULT_SETTINGS } from './constants';
import { DefaultSettings, RegId, RegIdType } from './types';
import { PushMethod } from './typesInternal';

export default class PN {
  private settings: DefaultSettings;

  private apn: APNSender;

  constructor(options: DefaultSettings) {
    this.setOptions(options);
  }

  setOptions(opts: DefaultSettings): void {
    this.settings = { ...DEFAULT_SETTINGS, ...opts };
    if (this.settings.apn) {
      if (this.apn) {
        this.apn.shutdown();
      }
      this.apn = new APNSender(this.settings.apn);
    }
  }

  getOptions() {
    return this.settings;
  }

  async sendWith(
    method: any,
    regIds: any[],
    data: any,
    cb?: (err: any, results?: any) => void
  ): Promise<any> {
    try {
      const results = await method(regIds, data, this.settings);
      (cb || ((noop: any) => noop))(null, results);
      return results;
    } catch (error) {
      (cb || ((noop: any) => noop))(error);
      return Promise.reject(error);
    }
  }

  getPushMethodByRegId(regId: RegId): PushMethod {
    let regIdStr = '';

    if (typeof regId === 'object') {
      // regId is an object with id and type => FCM if always FCM or given type
      // This is the new definition for android and ios regIds for node-pushnotifications
      // This has been implemented like this because Apple does not ensure the length of its regId
      if (regId.id && regId.type) {
        return {
          regId: regId.id,
          type: this.settings.isAlwaysUseFCM ? RegIdType.gcm : regId.type,
        };
      }

      // regId should be a PushSubscription object => web notifications
      // PushSubscription: { endpoint, expirationTime, options, subscriptionId }
      if (!regId.id) {
        return { regId, type: RegIdType.web };
      }

      regIdStr = regId.id;
    } else {
      regIdStr = regId;
    }

    // TODO: deprecated, remove all cases below in v3.0 ??
    // and review test cases
    if (this.settings.isAlwaysUseFCM) {
      return { regId: regIdStr, type: RegIdType.gcm };
    }

    if (regIdStr.substring(0, 4) === 'http') {
      return { regId: regIdStr, type: RegIdType.wns };
    }

    if (/^(amzn[0-9]*.adm)/i.test(regIdStr)) {
      return { regId: regIdStr, type: RegIdType.adm };
    }

    if (
      (regIdStr.length === 64 || regIdStr.length === 160) &&
      /^[a-fA-F0-9]+$/.test(regIdStr)
    ) {
      return { regId: regIdStr, type: RegIdType.apn };
    }

    if (regIdStr.length > 64) {
      return { regId: regIdStr, type: RegIdType.gcm };
    }

    return { regId: regIdStr, type: RegIdType.unknown };
  }

  async send(
    _regIds: RegId | RegId[],
    data: any,
    callback?: (err: any, results?: any) => void
  ): Promise<any[]> {
    const promises: Promise<any>[] = [];
    const regIdsGCM: string[] = [];
    const regIdsAPN: string[] = [];
    const regIdsWNS: string[] = [];
    const regIdsADM: string[] = [];
    const regIdsWebPush: (string | webPush.PushSubscription)[] = [];
    const regIdsUnk: string[] = [];
    const regIds: RegId[] = Array.isArray(_regIds || [])
      ? (_regIds as RegId[]) || []
      : [_regIds as RegId];

    // Classify each pushId for corresponding device
    regIds.forEach((regIdOriginal: any) => {
      const { regId, type } = this.getPushMethodByRegId(regIdOriginal);

      switch (type) {
        case RegIdType.adm:
          regIdsADM.push(regId as string);
          break;
        case RegIdType.apn:
          regIdsAPN.push(regId as string);
          break;
        case RegIdType.gcm:
          regIdsGCM.push(regId as string);
          break;
        case RegIdType.web:
          regIdsWebPush.push(regId as string);
          break;
        case RegIdType.wns:
          regIdsWNS.push(regId as string);
          break;
        case RegIdType.unknown:
        default:
          regIdsUnk.push(regId as string);
          break;
      }
    });

    try {
      // Android GCM
      if (regIdsGCM.length > 0) {
        promises.push(this.sendWith(sendGCM, regIdsGCM, data));
      }

      // iOS APN
      if (regIdsAPN.length > 0) {
        promises.push(
          this.sendWith(this.apn.sendAPN.bind(this.apn), regIdsAPN, data)
        );
      }

      // Microsoft WNS
      if (regIdsWNS.length > 0) {
        promises.push(this.sendWith(sendWNS, regIdsWNS, data));
      }

      // Amazon ADM
      if (regIdsADM.length > 0) {
        promises.push(this.sendWith(sendADM, regIdsADM, data));
      }

      // Web Push
      if (regIdsWebPush.length > 0) {
        promises.push(this.sendWith(sendWebPush, regIdsWebPush, data));
      }
    } catch (err) {
      promises.push(Promise.reject(err));
    }

    // Unknown
    if (regIdsUnk.length > 0) {
      const results: any = {
        method: 'unknown',
        success: 0,
        failure: regIdsUnk.length,
        message: [],
      };
      regIdsUnk.forEach((regId) => {
        results.message.push({
          regId,
          error: new Error('Unknown registration id'),
        });
      });
      promises.push(Promise.resolve(results));
    }

    // No regIds detected
    if (promises.length === 0) {
      promises.push(
        Promise.resolve({
          method: 'none',
          success: 0,
          failure: 0,
          message: [],
        })
      );
    }

    try {
      const results = await Promise.all(promises);
      const cb = callback || ((noop: any) => noop);
      cb(null, results);
      return results;
    } catch (err) {
      const cb = callback || ((noop: any) => noop);
      cb(err);
      return Promise.reject(err);
    }
  }
}
