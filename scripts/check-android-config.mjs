import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const env = {
  HOME: process.env.HOME,
  PATH: process.env.PATH,
  CI: '1',
  npm_config_cache: process.env.npm_config_cache ?? `${process.env.HOME}/.npm`,
};
const output = execFileSync('npx', ['expo', 'config', '--type', 'public', '--json'], {
  cwd: process.cwd(),
  encoding: 'utf8',
  env,
});
const config = JSON.parse(output);
const eas = JSON.parse(readFileSync(new URL('../eas.json', import.meta.url), 'utf8'));
const commit = execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], { encoding: 'utf8' }).trim();
const branch = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();

assert.equal(branch, 'peter-dev');
assert.equal(config.android.package, 'com.livewalk.guide');
assert.notEqual(config.android.package, 'com.livewalk.traveler');
assert.deepEqual(config.extra.qaBuild, {
  commit,
  branch,
  purpose: 'LW-31 Android source recovery QA',
  label: `QA BUILD · ${commit} · ${branch} · LW-31 Android source recovery QA`,
});
assert.equal(config.extra.eas, undefined);
assert.equal(config.extra.mapboxTokenMobile, undefined);
assert.equal(eas.build.development.developmentClient, true);
assert.equal(eas.build.development.android.buildType, 'apk');
assert.equal(eas.build.preview.developmentClient, undefined);
assert.equal(eas.build.preview.android.buildType, 'apk');
assert.equal(eas.build.production.android.buildType, 'app-bundle');

console.log(`Guide Android config ready: ${config.android.package} · ${branch}@${commit}`);
