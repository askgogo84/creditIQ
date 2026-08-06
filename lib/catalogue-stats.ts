// ONE source of truth for catalogue-size copy across the app. Every user-facing
// "N cards" / "N banks" claim reads from here (they had drifted to 100+ / 170+ / 93 /
// 17-banks / 24-banks, all from a never-wired 49->93 expansion in lib/data/seed-cards.ts).
//
// PLAIN LITERALS on purpose: importing these must never drag the ~2600-line SEED_CARDS
// array into a client bundle (Header is global — it ships on every page). Keeping them
// honest is a GATE, not a comment: lib/catalogue-stats.test.ts imports SEED_CARDS and
// FAILS the build if either value drifts from the real catalogue. So the number can't go
// stale silently — the test breaks first. When it fails, update the two lines below.
export const CARD_COUNT = 49  // === SEED_CARDS.length          (guarded by catalogue-stats.test.ts)
export const BANK_COUNT = 12  // === distinct issuers in SEED_CARDS (guarded likewise)
