import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ACTIVE_BUILD_METADATA,
  PRODUCTION_BUILD_METADATA,
  QA_BUILD_METADATA,
  renderQaBuildIdentity,
} from '../src/buildIdentity';

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

describe('Guide source build identity', () => {
  it('renders the committed QA identity without environment or Expo config injection', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/buildIdentity.ts'), 'utf8');

    expect(source).not.toMatch(/process\.env|expo-constants|Constants\.expoConfig/);
    expect(QA_BUILD_METADATA).toEqual({
      commit: '8fc7a4d',
      branch: 'peter-dev',
      purpose: 'accepted/ready cancellation QA',
      label: 'QA BUILD · 8fc7a4d · peter-dev · accepted/ready cancellation QA',
    });
    expect(renderQaBuildIdentity(ACTIVE_BUILD_METADATA)).toEqual({
      testID: 'qa-build-badge',
      labelTestID: 'qa-build-badge-label',
      accessibilityLabel: 'QA BUILD · 8fc7a4d · peter-dev · accepted/ready cancellation QA',
      label: 'QA BUILD · 8fc7a4d · peter-dev · accepted/ready cancellation QA',
    });
  });

  it('renders no identity for the production/main metadata path', () => {
    expect(PRODUCTION_BUILD_METADATA).toBeNull();
    expect(renderQaBuildIdentity(PRODUCTION_BUILD_METADATA)).toBeNull();
  });

  it('places the QA identity in the shared header for auth and authenticated shells', () => {
    const appSource = readFileSync(resolve(process.cwd(), 'App.tsx'), 'utf8');
    const authSource = readFileSync(resolve(process.cwd(), 'src/screens/AuthScreen.tsx'), 'utf8');
    const badgeIndex = appSource.indexOf('<QaBuildBadge />');
    const scrollIndex = appSource.indexOf('          <ScrollView');

    expect(badgeIndex).toBeGreaterThan(-1);
    expect(badgeIndex).toBeLessThan(scrollIndex);
    expect(appSource).not.toMatch(/\{user \? <QaBuildBadge \/> : null\}/);
    expect(authSource).not.toMatch(/QaBuildBadge/);
  });

  it('keeps the full QA label readable at high contrast', () => {
    const colors = colorMap() as Record<string, string>;

    expect(contrastRatio(colors.qaBuildBadgeText, colors.qaBuildBadgeBackground)).toBeGreaterThanOrEqual(4.5);
  });
});
