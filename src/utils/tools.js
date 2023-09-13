const R = require('ramda');
const { DEFAULT_TTL, GCM_MAX_TTL } = require('../constants');

const ttlFromExpiry = R.compose(
  R.min(GCM_MAX_TTL),
  R.max(0),
  (expiry) => expiry - Math.floor(Date.now() / 1000)
);

const extractTimeToLive = R.cond([
  [R.propIs(Number, 'expiry'), ({ expiry }) => ttlFromExpiry(expiry)],
  [R.propIs(Number, 'timeToLive'), R.prop('timeToLive')],
  [R.T, R.always(DEFAULT_TTL)],
]);

const expiryFromTtl = (ttl) => ttl + Math.floor(Date.now() / 1000);

const extractExpiry = R.cond([
  [R.propIs(Number, 'expiry'), R.prop('expiry')],
  [
    R.propIs(Number, 'timeToLive'),
    ({ timeToLive }) => expiryFromTtl(timeToLive),
  ],
  [R.T, () => expiryFromTtl(DEFAULT_TTL)],
]);

const getPropValueOrUndefinedIfIsSilent = (propName, data) =>
  R.ifElse(
    R.propEq('silent', true),
    R.always(undefined),
    R.prop(propName)
  )(data);

const toJSONorUndefined = R.tryCatch(JSON.parse, R.always(undefined));

const alertLocArgsToJSON = R.evolve({
  alert: {
    'title-loc-args': toJSONorUndefined,
    'loc-args': toJSONorUndefined,
  },
});

const getDefaultAlert = (data) => ({
  title: data.title,
  body: data.body,
  'title-loc-key': data.titleLocKey,
  'title-loc-args': data.titleLocArgs,
  'loc-key': data.locKey,
  'loc-args': data.locArgs || data.bodyLocArgs,
  'launch-image': data.launchImage,
  action: data.action,
});

const alertOrDefault = (data) =>
  R.when(
    R.propSatisfies(R.isNil, 'alert'),
    R.assoc('alert', getDefaultAlert(data))
  );

const getParsedAlertOrDefault = (data) =>
  R.pipe(alertOrDefault(data), alertLocArgsToJSON)(data);

const pathIsString = R.pathSatisfies(R.is(String));

const containsValidRecipients = R.either(
  pathIsString(['recipients', 'to']),
  pathIsString(['recipients', 'condition'])
);

const propValueToSingletonArray = (propName) =>
  R.compose(R.of, R.prop(propName));

module.exports = {
  ttlAndroid: extractTimeToLive,
  expiryApns: extractExpiry,
  getPropValueOrUndefinedIfIsSilent,
  getParsedAlertOrDefault,
  containsValidRecipients,
  propValueToSingletonArray,
};
