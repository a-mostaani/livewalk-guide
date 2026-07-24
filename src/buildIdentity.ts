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
  commit: 'c204302',
  branch: 'peter-dev',
  purpose: 'launch + accepted/ready cancellation QA',
  label: 'QA BUILD · c204302 · peter-dev · launch + accepted/ready cancellation QA',
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
