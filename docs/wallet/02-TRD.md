# Wallet — Technical Requirements Document (TRD)

**Surface:** `/dashboard` (route group `(shell)`). Client component + existing API routes.
**Traceability:** the data contracts below are exactly the COMPUTABLE sources from `docs/dashboard-data-audit.md`. No new data source is invented.

## 1. Architecture (reuse-first, subtract-then-migrate)
The surface already exists at `app/(shell)/dashboard/page.tsx` and renders `components/ciq/WalletView.tsx`. v1 is **three moves, in order**:
1. **Subtract** — remove Best Move and the editorial strip from the wallet render (they move to Home; components are *not* deleted).
2. **Tighten** — keep the provenance-split gauge, the held-cards list, and the two actions; keep the shared `EstimateRange` as the only rupee treatment.
3. **Migrate** — repaint the surface from the retired gold `[data-ciq]` system to **white/copper**.

Keep the existing data-load path (`loadCards`) and the merge of `statement_imports` + `manual_cards`. Do not rebuild plumbing.

## 2. Mount point
```
app/(shell)/layout.tsx  ->  <NavShell> (auth-gated)
  desktop >=900px: fixed <AppRail> 248px + .ciq-shell-main
  mobile  <900px : <TabBar> bottom, content padding-bottom ~104px
```
Wallet is the first app-nav item (`/dashboard`). No shell changes required by this work.

## 3. Data contracts (read-only; all already implemented)

### 3.1 Wallet cards
- `GET /api/user-cards` → `statement_imports` rows for `auth.uid()`
  `{ bank, card_name, card_last4, points_balance, points_currency, points_earned_this_month?, confidence, imported_at }` — tagged `source: 'statement'` client-side.
- `GET /api/manual-cards` → `manual_cards` rows for the user
  `{ id, bank, card_name, card_last4, points_balance, points_currency, imported_at }` — tagged `source: 'manual'`.
- Merge in `loadCards` (already implemented at `app/(shell)/dashboard/page.tsx:77-100`). Dedup by `bank + card_last4 + card_name` where practical (last4 optional).

### 3.2 Derived values (client — already computed in `WalletView`)
```ts
totalPoints  = cards.reduce((s,c) => s + (c.points_balance || 0), 0)            // REAL
vPoints      = cards.filter(c => c.source === 'statement').reduce(... )         // REAL, verified
ePoints      = cards.filter(c => c.source === 'manual').reduce(... )            // REAL, estimated
estLow       = Math.round(totalPoints * 0.25)   // cashback floor  — ESTIMATE
estHigh      = Math.round(totalPoints * 1.8)    // travel ceiling  — ESTIMATE
```
The `source` flag is the single provenance switch (reference: `lib/fusion-core.ts:212` `verifiedPoints`). `vPoints` + `ePoints` are already computed in `WalletView.tsx:53-56` — keep them.

**Rupee rule:** `estLow`/`estHigh` are **assumption multipliers**, never a stated value. They may only surface through the shared `EstimateRange` component (`≈ ₹low–₹high` + "estimate" badge). The hero centre label is **points**. No `bestValue`/`conservativeValue` hero number.

### 3.3 Add-a-card picker (catalogue source)
- Source: `SEED_CARDS` (`lib/data/seed-cards.ts`) — canonical (per project rule; the Supabase `cards` table is unreliable).
- Fields used by the picker: `id/slug`, `name`, `bank` (and `card_image_url`/`color` if the picker shows art). **No card numbers, ever** (IA §4).
- Write path unchanged: `POST /api/manual-cards` (dedup by bank+name+last4). Result is an **estimated** card.

## 4. Components: keep / remove-from-wallet / migrate

| Component | Action on the wallet | Note |
|---|---|---|
| `WalletView.tsx` | **Edit** — remove Best Move + editorial blocks; migrate tokens; retheme tour | The one file that changes most |
| `HeroGauge.tsx` | **Keep + migrate** | Split fill (verified/estimated); repaint to white/copper |
| `CardRow.tsx` | **Keep + migrate** | Verified/Estimated badge; repaint |
| `EstimateRange.tsx` | **Keep** | The only sanctioned rupee treatment; shared so it can't drift |
| `BestMove.tsx` | **Remove import/usage from wallet** | **Do NOT delete** — Home imports it |
| `EditorialCards.tsx` | **Remove import/usage from wallet** | **Do NOT delete** — Home imports it |
| `Tour.tsx` | **Keep + retheme** | Generic; wallet passes 2 steps + `theme="light"`; wire final→Add Card |

## 5. Tour behaviour (2 steps, first-visit, final = Open Add Card)
- The wallet passes a **2-step** `TourStep[]` to the generic `Tour` (down from 3 — the editorial step is gone with the strip).
  1. **What verification buys you** — anchored to `#wallet-gauge` (verified vs estimated).
  2. **Add a card** — anchored to `#wallet-add`.
- **First visit only:** gated by a localStorage seen-flag (`ciq_wallet_tour_v1` already in `WalletView`). Re-openable via a "Take a tour" affordance. Tracked individually per surface (IA §6) — finishing the wallet tour never dismisses Home's.
- **Final button opens Add Card, not "Done"** (IA §6): `Tour` already reports `onClose('done')` on the last step. In `WalletView`, the `onClose` handler does: on `reason === 'done'` → set seen-flag **and** call `onAddCard()`; on `reason === 'skip'` → set seen-flag only. `Tour.tsx` stays generic — the "do the thing" wiring lives in the surface. Label the final button "Add a card" (pass through, or add an optional `finalLabel` prop to `Tour` — smallest change wins).
- `Tour` must be passed `theme="light"` and its ring/button repainted to copper (currently `--ciq-gold-line` / gold gradient).

## 6. What is NOT wired (and why)
- **Engine (`lib/engine.ts`)** stays out. It needs a `UserSpendProfile`; no real per-user spend exists (audit §2). No wallet number is driven from `DEFAULT_SPEND_MIX`.
- **`user_points` table** ignored — schema-only, not operationalized. Wallet = `statement_imports` + `manual_cards`.
- **Optimisation rate** — no code path.
- **Best Move / editorial strip** — no longer rendered on this surface.

## 7. Provenance → colour mapping (white/copper target)
| State | Colour intent | Meaning |
|---|---|---|
| Verified (statement) | verified-green `#4FBF87` (reserved) | read from a real statement |
| Estimated (manual) | neutral grey `#8A857B` | user-typed, may be 0 |
| Accent / CTA | copper (accent only) | actions & hairlines, never a data colour |
| Surface | white / light base | the migrated realise-clean base |

The exact white/copper token names are a design-system decision (05-Backend-Schema §0 note + 04-UIUX-Brief §1). The **semantics above are fixed**: green = verified only, grey = estimated, copper = accent only.

Reduced motion: gauge fill + count-up must respect `prefers-reduced-motion` — reduced-motion users get the final state instantly.

## 8. Performance / SSR notes
- Client component; wallet fetched after auth. Show a skeleton, not a fake number, while loading (existing spinner acceptable).
- Add-card picker reads `SEED_CARDS` at build time — no network, no CDN dependency for correctness.

## 9. Security
- All per-user reads go through the existing bearer-token → verify `auth.getUser()` → service-role client scoped by `.eq('user_id', …)`. No new endpoints, no new exposure. **No card numbers are ever collected or stored** (last4 only).

## 10. Future hook (post-v1)
When categorized spend lands (statement MCC work, README Phase 4), an optimisation rate becomes computable elsewhere (Home), not on the wallet. The wallet stays holdings-only regardless.
