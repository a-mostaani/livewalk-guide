import Constants from 'expo-constants';
import { Platform } from 'react-native';

type LiveWalkExtra = {
  apiBaseUrl?: string;
  mapboxTokenWeb?: string;
  mapboxTokenMobile?: string;
};

function getLiveWalkExtra(): LiveWalkExtra {
  return (Constants.expoConfig?.extra ?? {}) as LiveWalkExtra;
}

function cleanApiBaseUrl(value: string | undefined): string {
  const cleaned = value?.trim().replace(/\/+$/, '');
  if (!cleaned) throw new Error('LiveWalk API base URL is missing from Expo config.');
  return cleaned;
}

function cleanMapboxToken(value: string | undefined, target: 'web' | 'mobile'): string {
  const cleaned = value?.trim();
  if (!cleaned) throw new Error(`LiveWalk Mapbox ${target} token is missing from Expo config.`);
  return cleaned;
}

const extra = getLiveWalkExtra();

export const API_BASE = cleanApiBaseUrl(extra.apiBaseUrl);
export function getMapboxTokenForCurrentPlatform(): string {
  return Platform.OS === 'web'
    ? cleanMapboxToken(extra.mapboxTokenWeb, 'web')
    : cleanMapboxToken(extra.mapboxTokenMobile, 'mobile');
}
