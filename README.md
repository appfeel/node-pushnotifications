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
First of all:
```
IOS: replace cert.txt and key.txt files on push folder with your cert.pem and key.pem. 
ANDROID: Add to SETTINGS.js your API SERVER KEY  on push folder.
```
Import push module:
```
var push = requiere('node-pushnotifications');
```

Define destination device ID. You can send to multiple devices, independently of platform, creating an array with different destination device IDs.
```
// Single destination
pushId = 'INSERT_YOUR_DEVICE_ID';

// Multiple destinations
pushId = [];
pushId.push('INSERT_YOUR_DEVICE_ID');
pushId.push('INSERT_OTHER_DEVICE_ID');
```

Next, create a JSON object witch MUST contain, at least, a title and message and send it to server. 
```
data = {title: 'My First Push' , message: 'Powered by AppFeel', otherfields: 'add more fields if you want');
push.sendPush(pushId, data, function (result) {
	console.log(result);
});
```
Result will contain 'true' or 'an error description'.


##Resources
<ul>
<li> <a href="http://aerogear.org/docs/guides/aerogear-push-android/google-setup/"> Google Cloud Messaging setup guide</a> </li>
<li> <a href="http://aerogear.org/docs/guides/aerogear-push-ios/app-id-ssl-certificate-apns/"> Apple Push Notification setup guide Part 1</a> </li>
<li> <a href="https://github.com/argon/node-apn/wiki/Preparing-Certificates"> Apple Push Notification setup guide Part 2</a> </li>
</ul>
