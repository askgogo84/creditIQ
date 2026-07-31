# Dashboard — Implementation Plan

**Rule:** incremental, scoped, existing patterns only, no new libraries. `npx tsc --noEmit` = 0 before each commit. Branch `design/tours` (off `design/shell`).
**Note:** the dashboard *itself is not built in the overnight run* — Phase 3 builds only the reusable tour component. This plan is the blueprint for the dashboard work that follows, so it must be honest and buildable.

## 0. Preconditions
- Phase 1 audit accepted (COMPUTABLE list is the contract).
- Decisions Q1–Q3 (`OVERNIGHT-QUESTIONS.md`) confirmed or overridden. v1 assumes the honest defaults.

## Step 1 — Provenance-split the total (tighten existing)
**Files:** `app/(shell)/dashboard/page.tsx`, `components/ciq/WalletView.tsx`, `components/ciq/HeroGauge.tsx`.
- Compute `verifiedPts` / `estimatedPts` from the per-card source flag (statement vs manual). Reuse the `verifiedPoints` logic in `lib/fusion-core.ts:212` as the reference.
- Pass both to `HeroGauge`; render a split fill (verified `--ciq-verified`, estimated `--ciq-estimated`).
- **Remove the headline ₹ value.** Demote `bestValue`/`conservativeValue` (the ×1.8/×0.25 assumptions) — either drop, or render a small subordinate "est. ₹X–₹Y" in `--ciq-estimated`. Hero shows **points**.
- Risk: `HeroGauge` may assume a single value — check its props before editing.
- ✅ tsc → commit `feat(dashboard): provenance-split the wallet total`.

## Step 2 — Real empty state
**Files:** `WalletView.tsx` (or a new `components/ciq/WalletEmpty.tsx` following existing component conventions).
- When `cards.length === 0`, render the empty state (per UI/UX §5), not a zeroed gauge.
- Two CTAs: Add a card (gold), Upload a statement (ghost). Both wire to existing handlers/modal.
- ✅ tsc → commit `feat(dashboard): first-run empty state`.

## Step 3 — Editorial cards strip
**Files:** new `components/ciq/EditorialCards.tsx`; consume in `WalletView`.
- Static hand-picked id list (mirror `card-roast`'s `CURATED` pattern), resolved against `SEED_CARDS`.
- Tile: `card_image_url` with `onError` → `color` swatch fallback (no layout shift). One-liner = `best_for`, 2-line clamp.
- Section label "Cards to know" — **never "Trending."** Horizontal scroll + snap. Links to `/card/[slug]`.
- ✅ tsc → commit `feat(dashboard): editorial cards strip (real art + best_for)`.

## Step 4 — Reduced-motion + 375px pass
- Confirm count-up and gauge honor `prefers-reduced-motion` (global `[data-ciq]` rule already forces `animation:none` — verify nothing bypasses it with inline JS animation).
- Verify at exactly 375px via a **375px iframe** (window resize can't shrink the viewport on this machine).
- ✅ tsc → commit `fix(dashboard): 375px + reduced-motion polish`.

## Step 5 — Tests
- Follow the existing Vitest + RTL pattern (`components/design/Figure.test.tsx`).
- Cover: total = Σ balances; verified/estimated split; empty state renders CTAs at 0 cards; editorial tile falls back to swatch on image error; no ₹ headline present.
- ✅ tsc + `npm run test` → commit `test(dashboard): wallet totals, empty state, editorial fallback`.

## Explicitly NOT in this plan
- Optimisation rate (needs categorized spend — unbuilt; audit §2). Reserve layout slot only.
- Any "trending" computation.
- Any new table, column, endpoint, or library.

## Sequencing & risk
- Steps are independent and individually shippable behind the existing surface; land in order, commit each.
- Biggest risk: editing `HeroGauge`/`WalletView` props — read them fully before changing; keep the single-value path working if other surfaces consume these components.
- Deploy is **gated**: nothing pushes without Gogo's explicit OK (project rule 11).

## Traceability check
| Build step | Renders | Audit verdict |
|---|---|---|
| Step 1 | total, verified/estimated split | COMPUTABLE (§1) |
| Step 2 | empty state | COMPUTABLE (§3) |
| Step 3 | editorial art + one-liner | COMPUTABLE (§4, art+best_for) |
| — | optimisation rate | NOT COMPUTABLE → omitted |
| — | "trending" rank | NOT COMPUTABLE → editorial instead |
