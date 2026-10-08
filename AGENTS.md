# LiveWalk Project Workflow

## Repository map and ticket assignment

- Use this map as the sole ticket-assignment source; do not guess repository names:
  - a-mostaani/livewalk-traveler is the Traveler Android/Expo app.
  - a-mostaani/livewalk-guide is the Guide Android/Expo app.
  - a-mostaani/livewalk-marketplace-api is the shared backend/API deployed as rendezvous-livewalk-api.
- Treat remote repositories as the source of truth.
- Before any release promotion (see Verified release promotion below), confirm shared types/shapes used across repos (e.g. MarketplaceRequest, LiveSession) still agree with each other. These have drifted silently before.

## Ticket execution

- Before starting, inspect ticket sections: Section A is human-only, Section B is agent-executable, and Section C is build-gated.
- For a human-only Section A blocker, including dashboard token creation, account or organization access, or an unavailable ticket-system entry, report it immediately and move to the next unblocked ticket. Do not wait or retry silently.
- Bring a ticket to code-complete (see Completion bar below) one at a time before moving to the next. Reaching code-complete on a ticket does not require waiting for that ticket to be tested and closed before starting the next — throughput continues while tickets await test.
- Follow the authoritative Section B order: B1 API hardening LW-25, LW-26, LW-27, LW-29; then Phase 0 foundation debt, Phase 1 backend/model correctness, Phase 2 media unlock, and Phase 3 monetize/scale. Work ticket-by-ticket and do not skip ahead unless explicitly reprioritized.
- LW-15b APK UI verification is parked behind builder ticket #275 and must not block Section B work.
- Commit each meaningful LiveWalk step as it is completed and keep advancing sequentially until capacity is reached. Resume from the next unfinished ticket after reset or a forced pause.

## Git and scratch workflow

- Never commit directly to main.
- livekit-v1 is the single development branch in all three repositories. All ticket work, test builds, and human testing happen there.
- The old peter-dev branch is parked: it stays on GitHub untouched, but do not build from it, merge it, rebase onto it, push to it, or delete it unless the user explicitly asks. Work that exists only on peter-dev is not part of the product until the user asks for it to be brought across.
- At the start of every coding turn, clone or pull the latest livekit-v1 into scratch, merge main into livekit-v1 before editing, and recreate regenerable dependencies there. Assume scratch is wiped between turns.
- If merging main creates a conflict that is not confidently resolvable, especially a schema or generated-file conflict, stop and ask rather than guessing.
- Commit meaningful changes early with a greppable ticket/action message, for example, LW-15b: restore traveler deps. For operational project-rule changes use LW-OPS: action.
- Push livekit-v1 before reporting completion. If no source changed, explicitly report that no commit was needed.
- Keep node_modules/, .expo/, build/, .venv/, dist/, and all other regenerable dependency, build, and temporary trees out of the persistent workspace. Record the reason for any persistent exception for a large downloaded SDK component.

## Secrets and completion bar

- Never expose credential or token values in status updates, commit messages, test-request messages, or WhatsApp reports; use secret or environment-variable names only. Keep credentials in gitignored .env files or secure storage, and verify .env is gitignored and unstaged before every commit.
- Code-complete (Peter's own bar, unblocks moving to the next ticket): typecheck (tsc --noEmit or equivalent) passes, relevant tests run, a real route or flow is exercised for user-flow changes, and the change is successfully pushed to livekit-v1. Do not call a ticket done in status reporting until it is at least code-complete and pushed.
- Closed (the real finish line for a ticket): code-complete, plus the user has tested per a test-request message (see below), confirmed it passes, and the change has been merged into main via a verified release promotion. Only closed tickets are truly finished — code-complete is a checkpoint, not the end state.
- For Android/EAS compatibility issues, prefer app.config.js over app.config.ts when the known eas-cli/config-loader issue recurs.
- No silent config fallbacks: if a build tool falls back to an auto-generated/default config because a file was not actually saved to disk, treat it as a build failure, not a successful build — verify config file contents on disk directly before trusting a build.

## Regression tests and automated checks

- Every bug ticket closes with a test that failed before the fix and passes after, named with the ticket ID (for example a test titled "TICKET-7: time field keeps its format after the default is cleared"). Write the failing test first, confirm it fails for the reported reason, then fix. A bug ticket without such a test is not code-complete.
- If a bug genuinely cannot be reproduced in an automated test (real camera, GPS, first-run OS permission prompts, returning from standby), say so explicitly in the ticket, automate the closest logic-level check available, and add the scenario as a numbered step in the manual device checklist so it is re-run before every tester build.
- The full booking cycle is defined once, in livewalk-marketplace-api/docs/booking-cycle.md, as numbered steps (BC-xx). Any change to a request, session, message, or auth shape or status must update that document and the cross-app suite in livewalk-marketplace-api/cross-app in the same change.
- GitHub Actions runs typecheck, the repo's tests, and the cross-app booking-cycle suite on every push to livekit-v1 and on every pull request to main. Run the same commands locally before pushing. A red check blocks code-complete; never skip, delete, or weaken a test to get a green run without the user's agreement.

## Test-request messages

Whenever one or more code-complete tickets are ready for the user to test, Peter sends a test-request message. This is separate from — and a stricter bar than — routine progress reporting.

### Building the message: side-effect analysis

Before writing the message, Peter must actively determine what else could plausibly be affected by each change, not just restate the ticket's stated scope. This means checking:
- What other flows, screens, or components import or call the changed code
- Whether the change touches a shared type/shape used by another repo
- Whether the change alters state, timing, or error handling in a way that could surface elsewhere (e.g. a cancellation, error, or edge-case path)
- If Peter cannot identify any plausible side effects after this check, state that explicitly (no side effects identified beyond the ticket's direct scope) rather than omitting the section — a missing side-effects section is ambiguous between checked, none found and not checked.

### Message format, per ticket included

1. Ticket ID(s) and one-line summary of what changed.
2. Exact commit hash the test build was generated from, and the branch (always livekit-v1 — see Build and deploy targets below).
3. Precise test steps — a concrete, ordered sequence to exercise. Not test the app.
4. Expected result — what correct behavior looks like at each key step.
5. Potential side effects — from the analysis above.
6. What NOT to worry about — known unrelated issues or WIP areas already tracked elsewhere.

### Accumulation of untested tickets

- If a test-request message is sent and the user has not yet performed that test by the time the next ticket becomes ready, the next test-request message must aggregate all still-untested tickets, not just the newly ready one — each with its own full section per the format above.
- A ticket drops out of the aggregated message only once the user confirms it passed (moving it toward closed) or explicitly reports it failed (moving it back to in-progress).
- This means a single test-request message may grow to cover several tickets at once if testing has lagged behind code-complete throughput; Peter should not send a wave of separate disjoint messages for each newly-ready ticket.

## Build and deploy targets

- Test/QA builds: always built from the latest livekit-v1 commit, always freshly built at the point of a test-request message, at the exact commit stated in the message. Never reuse an older build for a new or aggregated test request.
- Public download builds (LivelyWalk web page) and any public-facing backend deploy: only ever built/deployed from main, and only after the relevant tickets are closed via verified release promotion. Never point a public build at livekit-v1, even temporarily, even for a hotfix.
- No stale public builds during active testing: if a ticket in test changes user-facing behavior, the public build stays on the last-confirmed main state until the new one is promoted.
- State explicitly, per app, which branch each build/deploy target currently points to — this must never be left implicit.

## Progress reporting

- During active LiveWalk engineering, report progress every two hours until the work is paused or complete.
- Scheduled updates must reflect actual remote/GitHub state and use exactly: Ticket ID | status (code-complete/closed/blocked/in-progress) | blocker (or none) | repo + branch + commit reference.
- Do not call work code-complete until it is pushed to livekit-v1; do not call it closed until it is merged to main.

## Verified release promotion

- Development edits happen only on livekit-v1. The sole exception is a verified release promotion: after the user confirms a test-request (or aggregated test-request) has passed, merge livekit-v1 cleanly into main and push main for production deployment or Android packaging; never edit main directly.
- No merge into main without passed human tests on the latest livekit-v1. The human test must have been run on a build of the exact livekit-v1 commit being merged. If livekit-v1 has moved since the tested build, the newer commits need their own test-request and confirmation before promotion; do not merge a tip the user has not tested.
- The automated checks must also be green on that same commit before promotion.
- A ticket's status only becomes closed once this promotion has happened for the commit the user tested.
