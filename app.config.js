const DEFAULT_API_BASE_URL = 'https://rendezvous-livewalk-api.webpeter.com';
const QA_BUILD_CHANNEL = 'qa';

function cleanUrl(value) {
  return value.replace(/\/+$/, '');
}

function resolveQaBuildMetadata(env = process.env) {
  if (env.LIVEWALK_BUILD_CHANNEL?.trim() !== QA_BUILD_CHANNEL) return undefined;

  const commit = env.LIVEWALK_BUILD_COMMIT?.trim().slice(0, 7);
  const branch = env.LIVEWALK_BUILD_BRANCH?.trim();
  const purpose = env.LIVEWALK_BUILD_PURPOSE?.trim();

  if (!commit || !branch || !purpose) return undefined;

  return {
    commit,
    branch,
    purpose,
    label: `QA BUILD · ${commit} · ${branch} · ${purpose}`,
  };
}

function createAppConfig(config, env = process.env) {
  const apiBaseUrl = cleanUrl(
    env.LIVEWALK_API_BASE_URL ?? env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  );
  const livekitWsUrl = cleanUrl(env.LIVEKIT_WS_URL?.trim() ?? '');
  const mapboxTokenWeb = env.MAPBOX_TOKEN_WEB?.trim();
  const mapboxTokenMobile = env.MAPBOX_TOKEN_MOBILE?.trim();
  const qaBuild = resolveQaBuildMetadata(env);

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
      ...(qaBuild ? { qaBuild } : {}),
    },
  };
}

function appConfig({ config }) {
  return createAppConfig(config);
}

appConfig.createAppConfig = createAppConfig;
appConfig.resolveQaBuildMetadata = resolveQaBuildMetadata;

module.exports = appConfig;
