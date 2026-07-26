export type ParsedQaBuildMetadata = {
  commit: string;
  branch: string;
  purpose: string;
  label: string;
};

export function parseQaBuildMetadata(value: unknown): ParsedQaBuildMetadata | null {
  if (!value || typeof value !== 'object') return null;
  const metadata = value as Partial<ParsedQaBuildMetadata>;
  if (
    typeof metadata.commit !== 'string' ||
    typeof metadata.branch !== 'string' ||
    typeof metadata.purpose !== 'string' ||
    typeof metadata.label !== 'string'
  ) {
    return null;
  }
  return {
    commit: metadata.commit,
    branch: metadata.branch,
    purpose: metadata.purpose,
    label: metadata.label,
  };
}
