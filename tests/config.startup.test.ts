import { afterEach, describe, expect, it, vi } from 'vitest';

type RuntimeExtra = {
  apiBaseUrl: string;
  mapboxTokenWeb?: string;
  mapboxTokenMobile?: string;
};

async function loadRuntimeConfig(platform: 'android' | 'web', extra: RuntimeExtra) {
  vi.resetModules();
  vi.doMock('expo-constants', () => ({ default: { expoConfig: { extra } } }));
  vi.doMock('react-native', () => ({ Platform: { OS: platform } }));
  return import('../src/config');
}

afterEach(() => {
  vi.doUnmock('expo-constants');
  vi.doUnmock('react-native');
  vi.resetModules();
});

describe('Guide startup runtime config', () => {
  it('imports on Android when the build only provides the Android Mapbox token', async () => {
    const config = await loadRuntimeConfig('android', {
      apiBaseUrl: 'https://guide.example',
      mapboxTokenMobile: 'android-token',
    });

    expect(config.API_BASE).toBe('https://guide.example');
    expect(config.getMapboxTokenForCurrentPlatform()).toBe('android-token');
  });

  it('imports on web when the build only provides the web Mapbox token', async () => {
    const config = await loadRuntimeConfig('web', {
      apiBaseUrl: 'https://guide.example',
      mapboxTokenWeb: 'web-token',
    });

    expect(config.API_BASE).toBe('https://guide.example');
    expect(config.getMapboxTokenForCurrentPlatform()).toBe('web-token');
  });

  it('defers a missing current-platform Mapbox error until Mapbox is used', async () => {
    const config = await loadRuntimeConfig('android', {
      apiBaseUrl: 'https://guide.example',
    });

    expect(config.API_BASE).toBe('https://guide.example');
    expect(() => config.getMapboxTokenForCurrentPlatform()).toThrow('LiveWalk Mapbox mobile token is missing from Expo config.');
  });
});
