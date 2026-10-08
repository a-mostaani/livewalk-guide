// TICKET-16: rules for making a test build, kept separate so they can be tested.

const BRANCH_FOR_PROFILE = { development: 'livekit-v1', preview: 'livekit-v1', production: 'main' };

export function branchForProfile(profile) {
  return BRANCH_FOR_PROFILE[profile] ?? null;
}

// The build label names the branch its profile is tied to, so a build is only
// allowed from that branch, with nothing uncommitted and nothing unpushed.
export function preflightProblems({ profile, branch, dirty, head, remoteHead }) {
  const expected = branchForProfile(profile);
  const problems = [];
  if (!expected) problems.push(`Unknown build profile "${profile}".`);
  else if (branch !== expected) problems.push(`Profile "${profile}" builds from ${expected}, but the current branch is ${branch}.`);
  if (dirty) problems.push('There are uncommitted changes. Commit them first.');
  if (!remoteHead || remoteHead !== head) problems.push(`This commit is not the pushed tip of origin/${expected ?? branch}. Push first.`);
  return problems;
}
