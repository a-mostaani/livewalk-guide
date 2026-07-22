import { describe, expect, it } from 'vitest';

const appConfig = require('../app.config') as {
  createAppConfig: (config: { extra: Record<string, unknown> }, env: Record<string, string>) => { extra: Record<string, unknown> };
};

describe('Guide build identity config', () => {
  it('keeps QA identity out of app configuration even when legacy variables are present', () => {
    const config = appConfig.createAppConfig({ extra: { existing: 'value' } }, {
      LIVEWALK_BUILD_CHANNEL: 'qa',
      LIVEWALK_BUILD_COMMIT: '8fc7a4d',
      LIVEWALK_BUILD_BRANCH: 'peter-dev',
      LIVEWALK_BUILD_PURPOSE: 'accepted/ready cancellation QA',
    });

    expect(config.extra.qaBuild).toBeUndefined();
    expect(Object.hasOwn(config.extra, 'qaBuild')).toBe(false);
  });

  it('keeps production configuration free of QA identity metadata', () => {
    const config = appConfig.createAppConfig({ extra: {} }, {});

    expect(config.extra.qaBuild).toBeUndefined();
    expect(Object.hasOwn(config.extra, 'qaBuild')).toBe(false);
  });
});
