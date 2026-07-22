import Constants from 'expo-constants';

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

export function parseQaBuildMetadata(value: unknown): QaBuildMetadata | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<QaBuildMetadata>;
  if (!candidate.commit || !candidate.branch || !candidate.purpose || !candidate.label) return null;
  return {
    commit: candidate.commit,
    branch: candidate.branch,
    purpose: candidate.purpose,
    label: candidate.label,
  };
}

export const QA_BUILD_METADATA = parseQaBuildMetadata(Constants.expoConfig?.extra?.qaBuild);
export const ACTIVE_BUILD_METADATA: QaBuildMetadata | null = QA_BUILD_METADATA;
export const QA_BUILD_LABEL = ACTIVE_BUILD_METADATA?.label ?? null;

export function renderQaBuildIdentity(metadata: QaBuildMetadata | null): QaBuildIdentityDisplay | null {
  if (!metadata) return null;

  return {
    testID: 'qa-build-badge',
    labelTestID: 'qa-build-badge-label',
    accessibilityLabel: metadata.label,
    label: metadata.label,
  };
}
