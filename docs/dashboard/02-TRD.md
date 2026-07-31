# Dashboard — Technical Requirements Document (TRD)

**Surface:** `/dashboard` (route group `(shell)`). Client component + existing API routes.
**Traceability:** data contracts below are exactly the COMPUTABLE sources from `docs/dashboard-data-audit.md`. No new data source is invented.

## 1. Architecture (reuse-first)
The surface already exists at `app/(shell)/dashboard/page.tsx` and renders `components/ciq/WalletView.tsx`. v1 is a **tightening**, not a rebuild:
- Keep the existing data-load path (`loadCards`) and the merge/dedup of `statement_imports` + `manual_cards`.
- Keep `WalletView` / `HeroGauge` as the render primitives.
- Change: enforce provenance-split, add a real empty state, add the editorial strip, and **remove/relabel** any headline ₹ value so it reads as an estimate (per audit §1 caveat).

## 2. Mount point
```
app/(shell)/layout.tsx  ->  <NavShell> (auth-gated)
  desktop >=900px: fixed <AppRail> 248px + .ciq-shell-main
  mobile  <900px : <TabBar> bottom, content padding-bottom 76px
```
Dashboard is the `Wallet` nav item (`APP_NAV[0]`, `/dashboard`). No shell changes required.

## 3. Data contracts (read-only; all already implemented)

### 3.1 Wallet cards
- `GET /api/user-cards` → `statement_imports` rows for `auth.uid()`
  `{ bank, card_name, card_last4, points_balance, points_currency, points_earned_this_month?, confidence, imported_at }`
- `GET /api/manual-cards` → `manual_cards` rows for the user
  `{ id, bank, card_name, card_last4, points_balance, points_currency, imported_at }`
- Merge + dedup by `bank + card_last4 + card_name` (last4 optional). Existing logic in `/api/user-cards` and the manual route.

### 3.2 Derived values (client)
```ts
totalPoints   = cards.reduce((s,c) => s + (c.points_balance || 0), 0)   // REAL
verifiedPts   = cards.filter(isStatement).reduce(... )                   // REAL, verified
estimatedPts  = totalPoints - verifiedPts                                // REAL, estimated
```
`isStatement(card)` = card came from `statement_imports` (source flag already present; see fusion-core `verifiedPoints` at `lib/fusion-core.ts:212`).

**Removed from headline:** `bestValue = totalPoints * 1.8` and `conservativeValue = totalPoints * 0.25` are assumption multipliers. If a ₹ figure is shown at all it is a **range labelled "estimate"**, never the hero number. Preference for v1: show **points**, not rupees, in the hero.

### 3.3 Editorial cards strip
- Source: `SEED_CARDS` (`lib/data/seed-cards.ts`) — canonical (per project rule; Supabase `cards` table is unreliable).
- Fields used: `id/slug` (link target), `name`, `bank`, `best_for` (the one-liner), `card_image_url` (progressive), `color` (guaranteed fallback).
- Selection: a **static, hand-picked id list** (like `card-roast`'s `CURATED`), not a computed ranking. Labelled "Cards to know" / editorial.
- Render rule: attempt `card_image_url`; on error or absence, render a `color` swatch card. No layout shift either way.

## 4. What is NOT wired (and why)
- **Engine (`lib/engine.ts`)** stays out of this surface. It needs a `UserSpendProfile`; no real per-user spend exists (audit §2). Do not drive any dashboard number from `DEFAULT_SPEND_MIX`.
- **`user_points` table** is ignored — schema-only, not operationalized. Wallet = `statement_imports` + `manual_cards`.
- **Optimisation rate** has no code path in v1.

## 5. Provenance → token mapping
| State | Token | Meaning |
|---|---|---|
| Verified (statement) | `--ciq-verified` (#4FBF87 dark) | read from a real statement |
| Estimated (manual) | `--ciq-estimated` (#8A857B) | user-typed, may be 0 |
| Cached (fares, if referenced) | `--prov-cached` | not central to dashboard v1 |

Reduced motion: the gauge/count-up animations must respect `prefers-reduced-motion` — already globally enforced for `[data-ciq]` in `globals.css` (`animation:none!important`).

## 6. Performance / SSR notes
- Client component; wallet fetched after auth. Show a skeleton, not a fake number, while loading (existing spinner is acceptable).
- Editorial strip is static import — no network, no CDN dependency for correctness (art is progressive only).

## 7. Security
- All per-user reads go through the existing bearer-token → service-role → `.eq('user_id', …)` pattern. No new endpoints, no new exposure. (Consistent with the app-level access-control model noted in the audit.)

## 8. Future hook (post-v1)
When categorized spend lands (statement MCC work, README Phase 4), an optimisation rate becomes computable via `matchCards` / `calculateAnnualValue` against a *real* `UserSpendProfile`. Reserve a slot in the layout but ship nothing until then.
