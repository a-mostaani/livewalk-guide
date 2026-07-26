import Constants from 'expo-constants';
import { parseQaBuildMetadata } from './buildIdentityCore';

export type QaBuildMetadata = {
  commit: string;
  branch: string;
  purpose: string;
  label: string;
};

export type QaBuildIdentityDisplay = {
  testID: 'qa-build-badge';
  labelTestID: 'qa-build-badge-label';
  accessibilityLabel: string;
  label: string;
};

export const PRODUCTION_BUILD_METADATA: QaBuildMetadata | null = null;
export const QA_BUILD_METADATA = parseQaBuildMetadata(Constants.expoConfig?.extra?.qaBuild);
export const ACTIVE_BUILD_METADATA = QA_BUILD_METADATA;
export const QA_BUILD_LABEL = ACTIVE_BUILD_METADATA?.label ?? null;

export { parseQaBuildMetadata };

export function renderQaBuildIdentity(metadata: QaBuildMetadata | null): QaBuildIdentityDisplay | null {
  if (!metadata) return null;

  return {
    testID: 'qa-build-badge',
    labelTestID: 'qa-build-badge-label',
    accessibilityLabel: metadata.label,
    label: metadata.label,
  };
}
