// TICKET-6: Android answers one runtime-permission request at a time. Two
// requests in flight together (camera/microphone and location, both fired
// when a walk goes live) left both hanging on first run. Every prompt in the
// app goes through this queue so the next one starts only after the previous
// one has been answered.
let tail: Promise<unknown> = Promise.resolve();

export function runPermissionRequest<T>(request: () => Promise<T>): Promise<T> {
  const run = tail.then(request, request);
  tail = run.catch(() => undefined);
  return run;
}
