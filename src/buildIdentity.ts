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

export const QA_BUILD_METADATA: QaBuildMetadata = {
  commit: '8fc7a4d',
  branch: 'peter-dev',
  purpose: 'accepted/ready cancellation QA',
  label: 'QA BUILD · 8fc7a4d · peter-dev · accepted/ready cancellation QA',
};

export const PRODUCTION_BUILD_METADATA: QaBuildMetadata | null = null;
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
