# transfer-graph integrity gate

`lib/data/transfer-graph.ts` is the v1 seed for the transfer-ladder engine
(`lib/transfer-ladder.ts`). It ships the same field shape as the deferred
`transfer_partners` table (`docs/travel-redesign/05-BACKEND-SCHEMA` §1) as a
build-gated TS constant. This is the gate that keeps it honest.

Run: `npm run check:transfer-graph`. Also runs automatically on every build via
the `prebuild` npm hook (alongside `check:card-links`), so a broken graph fails
`next build` — the gate cannot be forgotten.

## Why a gate and not a comment

This repo has already shipped a **dead data array nobody noticed** — `NEW_CARDS`
in `lib/data/seed-cards.ts`, 44 entries an author believed were live but that
were never spread into `SEED_CARDS`, so a "richer" rewrite silently rotted and a
live card carried a wrong value for months. A `// DEAD CODE` comment did not stop
it; a build gate did (`scripts/validate-card-links.ts`). This gate applies the
same discipline to transfer edges.

## What fails the build

1. **Duplicate edge** — two edges with the same `(from_currency, to_programme)`
   pair. Mirrors the `transfer_partners_pair` unique index. Per-card ratio splits
   must use distinct `from_currency` values, not two rows for one pair.
2. **Missing / invalid provenance** — `state` absent or not one of
   `verified | unverified | disputed`; `source` empty; `as_of` missing or not
   `YYYY-MM-DD`. A row with no source does not get to exist, let alone be `verified`.
3. **Float / non-positive ratio** — `ratio_from` or `ratio_to` not an integer ≥ 1.
   Ratios are two integers so direction is unambiguous and unloseable; a float
   `0.5` loses which way the transfer runs.
4. **Declared-but-never-exported array** — any `const X: TransferEdge[]` in the
   file that is never spread into `TRANSFER_EDGES` (the exact `NEW_CARDS` class).
5. **Estimate marked verified** — an edge whose `source` starts with
   `internal-estimate` may never carry `state: 'verified'`. An internal guess is
   never CreditIQ's verified data; the invariant is enforced, not remembered.

## Escape hatch

`INTENTIONALLY_DEAD_ARRAYS` in the gate script — empty by design. To leave it,
delete the array or spread it into `TRANSFER_EDGES`. Do **not** add a genuinely
forgotten array here to silence the gate; that is the mistake this check exists
to catch.

## Not gated (yet), on purpose

- **Null durations.** Every v1 edge has `duration_days_* = null` because issuer
  transfer times are not sourced. Null is legal and renders "transfer time
  unknown — confirm before you transfer". When durations are sourced, a partial
  range (one of min/max null) would be a smell worth gating — deferred until the
  data exists.
