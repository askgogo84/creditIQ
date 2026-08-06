import { describe, it, expect } from 'vitest';
import { SEED_CARDS } from './data/seed-cards';
import { CARD_COUNT, BANK_COUNT } from './catalogue-stats';

// CATALOGUE-COUNT GATE
// ------------------------------------------------------------------------
// catalogue-stats.ts ships PLAIN LITERALS so importing it never pulls the
// SEED_CARDS array into a client bundle (Header is global). This test is the
// guard that keeps those literals honest: it imports the real catalogue and
// fails if CARD_COUNT or BANK_COUNT no longer matches. So a card added/removed,
// or a new issuer, breaks the build BEFORE the stale number can reach a
// user-facing surface — the same drift that gave us 100+ / 170+ / 93 can't recur.
// When this fails, update the two literals in lib/catalogue-stats.ts.
describe('catalogue-count gate', () => {
  it('CARD_COUNT equals SEED_CARDS.length', () => {
    expect(CARD_COUNT).toBe(SEED_CARDS.length);
  });

  it('BANK_COUNT equals the distinct issuer count in SEED_CARDS', () => {
    expect(BANK_COUNT).toBe(new Set(SEED_CARDS.map(c => c.bank)).size);
  });
});
