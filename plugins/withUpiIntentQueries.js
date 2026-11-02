const { withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

function withUpiIntentQueries(config) {
  config = withAndroidManifest(config, mod => {
    const manifest = mod.modResults.manifest;
    manifest.queries ||= [];
    const alreadyAdded = manifest.queries.some(query =>
      query.intent?.some(intent => intent.data?.some(data => data.$?.['android:scheme'] === 'upi')),
    );
    if (!alreadyAdded) {
      manifest.queries.push({
        intent: [{
          action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
          data: [{ $: { 'android:scheme': 'upi' } }],
        }],
      });
    }
    return mod;
  });

  return withInfoPlist(config, mod => {
    const schemes = mod.modResults.LSApplicationQueriesSchemes || [];
    if (!schemes.includes('upi')) schemes.push('upi');
    mod.modResults.LSApplicationQueriesSchemes = schemes;
    return mod;
  });
}

module.exports = withUpiIntentQueries;
