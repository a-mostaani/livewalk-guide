// TICKET-18: in the traveler chat every message sat on the same side, so the
// traveler could not tell their own messages from the guide's.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { messageSide } from '../src/chat/composer';

describe('TICKET-18: chat message alignment', () => {
  it("TICKET-18: the user's own messages go on one side and the other person's on the other", () => {
    expect(messageSide('traveler', 'traveler')).toBe('mine');
    expect(messageSide('guide', 'traveler')).toBe('theirs');
    expect(messageSide('guide', 'guide')).toBe('mine');
    expect(messageSide('traveler', 'guide')).toBe('theirs');
  });

  it('TICKET-18: system messages are centred, belonging to neither side', () => {
    expect(messageSide('system', 'traveler')).toBe('system');
    expect(messageSide('', 'guide')).toBe('system');
  });

  it('TICKET-18: the live screen aligns bubbles with that rule', () => {
    const screen = readFileSync('src/screens/LiveBroadcastScreen.tsx', 'utf8');
    expect(screen).toMatch(/messageSide\(message\.senderRole, 'guide'\)/);
  });
});
