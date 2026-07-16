const DEFAULT_API_BASE_URL = 'https://rendezvous-livewalk-api.webpeter.com';

function cleanUrl(value) {
  return value.replace(/\/+$/, '');
}

module.exports = ({ config }) => {
  const apiBaseUrl = cleanUrl(
    process.env.LIVEWALK_API_BASE_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  );
  const livekitWsUrl = cleanUrl(process.env.LIVEKIT_WS_URL?.trim() ?? '');
  const mapboxTokenWeb = process.env.MAPBOX_TOKEN_WEB?.trim();
  const mapboxTokenMobile = process.env.MAPBOX_TOKEN_MOBILE?.trim();

  return {
    ...config,
    name: 'LivelyWalk Guide',
    slug: 'livewalk-guide',
    version: '0.1.0',
    orientation: 'portrait',
    scheme: 'livewalk-guide',
    userInterfaceStyle: 'light',
    splash: {
      resizeMode: 'contain',
      backgroundColor: '#FBF7EF',
    },
    assetBundlePatterns: ['**/*'],
    plugins: ['expo-dev-client'],
    newArchEnabled: false,
    android: {
      package: 'com.livewalk.guide',
      permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
    },
    ios: {
      supportsTablet: true,
    },
    extra: {
      ...config.extra,
      apiBaseUrl,
      livekitWsUrl,
      mapboxTokenWeb,
      mapboxTokenMobile,
    },
  };
};
