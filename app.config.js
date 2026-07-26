const { execFileSync } = require('node:child_process');

const DEFAULT_API_BASE_URL = 'https://rendezvous-livewalk-api.webpeter.com';
const COMMITTED_PUBLIC_MOBILE_MAPBOX_TOKEN = 'pk.eyJ1IjoiYS1tb3N0IiwiYSI6ImNtcmh0M2s2ODFmbHAyeHF6N3k2NjNzdHAifQ.fC7tosE6isRH40dtUXq2Vw';
const QA_PURPOSE = 'LiveKit reconnect hardening';

function cleanUrl(value) {
  return value.replace(/\/+$/, '');
}

function isPublicMapboxToken(value) {
  return value.length >= 20 && /^pk\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value);
}

function resolveMobileMapboxToken(env) {
  const override = env.MAPBOX_TOKEN_MOBILE?.trim() ?? '';
  const fallback = COMMITTED_PUBLIC_MOBILE_MAPBOX_TOKEN.trim();

  if (isPublicMapboxToken(override)) {
    return override;
  }

  if (isPublicMapboxToken(fallback)) {
    return fallback;
  }

  return '';
}

function runGit(args, cwd) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function cleanBranch(value) {
  return value
    .trim()
    .replace(/^refs\/heads\//, '')
    .replace(/^remotes\/origin\//, '')
    .replace(/^origin\//, '')
    .replace(/[~^].*$/, '');
}

function resolveQaBuildMetadata(env = process.env, cwd = process.cwd(), git = runGit) {
  const commit = (
    env.LIVEWALK_BUILD_COMMIT ||
    env.EAS_BUILD_GIT_COMMIT_HASH ||
    git(['rev-parse', '--short=7', 'HEAD'], cwd)
  ).trim().slice(0, 7);

  let branch = cleanBranch(
    env.LIVEWALK_BUILD_BRANCH ||
    env.EAS_BUILD_GIT_BRANCH ||
    env.GIT_BRANCH ||
    git(['branch', '--show-current'], cwd),
  );

  if (!branch) {
    const containingBranches = git(
      ['branch', '-a', '--contains', 'HEAD', '--format=%(refname:short)'],
      cwd,
    )
      .split('\n')
      .map(cleanBranch)
      .filter(Boolean);
    branch =
      containingBranches.find((candidate) => candidate === 'peter-dev') ||
      containingBranches.find((candidate) => candidate !== 'main' && candidate !== 'master') ||
      containingBranches[0] ||
      'detached';
  }

  if (!commit || branch === 'main' || branch === 'master') return null;

  return {
    commit,
    branch,
    purpose: QA_PURPOSE,
    label: `QA BUILD · ${commit} · ${branch} · ${QA_PURPOSE}`,
  };
}

function createAppConfig(config, env = process.env, qaBuild = resolveQaBuildMetadata(env)) {
  const apiBaseUrl = cleanUrl(
    env.LIVEWALK_API_BASE_URL ?? env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  );
  const livekitWsUrl = cleanUrl(env.LIVEKIT_WS_URL?.trim() ?? '');
  const mapboxTokenWeb = env.MAPBOX_TOKEN_WEB?.trim();
  const mapboxTokenMobile = resolveMobileMapboxToken(env);

  const extra = {
    ...config.extra,
    apiBaseUrl,
    livekitWsUrl,
    mapboxTokenWeb,
    mapboxTokenMobile,
    eas: {
      projectId: '5b01cdcf-9979-4dda-bc0a-899ac4baf643',
    },
  };
  if (qaBuild) extra.qaBuild = qaBuild;
  else delete extra.qaBuild;

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
        NSLocationWhenInUseUsageDescription: 'LiveWalk needs your location while guiding so the traveler can see your live position on the route.',
      },
    },
    extra,
  };
}

function appConfig({ config }) {
  return createAppConfig(config);
}

appConfig.createAppConfig = createAppConfig;
appConfig.resolveQaBuildMetadata = resolveQaBuildMetadata;

module.exports = appConfig;
