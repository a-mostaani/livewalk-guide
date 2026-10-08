// TICKET-16: the build label on top of the app is filled in at build time, so
// it can never name a commit other than the one the build was made from.
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

const appConfig = require('../app.config') as {
  createAppConfig: (config: { extra: Record<string, unknown> }, env: Record<string, string>, git?: (args: string[]) => string) => { extra: Record<string, any> };
};

describe('TICKET-16: build identity config', () => {
  it('TICKET-16: on the build service the commit comes from the service, never from local git', () => {
    const git = vi.fn(() => 'should-not-be-used');
    const config = appConfig.createAppConfig({ extra: {} }, {
      EAS_BUILD: 'true',
      EAS_BUILD_GIT_COMMIT_HASH: '3d1f4930c0ffee0000000000000000000000beef',
      EAS_BUILD_PROFILE: 'preview',
      LIVELYWALK_BUILD_BRANCH: 'livekit-v1',
    }, git);
    expect(config.extra.buildIdentity).toMatchObject({ commit: '3d1f4930c0ffee0000000000000000000000beef', branch: 'livekit-v1', profile: 'preview' });
    expect(Number.isNaN(Date.parse(config.extra.buildIdentity.builtAt))).toBe(false);
    expect(git).not.toHaveBeenCalled();
  });

  it('TICKET-16: a local run reads commit and branch from git', () => {
    const git = vi.fn((args: string[]) => (args.includes('--abbrev-ref') ? 'ticket-branch' : 'abcdef1234567890'));
    const config = appConfig.createAppConfig({ extra: {} }, {}, git);
    expect(config.extra.buildIdentity).toMatchObject({ commit: 'abcdef1234567890', branch: 'ticket-branch', profile: 'local' });
  });

  it('TICKET-16: missing values on the build service stay empty instead of being guessed', () => {
    const config = appConfig.createAppConfig({ extra: {} }, { EAS_BUILD: 'true', EAS_BUILD_PROFILE: 'preview' }, () => 'local-value');
    expect(config.extra.buildIdentity.commit).toBe('');
    expect(config.extra.buildIdentity.branch).toBe('');
  });

  it('TICKET-16: each build profile names the branch it is allowed to build from', () => {
    const eas = JSON.parse(readFileSync('eas.json', 'utf8'));
    expect(eas.build.preview.env.LIVELYWALK_BUILD_BRANCH).toBe('livekit-v1');
    expect(eas.build.development.env.LIVELYWALK_BUILD_BRANCH).toBe('livekit-v1');
    expect(eas.build.production.env.LIVELYWALK_BUILD_BRANCH).toBe('main');
  });
});
