import { describe, expect, it } from 'vitest';

const appConfig = require('../app.config') as {
  createAppConfig: (config: { extra: Record<string, unknown> }, env: Record<string, string>) => { extra: Record<string, unknown> };
};

describe('Guide build identity config', () => {
  it('renders QA metadata from the QA build config', () => {
    const config = appConfig.createAppConfig({ extra: { existing: 'value' } }, {
      LIVEWALK_BUILD_CHANNEL: 'qa',
      LIVEWALK_BUILD_COMMIT: '5930b6d',
      LIVEWALK_BUILD_BRANCH: 'peter-dev',
      LIVEWALK_BUILD_PURPOSE: 'cancellation-state QA',
    });

    expect(config.extra.qaBuild).toEqual({
      commit: '5930b6d',
      branch: 'peter-dev',
      purpose: 'cancellation-state QA',
      label: 'QA BUILD · 5930b6d · peter-dev · cancellation-state QA',
    });
  });

  it('returns no Guide QA badge metadata without QA build config', () => {
    const config = appConfig.createAppConfig({ extra: {} }, {});

    expect(config.extra.qaBuild).toBeUndefined();
    expect(Object.hasOwn(config.extra, 'qaBuild')).toBe(false);
  });
});
