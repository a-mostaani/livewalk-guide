import { describe, expect, it } from 'vitest';

const appConfig = require('../app.config') as {
  createAppConfig: (config: { extra: Record<string, unknown> }, env: Record<string, string>) => { extra: Record<string, unknown> };
};

describe('Guide build identity config', () => {
  it('renders QA metadata from the QA build config', () => {
    const config = appConfig.createAppConfig({ extra: { existing: 'value' } }, {
      LIVEWALK_BUILD_CHANNEL: 'qa',
      LIVEWALK_BUILD_COMMIT: 'bd14ed6',
      LIVEWALK_BUILD_BRANCH: 'peter-dev',
      LIVEWALK_BUILD_PURPOSE: 'accepted/ready cancellation QA',
    });

    expect(config.extra.qaBuild).toEqual({
      commit: 'bd14ed6',
      branch: 'peter-dev',
      purpose: 'accepted/ready cancellation QA',
      label: 'QA BUILD · bd14ed6 · peter-dev · accepted/ready cancellation QA',
    });
  });

  it('returns no Guide QA badge metadata without QA build config', () => {
    const config = appConfig.createAppConfig({ extra: {} }, {});

    expect(config.extra.qaBuild).toBeUndefined();
    expect(Object.hasOwn(config.extra, 'qaBuild')).toBe(false);
  });

  it('omits Guide QA metadata for production builds', () => {
    const config = appConfig.createAppConfig({ extra: {} }, {
      LIVEWALK_BUILD_CHANNEL: 'production',
      LIVEWALK_BUILD_COMMIT: 'bd14ed6',
      LIVEWALK_BUILD_BRANCH: 'main',
      LIVEWALK_BUILD_PURPOSE: 'production',
    });

    expect(config.extra.qaBuild).toBeUndefined();
    expect(Object.hasOwn(config.extra, 'qaBuild')).toBe(false);
  });
});
