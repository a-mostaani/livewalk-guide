// TICKET-16: the build label is derived from build-time values, shown loudly
// when they are missing, and hidden only in production builds.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildIdentityLabel, renderQaBuildIdentity } from '../src/buildIdentity';
import { branchForProfile, preflightProblems } from '../scripts/build-test-rules.mjs';

function colorMap() {
  const source = readFileSync(resolve(process.cwd(), 'src/components/Primitives.tsx'), 'utf8');
  return Object.fromEntries([...source.matchAll(/^\s+(\w+): '(#[0-9A-F]{6})',?$/gm)].map(([, key, value]) => [key, value]));
}

function luminance(hex: string) {
  const channels = hex.slice(1).match(/.{2}/g)!.map((value) => parseInt(value, 16) / 255);
  const linear = channels.map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground: string, background: string) {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

describe('TICKET-16: build label', () => {
  const full = { commit: '3d1f4930c0ffee0000000000000000000000beef', branch: 'livekit-v1', profile: 'preview', builtAt: '2026-10-08T20:45:10.000Z' };

  it('TICKET-16: shows commit, branch and build time for a test build', () => {
    expect(buildIdentityLabel(full)).toBe('TEST BUILD · 3d1f493 · livekit-v1 · 2026-10-08 20:45 UTC');
    expect(renderQaBuildIdentity(buildIdentityLabel(full))).toEqual({
      testID: 'qa-build-badge',
      labelTestID: 'qa-build-badge-label',
      accessibilityLabel: 'TEST BUILD · 3d1f493 · livekit-v1 · 2026-10-08 20:45 UTC',
      label: 'TEST BUILD · 3d1f493 · livekit-v1 · 2026-10-08 20:45 UTC',
    });
  });

  it('TICKET-16: production builds show no label', () => {
    expect(buildIdentityLabel({ ...full, profile: 'production' })).toBeNull();
    expect(renderQaBuildIdentity(null)).toBeNull();
  });

  it('TICKET-16: missing values are shown as UNKNOWN, never hidden', () => {
    expect(buildIdentityLabel(undefined)).toBe('TEST BUILD · UNKNOWN COMMIT · UNKNOWN BRANCH · UNKNOWN DATE');
    expect(buildIdentityLabel({ profile: 'preview', commit: '', branch: '', builtAt: 'nonsense' })).toBe('TEST BUILD · UNKNOWN COMMIT · UNKNOWN BRANCH · UNKNOWN DATE');
    expect(buildIdentityLabel({ ...full, commit: 'not-a-hash' })).toContain('UNKNOWN COMMIT');
  });

  it('TICKET-16: no commit or branch is typed into the source by hand', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/buildIdentity.ts'), 'utf8');
    expect(source).not.toMatch(/['"`][0-9a-f]{7}['"`]/);
    expect(source).not.toMatch(/peter-dev|livekit-v1/);
    expect(source).not.toMatch(/process\.env|expo-constants|Constants\.expoConfig/);
  });

  it('TICKET-16: the label sits in the shared header, on signed-out and signed-in screens alike', () => {
    const appSource = readFileSync(resolve(process.cwd(), 'App.tsx'), 'utf8');
    const authSource = readFileSync(resolve(process.cwd(), 'src/screens/AuthScreen.tsx'), 'utf8');
    const badgeIndex = appSource.indexOf('<QaBuildBadge />');
    const scrollIndex = appSource.indexOf('          <ScrollView');
    expect(badgeIndex).toBeGreaterThan(-1);
    expect(badgeIndex).toBeLessThan(scrollIndex);
    expect(appSource).not.toMatch(/\{user \? <QaBuildBadge \/> : null\}/);
    expect(authSource).not.toMatch(/QaBuildBadge/);
  });

  it('TICKET-16: the label stays readable at high contrast', () => {
    const colors = colorMap() as Record<string, string>;
    expect(contrastRatio(colors.qaBuildBadgeText, colors.qaBuildBadgeBackground)).toBeGreaterThanOrEqual(4.5);
  });

  it('TICKET-16: a test build is refused unless it is the pushed, clean tip of the right branch', () => {
    expect(branchForProfile('preview')).toBe('livekit-v1');
    expect(branchForProfile('production')).toBe('main');
    const ok = { profile: 'preview', branch: 'livekit-v1', dirty: false, head: 'abc', remoteHead: 'abc' };
    expect(preflightProblems(ok)).toEqual([]);
    expect(preflightProblems({ ...ok, branch: 'peter-dev' })).toHaveLength(1);
    expect(preflightProblems({ ...ok, dirty: true })).toHaveLength(1);
    expect(preflightProblems({ ...ok, remoteHead: 'older' })).toHaveLength(1);
    expect(preflightProblems({ ...ok, remoteHead: '' })).toHaveLength(1);
  });
});
