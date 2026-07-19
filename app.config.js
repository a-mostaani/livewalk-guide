const DEFAULT_API_BASE_URL = 'https://rendezvous-livewalk-api.webpeter.com';

function cleanUrl(value) {
  return value.replace(/\/+$/, '');
}

function createAppConfig(config, env = process.env) {
  const apiBaseUrl = cleanUrl(
    env.LIVEWALK_API_BASE_URL ?? env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  );
  const livekitWsUrl = cleanUrl(env.LIVEKIT_WS_URL?.trim() ?? '');
  const mapboxTokenWeb = env.MAPBOX_TOKEN_WEB?.trim();
  const mapboxTokenMobile = env.MAPBOX_TOKEN_MOBILE?.trim();

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
}

function appConfig({ config }) {
  return createAppConfig(config);
}

appConfig.createAppConfig = createAppConfig;

module.exports = appConfig;
