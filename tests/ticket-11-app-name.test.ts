// TICKET-11: the product is called LivelyWalk. The mobile screens said
// "LiveWalk" throughout, including the header.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe('TICKET-11: app name is LivelyWalk everywhere', () => {
  it('TICKET-11: no screen, message or log says "LiveWalk"', () => {
    const offenders = ['App.tsx', ...sourceFiles('src')].filter((file) => /\bLiveWalk\b/.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('TICKET-11: the header shows the product name without prototype wording', () => {
    const app = readFileSync('App.tsx', 'utf8');
    expect(app).toContain('>LivelyWalk Guide<');
    expect(app).not.toMatch(/MVP|Shared backend booking cycle/);
  });
});
