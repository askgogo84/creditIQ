# SEED_CARDS Integrity Report

*Created during the card-art / SEED_CARDS cleanup pass. Source of truth for what
the runtime catalogue actually is, and where the data-quality landmines are.*

---

## 1. The file is three arrays, only two of which ship

`lib/data/seed-cards.ts` is **not** a single flat array. At runtime the exported
`SEED_CARDS` is assembled from:

| Array | Lines (approx) | Count | Reaches runtime? |
|---|---|---|---|
| `SEED_CARDS` initial literal | L6–717 | 19 | ✅ yes |
| `MORE_CARDS` | L720–777 | 30 | ✅ yes — `SEED_CARDS.push(...MORE_CARDS)` at L780 |
| `NEW_CARDS` | L861–2641 | **82** | ❌ **NO — never pushed** |

**Runtime `SEED_CARDS` = 19 + 30 = 49 cards.**

- **49 unique ids. No internal duplicates. `id === slug` for all 49.** (Verified by
  script, not by eye.)
- `NEW_CARDS` is declared and then never spread into `SEED_CARDS`. Its own header
  comment says: `!!! DEAD CODE - NOT PUSHED TO SEED_CARDS. EDITS HERE HAVE NO EFFECT !!!`
- **The dead block's own descriptive comment is wrong.** It says
  "44 NEW CARDS (takes us from 49 to 93)" — the array actually holds **82** entries,
  and the "NEW_CARDS triage report" it references **does not exist** in `docs/`.
  A stale comment on dead code is exactly how this stayed invisible: the label lied
  about the size, so nobody re-counted. Comments are not a gate; §5 is.

## 2. Which copy of a "duplicate" did the code resolve? → the live one, always

Twelve live ids **also appear** in the dead `NEW_CARDS` block:

```
axis-flipkart, rbl-shoprite, yes-marquee, au-altura-plus, hdfc-moneyback-plus,
icici-sapphiro, icici-rubyx, axis-ace, axis-vistara-infinite, amex-mrcc,
indusind-pinnacle, idfc-first-classic
```

**There is no first-wins vs last-wins ambiguity at runtime.** Because `NEW_CARDS`
is never pushed, the runtime array contains only the live copy of each id. Every
consumer — `.find(c => c.id === …)` (CompareTray, dashboard add-card picker,
EditorialCards' `new Map()`), `getCardBySlug`, the rewards engine — resolved the
**live** entry. Users have **never** seen the `NEW_CARDS` values.

This is *less* dangerous than a silent last-wins dedup (nothing ambiguous shipped),
but it hides a *different* landmine: the dead block was written as a **corrected /
enriched rewrite** of many live cards, and those corrections never went live.

### The live-vs-dead disagreements are material

For the four originally-flagged collisions, the live (shipped) values vs the dead
(never-shipped) rewrite disagree on facts a user would act on:

| Card | Field | LIVE (shipped) | DEAD `NEW_CARDS` (never shipped) |
|---|---|---|---|
| axis-flipkart | fee-waiver / rating / colour | ₹350k · 8.6 · `#2874f0` (Flipkart blue ✔) | ₹200k · 8.2 · `#f97316` (orange ✘) |
| rbl-shoprite | annual fee / reward type / earn rate | ₹500 · reward-points · 1% | ₹0 LTF · cashback · 0.5% |
| yes-marquee | tier / forex / earn rate | super-premium · 0% forex · 1.65% | premium · 1.75% forex · 2.0% |
| au-altura-plus | tier / reward type | entry · cashback | mid · reward-points |

The file's own comment admits the live `hdfc-moneyback-plus` base rate (2%) is
**wrong** and the dead copy has the correct 0.67% — i.e. **known-wrong data is
live while the fix sits dead.** The remaining collisions have not been triaged.

**This has already caused a production regression once.** An in-file comment at the
live `indusind-pinnacle` entry records that commit `157b2512` *wrongly deleted the
live `MORE_CARDS` entry* because the author had edited "the richer copy" — which was
sitting in the dead `NEW_CARDS` block — and assumed that was the live one. It had to
be restored. That is not a hypothetical risk; it is this exact confusion, shipped,
then reverted. The build gate in §5 exists so it cannot happen a third time.

## 3. `last_verified` is not evidence of verification

Every live card is stamped `last_verified: '2026-05-01'`; every dead `NEW_CARDS`
entry `'2026-05-15'`. Per the catalogue's own history these were **bulk
back-filled once**, not checked per-card. So:

- "Newer date" (the dead block) means **typed later, not verified later.**
- Neither copy of a collision can be treated as authoritative on that basis. Any
  promotion of dead values into runtime must be **re-verified against a real
  source** (bank T&C / paisabazaar), not accepted because the date is higher.

## 4. `card_image_url` — 12 live, all unusable, all render nowhere

All 12 `card_image_url` values are in the **live** array (0 in dead):

- **8** hotlink `asset21.ckassets.com` (EarnKaro/CashKaro CDN) — composed store
  assets; now return **HTTP 403** (hotlink protection).
- **4** are **bank logos, not card art** — 3× ICICI header `logo.png`, 1× HDFC
  Wikipedia logo.
- **None are rendered on any surface** — `card_image_url` has zero references in
  `.tsx`. Every card visual is drawn from `card.color` (CSS) today.

→ Safe to delete all 12. Tracked in commit (b).

## 5. Build gate proposal — never let this reach a human again

Add a validation step (extend `scripts/validate-card-links.ts`, already wired into
the build) that **fails the build** on:

1. **Duplicate id in the runtime `SEED_CARDS`** (import the real exported array,
   assert `new Set(ids).size === ids.length`). This is the primary invariant.
2. **`id !== slug`** for any runtime card.
3. *(soft, warn)* **A live id also declared in `NEW_CARDS`** — surfaces the
   live-vs-dead collision class so a "richer rewrite" can't silently rot in dead
   code again.

Because the gate imports the *assembled* export, it stays green today (49 unique)
and trips the instant a real duplicate is introduced.

## 6. Open decision (NOT yet actioned) — what to do with dead `NEW_CARDS`

The 82-entry dead block is the root of the "duplicate" confusion **and** may hold
genuinely-better data (per §2). Three options, needs a human call:

- **A. Delete the whole block.** Removes ~1,780 lines of dead, misleading code and
  all 12 collisions. Loses the potentially-correct rewrites unless salvaged first.
- **B. Keep as-is.** Status quo — the landmine remains.
- **C. Triage & promote.** Verify each of the 12 collisions against a real source,
  merge only confirmed corrections into the live entry, then delete the block.
  Most correct, most work; this is the only option that fixes known-wrong live data
  (e.g. moneyback-plus 2% → 0.67%).

**Do not blind-promote `NEW_CARDS` into runtime** — its values are unverified
(§3) and would overwrite shipped financial facts.
