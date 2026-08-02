# Wallet — Implementation Plan

**Rule:** incremental, scoped, existing patterns only, no new libraries. `npx tsc --noEmit` = 0 before each commit. Full-file replacement on code files (project rule 6/8). Scope `git add` to named files, never `git add .`. **Deploy is gated** — nothing pushes without Gogo's explicit OK (rule 11).
**Shape:** the wallet already exists (`app/(shell)/dashboard/page.tsx` → `components/ciq/WalletView.tsx`). v1 is **subtract → tighten → migrate → retour**, not a rebuild.

## 0. Preconditions
- Data audit accepted (COMPUTABLE list is the contract).
- CLAUDE.md correction in effect: migrate **toward white/copper, never toward `[data-ciq]`**.
- Confirm Home will own `BestMove` and `EditorialCards` before removing them from the wallet (so they aren't orphaned). Components are **moved, not deleted**.

## Step 1 — Subtract: strip the wallet to holdings-only
**Files:** `components/ciq/WalletView.tsx`.
- Remove the **"Your best move"** block (the `totalPoints > 0` → `<BestMove … />` section) and its import.
- Remove the **`<EditorialCards />`** block (the `#wallet-editorial` div) and its import.
- Keep: eyebrow, greeting, `HeroGauge`, `EstimateRange` (via gauge), credo, held-cards list, Add-a-card CTA, Upload-a-statement CTA.
- **Do NOT delete `BestMove.tsx` or `EditorialCards.tsx`** — Home consumes them. Leave the files (and their tests) in place.
- The 3-step tour drops to 2 steps here as a side effect (the editorial step's anchor is gone) — formalized in Step 4.
- ✅ tsc → commit `refactor(wallet): holdings-only — move BestMove + editorial off to Home`.

## Step 2 — Tighten: points-first, rupees only as EstimateRange
**Files:** `components/ciq/WalletView.tsx`, `components/ciq/HeroGauge.tsx` (verify props).
- Confirm the hero centre label is **points**; `vPoints`/`ePoints` split fill is intact (already in `WalletView:53-56`).
- Confirm any ₹ renders **only** through `EstimateRange` (`estLow`/`estHigh`). No standalone `bestValue`/`conservativeValue` number anywhere on the surface.
- All-estimated case: gauge states "all estimated" + upload nudge.
- Risk: `HeroGauge` is shared — read its props fully before editing; keep any single-value path working if another surface consumes it.
- ✅ tsc → commit `fix(wallet): points-first hero, rupees only via shared EstimateRange`.

## Step 3 — Migrate: gold `[data-ciq]` → white/copper
**Files:** `WalletView.tsx`, `HeroGauge.tsx`, `CardRow.tsx`, the add-card modal in `app/(shell)/dashboard/page.tsx`, and the relevant token blocks in `app/globals.css`.
- Repaint surface bg, panels, ink, hairlines to the **white/copper light system**. Replace `--ciq-gold*` accents with **copper** (accent only).
- **Preserve semantics:** verified-green `#4FBF87` reserved for verified only; estimated grey `#8A857B`; copper never used as a data colour.
- Remove `data-ciq`/`data-theme="dark"` wrappers where they force the retired gold base; the surface renders on white.
- Watch the two theme-attribute gotchas from memory: pre-paint `data-theme` on `<html>` can be wiped by hydration on server-component routes (Header re-applies on mount); and `position:sticky` breaks under `overflow-x:hidden` (use `fixed` for pinned chrome). Neither should regress here.
- ✅ tsc → commit `feat(wallet): migrate surface to white/copper light system`.

## Step 4 — Retour: 2 steps, first-visit, final button opens Add Card
**Files:** `components/ciq/WalletView.tsx`, `components/ciq/Tour.tsx` (small, optional prop only).
- Reduce `WALLET_TOUR` to **2 steps**: (1) `#wallet-gauge` "Your points, verified vs estimated" (what verification buys you); (2) `#wallet-add` "Add a card."
- Pass `theme="light"` to `Tour`; repaint its ring/button from gold to **copper**.
- **Final button = "Add a card", and it opens the modal.** In `WalletView`'s tour `onClose`: `reason === 'done'` → set `ciq_wallet_tour_v1` **and** call `onAddCard()`; `reason === 'skip'` → set flag only. Keep `Tour.tsx` generic — add an optional `finalLabel?: string` prop only if needed to relabel the last button (smallest change wins).
- First-visit gating (localStorage) and "Take a tour" re-open already exist — keep.
- ✅ tsc → commit `feat(wallet): 2-step light tour whose final step opens Add Card`.

## Step 5 — Add-a-card picker (no card numbers) + 375px + reduced-motion pass
**Files:** the add-card modal in `app/(shell)/dashboard/page.tsx`.
- Move the modal from free-text bank/name to a `SEED_CARDS`-backed searchable picker (bank + card name). **No card-number field** — last4 optional only. Points optional → saves Estimated.
- Confirm count-up + gauge fill honor `prefers-reduced-motion` after the repaint (nothing bypasses it with inline JS animation).
- Verify at exactly **375px via a 375px iframe** (window resize can't shrink the viewport on this machine).
- ✅ tsc → commit `feat(wallet): SEED_CARDS add-card picker + 375px/reduced-motion polish`.

## Step 6 — Tests
**Files:** follow the existing Vitest + RTL pattern (`components/ciq/*.test.tsx`, e.g. `HeroGauge.test.tsx`, `EditorialCards.test.tsx`).
- Cover: total = Σ balances; verified/estimated split; **no BestMove and no EditorialCards render on the wallet**; empty state renders both CTAs at 0 cards; rupees appear only via `EstimateRange`; tour is 2 steps and the final action opens Add Card; no gold `[data-ciq]` token on the surface.
- ✅ tsc + `npm run test` → commit `test(wallet): holdings-only render, split total, tour-opens-add-card`.

## Explicitly NOT in this plan
- Deleting `BestMove.tsx` / `EditorialCards.tsx` (they move to Home).
- Optimisation rate (needs categorized spend — unbuilt; audit §2).
- Any "trending" computation, any new table/column/endpoint/library.
- Tabs on the wallet (IA §4 — it doesn't need them).

## Sequencing & risk
- Steps are independent and individually shippable; land in order, commit each.
- **Biggest risk:** editing shared components (`HeroGauge`, `CardRow`, `Tour`) — read them fully before changing; other surfaces may consume them. Keep their existing prop contracts working.
- **Second risk:** removing `BestMove`/`EditorialCards` from the wallet before Home imports them would orphan the components — coordinate with the Home build so they aren't dead code even briefly on `main`.
- Local `npm run build` may fail only on `/icon` (next/og on Windows) — that's a known false alarm; it deploys fine on Vercel. `tsc --noEmit` is the real gate.

## Traceability check
| Build step | Renders / changes | Audit / IA verdict |
|---|---|---|
| Step 1 | remove BestMove + editorial | IA §4 (wallet = holdings only) |
| Step 2 | split total, EstimateRange | COMPUTABLE (§1) + ₹ caveat |
| Step 3 | white/copper repaint | IA §8.4 (migrate toward white) |
| Step 4 | 2-step tour, final opens Add Card | IA §6 |
| Step 5 | SEED_CARDS picker, no card numbers | IA §4 |
| — | optimisation rate | NOT COMPUTABLE → omitted |
| — | "trending" / editorial-on-wallet | moved to Home / NOT COMPUTABLE |
