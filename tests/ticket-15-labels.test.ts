// TICKET-15 (first part): no icon in the app was drawing, which left the Send
// and Sign out controls as blank squares. A control must be readable from its
// words alone, whether or not its icon loads.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('TICKET-15: controls are readable without their icons', () => {
  it('TICKET-15: the chat Send button carries the word Send', () => {
    const composer = readFileSync('src/components/ChatComposer.tsx', 'utf8');
    expect(composer).toMatch(/<Text style=\{styles\.sendText\}>Send<\/Text>/);
  });

  it('TICKET-15: the header Sign out control carries the words Sign out', () => {
    const app = readFileSync('App.tsx', 'utf8');
    expect(app).toMatch(/<Text style=\{styles\.signOutText\}>Sign out<\/Text>/);
  });
});
