import { describe, expect, it } from 'vitest';

const appConfig = require('../app.config') as {
  createAppConfig: (
    config: { extra: Record<string, unknown> },
    env: Record<string, string>,
    qaBuild?: { commit: string; branch: string; purpose: string; label: string } | null,
  ) => { extra: Record<string, unknown> };
  resolveQaBuildMetadata: (
    env: Record<string, string>,
    cwd: string,
    git: (args: string[], cwd: string) => string,
  ) => { commit: string; branch: string; purpose: string; label: string } | null;
};

describe('Guide build identity config', () => {
  it('derives the non-main QA identity from the checked-out revision', () => {
    const metadata = appConfig.resolveQaBuildMetadata({}, '/repo', (args) => {
      if (args.join(' ') === 'rev-parse --short=7 HEAD') return '8fc7a4d';
      if (args.join(' ') === 'branch --show-current') return 'peter-dev';
      return '';
    });

    expect(metadata).toEqual({
      commit: '8fc7a4d',
      branch: 'peter-dev',
      purpose: 'LiveKit reconnect hardening',
      label: 'QA BUILD · 8fc7a4d · peter-dev · LiveKit reconnect hardening',
    });
    const config = appConfig.createAppConfig({ extra: { existing: 'value' } }, {}, metadata);
    expect(config.extra.qaBuild).toEqual(metadata);
  });

  it('keeps main configuration free of QA identity metadata', () => {
    const metadata = appConfig.resolveQaBuildMetadata({}, '/repo', (args) => {
      if (args.join(' ') === 'rev-parse --short=7 HEAD') return 'b84330a';
      if (args.join(' ') === 'branch --show-current') return 'main';
      return '';
    });
    const config = appConfig.createAppConfig({ extra: { qaBuild: { stale: true } } }, {}, metadata);

    expect(metadata).toBeNull();
    expect(config.extra.qaBuild).toBeUndefined();
    expect(Object.hasOwn(config.extra, 'qaBuild')).toBe(false);
  });
});
