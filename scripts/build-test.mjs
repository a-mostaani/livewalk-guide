#!/usr/bin/env node
// TICKET-16: the only supported way to make a build for testers.
//   npm run build:test            -> preview profile (test APK)
//   npm run build:test -- production
// Refuses to build unless this is the clean, pushed tip of the profile's
// branch, so the label inside the app is always true.
import { execFileSync, spawnSync } from 'node:child_process';
import { preflightProblems } from './build-test-rules.mjs';

const profile = process.argv[2] ?? 'preview';
const git = (...args) => {
  try { return execFileSync('git', args, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; }
};

git('fetch', '--quiet', 'origin');
const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
const head = git('rev-parse', 'HEAD');
const problems = preflightProblems({
  profile,
  branch,
  dirty: git('status', '--porcelain') !== '',
  head,
  remoteHead: git('rev-parse', `origin/${branch}`),
});

if (problems.length) {
  console.error('Build refused:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(`Building ${profile} from ${branch} at ${head.slice(0, 7)}`);
const result = spawnSync('eas', ['build', '--profile', profile, '--platform', 'android', '--non-interactive', '--no-wait'], { stdio: 'inherit' });
process.exit(result.status ?? 1);
