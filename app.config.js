const { execFileSync } = require('node:child_process');

const DEFAULT_API_BASE_URL = 'https://rendezvous-livewalk-api.webpeter.com';
const QA_BUILD_PURPOSE = 'LW-31 Android source recovery QA';

function cleanUrl(value) {
  return value.replace(/\/+$/, '');
}

function readGit(args) {
  try {
    return execFileSync('git', args, { cwd: __dirname, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function readSourceIdentity() {
  return {
    commit: readGit(['rev-parse', '--short=7', 'HEAD']),
    branch: readGit(['branch', '--show-current']),
  };
}

function resolveQaBuildMetadata(sourceIdentity = readSourceIdentity()) {
  if (sourceIdentity.branch === 'main') return undefined;
  if (sourceIdentity.branch !== 'peter-dev' || !/^[0-9a-f]{7}$/.test(sourceIdentity.commit)) {
    throw new Error('Guide QA config requires a peter-dev Git checkout with .git metadata.');
  }

  return {
    commit: sourceIdentity.commit,
    branch: sourceIdentity.branch,
    purpose: QA_BUILD_PURPOSE,
    label: `QA BUILD · ${sourceIdentity.commit} · ${sourceIdentity.branch} · ${QA_BUILD_PURPOSE}`,
  };
}

function createAppConfig(config, env = process.env, sourceIdentity = readSourceIdentity()) {
  const apiBaseUrl = cleanUrl(
    env.LIVEWALK_API_BASE_URL ?? env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  );
  const mapboxTokenWeb = env.MAPBOX_TOKEN_WEB?.trim();
  const mapboxTokenMobile = env.MAPBOX_TOKEN_MOBILE?.trim();
  const qaBuild = resolveQaBuildMetadata(sourceIdentity);

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
    plugins: ['expo-dev-client', '@livekit/react-native-expo-plugin', '@config-plugins/react-native-webrtc'],
    newArchEnabled: false,
    android: {
      package: 'com.livewalk.guide',
      permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION', 'CAMERA', 'RECORD_AUDIO'],
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: 'LiveWalk needs camera access so guides can broadcast live video to their traveler.',
        NSMicrophoneUsageDescription: 'LiveWalk needs microphone access so guides can broadcast live audio to their traveler.',
      },
    },
    extra: {
      ...config.extra,
      apiBaseUrl,
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
appConfig.readSourceIdentity = readSourceIdentity;
appConfig.resolveQaBuildMetadata = resolveQaBuildMetadata;

module.exports = appConfig;
