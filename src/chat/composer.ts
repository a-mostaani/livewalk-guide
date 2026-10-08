// TICKET-4: free-text chat on the live screen. Kept free of React Native
// imports so the rules can be tested directly.

// The API stores at most this many characters per message.
export const MAX_MESSAGE_LENGTH = 1000;

export type ComposerGate = { sessionReady: boolean; sending: boolean };

export type SubmitResult =
  | { sent: true; draft: ''; error: '' }
  | { sent: false; draft: string; error: string };

export const NOT_LIVE_MESSAGE = 'Messages open once the walk is live.';
const SEND_FAILED_MESSAGE = 'Message not sent. Check your connection and try again.';

export function cleanDraft(draft: string) {
  return draft.trim().slice(0, MAX_MESSAGE_LENGTH);
}

export function canSendDraft(draft: string, gate: ComposerGate) {
  return gate.sessionReady && !gate.sending && cleanDraft(draft).length > 0;
}

// On failure the typed text is handed back untouched so nothing is lost.
export async function submitDraft(draft: string, gate: ComposerGate, send: (text: string) => Promise<void>): Promise<SubmitResult> {
  if (!gate.sessionReady) return { sent: false, draft, error: NOT_LIVE_MESSAGE };
  if (!canSendDraft(draft, gate)) return { sent: false, draft, error: '' };
  try {
    await send(cleanDraft(draft));
    return { sent: true, draft: '', error: '' };
  } catch (error) {
    return { sent: false, draft, error: error instanceof Error && error.message ? error.message : SEND_FAILED_MESSAGE };
  }
}
