import { describe, expect, it } from 'vitest';

const appConfig = require('../app.config') as {
  createAppConfig: (
    config: { extra: Record<string, unknown> },
    env: Record<string, string>,
    sourceIdentity: { commit: string; branch: string },
  ) => { android: { package: string }; extra: Record<string, unknown> };
};

describe('Guide build identity config', () => {
  it('embeds the exact peter-dev source identity for a traceable QA APK', () => {
    const config = appConfig.createAppConfig(
      { extra: { existing: 'value' } },
      {},
      { commit: 'abc1234', branch: 'peter-dev' },
    );

    expect(config.extra.qaBuild).toEqual({
      commit: 'abc1234',
      branch: 'peter-dev',
      purpose: 'LW-31 Android source recovery QA',
      label: 'QA BUILD · abc1234 · peter-dev · LW-31 Android source recovery QA',
    });
  });

  it('keeps production configuration free of QA identity metadata', () => {
    const config = appConfig.createAppConfig({ extra: {} }, {}, { commit: 'def5678', branch: 'main' });

    expect(config.extra.qaBuild).toBeUndefined();
    expect(Object.hasOwn(config.extra, 'qaBuild')).toBe(false);
  });

  it('rejects untraceable QA source instead of silently producing an anonymous build', () => {
    expect(() => appConfig.createAppConfig({ extra: {} }, {}, { commit: '', branch: '' }))
      .toThrow('Guide QA config requires a peter-dev Git checkout with .git metadata.');
  });

  it('keeps the Android identity stable, distinct, and independent of Expo project linkage', () => {
    const config = appConfig.createAppConfig({ extra: {} }, {}, { commit: 'abc1234', branch: 'peter-dev' });

    expect(config.android.package).toBe('com.livewalk.guide');
    expect(config.android.package).not.toBe('com.livewalk.traveler');
    expect(config.extra.eas).toBeUndefined();
  });

  it('does not require or copy Traveler client configuration into the Guide build', () => {
    const config = appConfig.createAppConfig({ extra: {} }, {}, { commit: 'abc1234', branch: 'peter-dev' });

    expect(config.extra.mapboxTokenMobile).toBeUndefined();
  });
});
