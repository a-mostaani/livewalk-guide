import Constants from 'expo-constants';

export type QaBuildMetadata = {
  commit: string;
  branch: string;
  purpose: string;
  label: string;
};

function getQaBuildMetadata(value: unknown): QaBuildMetadata | null {
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

export const QA_BUILD_METADATA = getQaBuildMetadata(Constants.expoConfig?.extra?.qaBuild);
export const QA_BUILD_LABEL = QA_BUILD_METADATA?.label ?? null;
