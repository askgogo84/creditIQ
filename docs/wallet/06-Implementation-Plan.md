# Wallet — Implementation Plan

**Rule:** incremental, scoped, existing patterns only, no new libraries. `npx tsc --noEmit` = 0 before each commit. Full-file replacement on code files (project rule 6/8). Scope `git add` to named files, never `git add .`. **Deploy is gated** — nothing pushes without Gogo's explicit OK (rule 11).
**Shape:** the wallet already exists (`app/(shell)/dashboard/page.tsx` → `components/ciq/WalletView.tsx`). v1 is **tighten → migrate → retour → picker → test → subtract**, not a rebuild.

## 0. Preconditions
- Data audit accepted (COMPUTABLE list is the contract).
- CLAUDE.md correction in effect: migrate **toward white/copper, never toward `[data-ciq]`**.
- **Removal is decoupled (amendment 1).** Every step except the last lands independently and does **not** wait for Home. The removal of `BestMove` + `EditorialCards` from the wallet render is its **own final step (Step 6), gated on Home importing them** — so those components are never orphaned (dead code) on `main`. Components are **moved, not deleted**.
- **Invariant: nothing may be dead code or visually broken on `main` at any commit boundary.** Because `--ciq-*` tokens *and* the `.ciq-*` classes are scoped to `[data-ciq]` (globals.css:1454/1474/1494), any still-rendered gold component must keep a `[data-ciq]` context until it is removed — see the Step 2 transitional island.

## Step 1 — Tighten: points-first, rupees only as EstimateRange
**Files:** `components/ciq/WalletView.tsx`, `components/ciq/HeroGauge.tsx` (verify props only).
- Confirm the hero centre label is **points**; `vPoints`/`ePoints` split fill is intact (already in `WalletView:53-56`).
- Confirm any ₹ renders **only** through `EstimateRange` (`estLow`/`estHigh`). No standalone `bestValue`/`conservativeValue` number anywhere on the surface.
- All-estimated case: gauge states "all estimated" + upload nudge.
- Risk: `HeroGauge` is shared — read its props fully before editing; keep any single-value path working if another surface consumes it.
- BestMove + editorial stay rendered (removed only in Step 6). This step does not touch them.
- ✅ tsc → commit `fix(wallet): points-first hero, rupees only via shared EstimateRange`.

## Step 2 — Migrate: gold `[data-ciq]` → white/copper (+ light-mode contract fix, + leave ciq-theme)
**Files:** `WalletView.tsx`, `HeroGauge.tsx`, `CardRow.tsx`, the add-card modal container in `app/(shell)/dashboard/page.tsx`, `app/globals.css`.
- Repaint the wallet's own markup off the `[data-ciq]` gold system to the **white/copper light system**: `--ciq-*` tokens → light tokens (`--ink`, `--surface`, `--line`, `--copper`…), `[data-ciq]`-scoped `.ciq-display`/`.ciq-mono`/`.ciq-rise` usages → their light-system equivalents. Replace `--ciq-gold*` accents with **copper** (accent only).
- **Preserve semantics:** verified-green `#4FBF87` reserved for verified only; estimated grey `#8A857B`; copper never used as a data colour.
- **Drop the `<CiqTheme>` wrapper from `WalletView`.** The wallet renders on the site's single theme system (`creditiq-theme` / `data-theme` on `<html>`, pre-painted in `app/layout.tsx`). This is the actual fix for the light-mode bug — the wallet stops living on a second, never-syncing theme key. See the TRD "Theme system (ciq-theme) — what happens" section for the full ciq-theme decision.
- **Transitional island (amendment 1 consequence):** `BestMove` and the `EditorialCards` strip are still rendered until Step 6 and depend on `[data-ciq]`. Wrap **only those two blocks** in a hardcoded `<div data-ciq data-theme="dark">` island so they render correctly (gold) until Step 6 removes the blocks **and** the island together. The island is explicitly temporary; it is deleted in Step 6.
- **Light-mode contract fix (amendment 3) — fix the contract, not per-element.** Scope the globals.css:231 rule `h1,h2,h3,h4,h5 { color: var(--ink) }` so headings **inside `[data-ciq]` default to `--ciq-ink`** (add `[data-ciq] h1,[data-ciq] h2,… { color: var(--ciq-ink) }`, or restrict the base rule to `:root:not([data-ciq])`). This fixes the four broken headings (WalletView 92/131/171, EditorialCards 35), the two that only survive today by an accidental inline colour (WalletView 155, Tour 264), and prevents the class recurring across the five other `[data-ciq]` surfaces still on gold. **Do not touch the `<div className="ciq-display">` display numbers in HeroGauge/BestMove/CardRow** — they are safe only because `div`s escape the `h1..h5` rule (see TRD note).
- Watch the two theme-attribute gotchas from memory: pre-paint `data-theme` on `<html>` can be wiped by hydration on server-component routes (Header re-applies on mount); and `position:sticky` breaks under `overflow-x:hidden` (use `fixed` for pinned chrome). Neither should regress here.
- ✅ tsc → commit `feat(wallet): migrate surface to white/copper, leave ciq-theme, scope [data-ciq] heading colour`.

## Step 3 — Retour: 2 steps, first-visit, final button opens Add Card
**Files:** `components/ciq/WalletView.tsx`, `components/ciq/Tour.tsx` (small, optional prop only).
- Reduce `WALLET_TOUR` to **2 steps**: (1) `#wallet-gauge` "Your points, verified vs estimated" (what verification buys you); (2) `#wallet-add` "Add a card." The editorial tour step is dropped now as a **deliberate choice** — the `#wallet-editorial` section itself still renders until Step 6, but it does not need to be toured.
- Pass `theme="light"` to `Tour`; repaint its ring/button from gold to **copper**.
- **Final button = "Add a card", and it opens the modal.** In `WalletView`'s tour `onClose`: `reason === 'done'` → set `ciq_wallet_tour_v1` **and** call `onAddCard()`; `reason === 'skip'` → set flag only. Keep `Tour.tsx` generic — add an optional `finalLabel?: string` prop only if needed to relabel the last button (smallest change wins).
- First-visit gating (localStorage) and "Take a tour" re-open already exist — keep.
- ✅ tsc → commit `feat(wallet): 2-step light tour whose final step opens Add Card`.

## Step 4 — Add-a-card picker (SEED_CARDS, no free-text, no card numbers) + 375px + reduced-motion pass
**Files:** the add-card modal in `app/(shell)/dashboard/page.tsx`.
- **Resolves PRD §10 (amendment 2): picker-only, NO free-text fallback.** Free-text produces "Amex" / "American Express" / "amex plat" for one card and breaks every downstream match — the same class of bug already visible in the WhatsApp portfolio's "Amex Amex" rendering. Move the modal from free-text bank/name to a `SEED_CARDS`-backed **searchable picker** (bank + card name). last4 optional only; **no card-number field, ever.** Points optional → saves Estimated.
- Confirm count-up + gauge fill honor `prefers-reduced-motion` after the repaint (nothing bypasses it with inline JS animation).
- Verify at exactly **375px via a 375px iframe** (window resize can't shrink the viewport on this machine).
- ✅ tsc → commit `feat(wallet): SEED_CARDS-only add-card picker + 375px/reduced-motion polish`.

## Step 5 — Tests (independent features)
**Files:** follow the existing Vitest + RTL pattern (`components/ciq/*.test.tsx`, e.g. `HeroGauge.test.tsx`, `EditorialCards.test.tsx`).
- Cover everything that has landed independently of Home: total = Σ balances; verified/estimated split; empty state renders both CTAs at 0 cards; rupees appear only via `EstimateRange`; tour is 2 steps and the final action opens Add Card; the add-card picker is SEED_CARDS-backed with no card-number field; no gold `[data-ciq]` token on the migrated wallet surface.
- The **"no BestMove / no EditorialCards renders"** assertion is **not** here — it can only pass after Step 6 removal, so it ships with Step 6.
- ✅ tsc + `npm run test` → commit `test(wallet): split total, EstimateRange-only, 2-step tour opens Add Card, picker`.

## Step 6 — Subtract: remove BestMove + EditorialCards from the wallet render (FINAL — gated on Home)
**Files:** `components/ciq/WalletView.tsx`; the "no-render" tests.
- **Gate:** do not start until Home imports **both** `BestMove` and `EditorialCards`, so neither becomes dead code on `main`.
- Remove the **"Your best move"** block (the `totalPoints > 0` → `<BestMove … />` section) and its import.
- Remove the **`<EditorialCards />`** block (the `#wallet-editorial` div) and its import.
- **Delete the Step 2 transitional `[data-ciq]` island** — with both gold blocks gone there is nothing left to bridge.
- **Do NOT delete `BestMove.tsx` or `EditorialCards.tsx`** — Home consumes them. Leave the files (and their tests) in place.
- Add the tests deferred from Step 5: **no BestMove and no EditorialCards render on the wallet.**
- Keep: eyebrow, greeting, `HeroGauge`, `EstimateRange` (via gauge), credo, held-cards list, Add-a-card CTA, Upload-a-statement CTA.
- ✅ tsc + `npm run test` → commit `refactor(wallet): holdings-only — move BestMove + editorial off to Home`.

## Follow-on task (post-wallet, gated) — delete ciq-theme entirely
**Trigger/gate:** the **last** of `onboarding`, `my-cards`, `feed`, `profile`, `pro` has migrated off `[data-ciq]`/`CiqTheme` (all five, not any one).
**Then, in one cleanup:**
- Delete `components/ciq/ThemeProvider.tsx` (`CiqTheme`, `ThemeToggle`, `useTheme`).
- Delete the `ciq-theme` localStorage key usage and the `ciq-theme-change` event everywhere: `NavShell` (the `ciqTheme` mirror + listener), `Header` (the `ciq-theme` listener), and the **interim dual-write** added to the TabBar Appearance toggle in Step 2 (revert it to writing `creditiq-theme` only).
- Delete the `[data-ciq]` token blocks and `.ciq-*` utilities in `app/globals.css` (and the `[data-ciq]` scoping added by the Step 2 contract fix, since nothing is left under `[data-ciq]`).
- **Why this is a task, not a footnote:** Step 2 leaves a deliberate two-key write in the TabBar toggle (clearly commented INTERIM). Without this gated cleanup, the next person reads that dual-write as the intended design. `ciq-theme` is retired per CLAUDE.md; the sync exists only to stop the two keys desyncing until the gold system is gone.

## Follow-on task (light-system-wide) — unify the `--font-*` tokens onto the shipped landing-page fonts
**Not a wallet edit — a scoped task across the whole light system.** There are THREE font systems in play:
- CLAUDE.md's old list — Clash Display / Instrument Serif / Space Grotesk / Space Mono — was the **retired gold `[data-ciq]`** system's fonts.
- The light-system `:root` `--font-*` tokens currently resolve to **Syne / Inter / Geist Mono**.
- The **shipped creditiq.app landing page** — the settled design language — uses **Fraunces (~300 display) / Inter (body) / JetBrains Mono (figures)**.
**Target = the landing page.** Unify `app/globals.css` `--font-display` / `--font-body` / `--font-mono` (and the font `@import`) onto **Fraunces / Inter / JetBrains Mono**, so every light-system surface (wallet included) matches what users actually see. The wallet uses `--font-display` / `.mono` today, so it inherits the fix automatically — **do not hardcode fonts on the wallet.** CLAUDE.md's Design Language font line has been corrected to reflect this.

## Explicitly NOT in this plan
- Changing fonts on the wallet (uses the `--font-*` tokens; fixed by the font-unification follow-on above).
- Deleting `BestMove.tsx` / `EditorialCards.tsx` (they move to Home).
- **Global deletion of `ciq-theme` / `CiqTheme` / the `ciq-theme-change` event** — that is the gated Follow-on task above, not this plan. The wallet only *leaves* `ciq-theme` here and adds the interim dual-write sync. See TRD §4.1.
- Optimisation rate (needs categorized spend — unbuilt; audit §2).
- Any "trending" computation, any new table/column/endpoint/library.
- Tabs on the wallet (IA §4 — it doesn't need them).

## Sequencing & risk
- Steps 1–5 are independent and individually shippable; land in order, commit each. Step 6 is the only step gated on Home.
- **Biggest risk:** editing shared components (`HeroGauge`, `CardRow`, `Tour`) — read them fully before changing; other surfaces may consume them. Keep their existing prop contracts working.
- **Second risk:** the `ciq-theme` decision (Step 2). Leaving it means the shared TabBar Appearance toggle still exists on the wallet; the TRD states exactly how that toggle behaves post-migration so it does not read as a dead/half-broken control. **This is the one flagged decision — confirm the TRD approach before starting Step 2.**
- **Third risk:** removing `BestMove`/`EditorialCards` before Home imports them would orphan the components — Step 6's gate exists precisely to prevent that.
- Local `npm run build` may fail only on `/icon` (next/og on Windows) — that's a known false alarm; it deploys fine on Vercel. `tsc --noEmit` is the real gate.

## Traceability check
| Build step | Renders / changes | Audit / IA verdict |
|---|---|---|
| Step 1 | split total, EstimateRange | COMPUTABLE (§1) + ₹ caveat |
| Step 2 | white/copper repaint, leave ciq-theme, contract fix | IA §8.4 (migrate toward white) |
| Step 3 | 2-step tour, final opens Add Card | IA §6 |
| Step 4 | SEED_CARDS-only picker, no card numbers | IA §4 + PRD §10 (resolved) |
| Step 5 | tests for the above | — |
| Step 6 | remove BestMove + editorial (gated on Home) | IA §4 (wallet = holdings only) |
| — | optimisation rate | NOT COMPUTABLE → omitted |
| — | "trending" / editorial-on-wallet | moved to Home / NOT COMPUTABLE |
