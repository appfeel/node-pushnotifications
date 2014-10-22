Node Push Notify
========

A Node.js module for interfacing with Apple Push Notification, Google Cloud Messaging, Microsoft Push Notification and Amazon Device Messaging services.

## Installation 
$ npm install node-pushnotifications

#Features
<ul>
<li>Powerful and intuitive.</li>
<li>Multi platform push sends.</li>
<li>Automatically detects destination device type.</li>
<li>Unified error handling.</li>
</ul>

## Usage 
Import and setup push module:
```
var settings = {
  gcm: {
    id: null, // PUT YOUR GCM SERVER API KEY,
    options: {},
    msgcnt: 1,
    dataDefaults: {
      delayWhileIdle: false,
      timeToLive: 4 * 7 * 24 * 3600, // 4 weeks
      retries: 4
    }
  },
  apn: {
    gateway: 'gateway.sandbox.push.apple.com',
    badge: 1,
    defaultData: {
      expiry: 4 * 7 * 24 * 3600, // 4 weeks
      sound: 'ping.aiff'
    }
  },
  adm: {
    client_id: null, // PUT YOUR ADM CLIENT ID,
    client_secret: null, // PUT YOUR ADM CLIENT SECRET,
    expiresAfter: 4 * 7 * 24 * 3600, // 4 weeks
  }
};
var push = new requiere('node-pushnotifications')(settings);
```

Define destination device ID. You can send to multiple devices, independently of platform, creating an array with different destination device IDs.
```
// Single destination
deviceIds = 'INSERT_YOUR_DEVICE_ID';

// Multiple destinations
deviceIds = [];
deviceIds.push('INSERT_YOUR_DEVICE_ID');
deviceIds.push('INSERT_OTHER_DEVICE_ID');
```

Next, create a JSON object witch MUST contain, at least, a title and message and send it to server. 
```
data = {title: 'New push notification' , message: 'Powered by AppFeel', otherfields: 'optionally add more data');
push.sendPush(deviceIds, data, function (result) {
	console.log(result);
});
```
Result will contain 'true' or 'an error description'.


##Resources

- [Node Push Notify from alexlds](https://github.com/alexlds/node-push-notify)
- [Google Cloud Messaging setup guide](http://aerogear.org/docs/guides/aerogear-push-android/google-setup/)
- [Apple Push Notification setup guide Part 1](http://aerogear.org/docs/guides/aerogear-push-ios/app-id-ssl-certificate-apns/)
- [Apple Push Notification setup guide Part 2](https://github.com/argon/node-apn/wiki/Preparing-Certificates)

