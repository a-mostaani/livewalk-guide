// TICKET-7: sign-out rules, free of React Native imports so they can be tested.

export function signOutPrompt(walkIsLive: boolean) {
  return walkIsLive
    ? { title: 'Sign out during a live walk?', message: 'The walk stays live for the other person, but you will leave it on this phone. Sign in again to rejoin.' }
    : { title: 'Sign out?', message: 'You will need to sign in again to see your walks.' };
}

// Tell the server first so the token stops working there, then always clear
// the phone - even offline, the user must end up signed out locally.
export async function signOutEverywhere({ logoutRemote, clearLocal }: {
  logoutRemote: () => Promise<unknown>;
  clearLocal: () => Promise<void>;
}) {
  try {
    await logoutRemote();
  } catch {
    // Unreachable server or already-expired token: nothing more to invalidate.
  }
  await clearLocal();
}
