import type { ConfigContext, ExpoConfig } from 'expo/config';

declare const process: {
  env: Record<string, string | undefined>;
};

const DEFAULT_API_BASE_URL = 'https://rendezvous-livewalk-api.webpeter.com';

function cleanUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const apiBaseUrl = cleanUrl(
    process.env.LIVEWALK_API_BASE_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  );

  return {
    ...config,
    name: 'LiveWalk Guide',
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
    },
    ios: {
      supportsTablet: true,
    },
    extra: {
      ...config.extra,
      apiBaseUrl,
    },
  };
};
