// TICKET-4: free-text chat on the mobile live screen. Before this ticket the
// only "Message" control sent one fixed sentence; nothing could be typed.
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { MAX_MESSAGE_LENGTH, canSendDraft, cleanDraft, submitDraft } from '../src/chat/composer';

const live = { sessionReady: true, sending: false };

describe('TICKET-4: mobile text chat', () => {
  it('TICKET-4: sends the typed text, trimmed, and clears the field', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const result = await submitDraft('  Can we stop at the fountain?  ', live, send);
    expect(send).toHaveBeenCalledWith('Can we stop at the fountain?');
    expect(result).toEqual({ sent: true, draft: '', error: '' });
  });

  it('TICKET-4: an empty or whitespace-only message cannot be sent', async () => {
    const send = vi.fn();
    expect(canSendDraft('', live)).toBe(false);
    expect(canSendDraft('   \n ', live)).toBe(false);
    const result = await submitDraft('   ', live, send);
    expect(send).not.toHaveBeenCalled();
    expect(result.sent).toBe(false);
  });

  it('TICKET-4: a failed send keeps the typed text and reports why', async () => {
    const send = vi.fn().mockRejectedValue(new Error('Cannot reach LivelyWalk right now.'));
    const result = await submitDraft('Hello', live, send);
    expect(result).toEqual({ sent: false, draft: 'Hello', error: 'Cannot reach LivelyWalk right now.' });
  });

  it('TICKET-4: nothing is sent before the walk is live or while a send is in flight', async () => {
    const send = vi.fn();
    expect(canSendDraft('Hello', { sessionReady: false, sending: false })).toBe(false);
    expect(canSendDraft('Hello', { sessionReady: true, sending: true })).toBe(false);
    const early = await submitDraft('Hello', { sessionReady: false, sending: false }, send);
    expect(early.sent).toBe(false);
    expect(early.draft).toBe('Hello');
    expect(early.error).toMatch(/live/i);
    await submitDraft('Hello', { sessionReady: true, sending: true }, send);
    expect(send).not.toHaveBeenCalled();
  });

  it('TICKET-4: long text is cut to the length the API stores', () => {
    expect(cleanDraft('x'.repeat(MAX_MESSAGE_LENGTH + 50))).toHaveLength(MAX_MESSAGE_LENGTH);
  });

  it('TICKET-4: the live screen offers a text field instead of a canned sentence', () => {
    const screen = readFileSync('src/screens/LiveBroadcastScreen.tsx', 'utf8');
    expect(screen).toMatch(/<ChatComposer\b/);
    expect(screen).not.toContain('slow down at the next corner');
  });
});
