// TICKET-16: the build label shown at the top of every test build. The values
// come from the build itself (see app.config.js); nothing here is typed by
// hand, so the label cannot go stale. This file stays free of environment and
// Expo imports so the rules can be tested directly.

export type BuildIdentityInput = {
  commit?: string;
  branch?: string;
  profile?: string;
  builtAt?: string;
} | null | undefined;

export type QaBuildIdentityDisplay = {
  testID: 'qa-build-badge';
  labelTestID: 'qa-build-badge-label';
  accessibilityLabel: string;
  label: string;
};

function shortCommit(commit: string | undefined) {
  const value = (commit ?? '').trim();
  return /^[0-9a-f]{7,40}$/i.test(value) ? value.slice(0, 7) : 'UNKNOWN COMMIT';
}

function buildTime(builtAt: string | undefined) {
  const time = Date.parse(builtAt ?? '');
  if (Number.isNaN(time)) return 'UNKNOWN DATE';
  return `${new Date(time).toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

// Production builds show nothing. Every other build shows a label, and a
// missing value is shown as UNKNOWN rather than hidden.
export function buildIdentityLabel(input: BuildIdentityInput): string | null {
  if (input?.profile === 'production') return null;
  const branch = (input?.branch ?? '').trim() || 'UNKNOWN BRANCH';
  return `TEST BUILD · ${shortCommit(input?.commit)} · ${branch} · ${buildTime(input?.builtAt)}`;
}

export function renderQaBuildIdentity(label: string | null): QaBuildIdentityDisplay | null {
  if (!label) return null;

  return {
    testID: 'qa-build-badge',
    labelTestID: 'qa-build-badge-label',
    accessibilityLabel: label,
    label,
  };
}
