# Wallet — Backend Schema

**Principle:** v1 introduces **no new tables and no new columns.** Everything the wallet renders reads from tables that already exist and are populated. This doc catalogs exactly what is read, and explicitly marks what is deliberately *not* used.

## 0. On the design-system tokens (not a schema change)
The white/copper migration (UI/UX §1) is **CSS/token work, not database work.** It touches `app/globals.css` and component styles, adds **no** schema. The exact white/copper token names are finalized in that CSS pass; this doc governs data, not colour.

## 1. Tables READ by the wallet (all existing)

### 1.1 `statement_imports` — verified wallet (live in Supabase; not in migrations)
| Column | Type | Wallet use |
|---|---|---|
| `user_id` | uuid | scope (`.eq('user_id', …)`) |
| `bank` | text | row + gauge grouping |
| `card_name` | text | row title |
| `card_last4` | text | row subtitle `••1234` |
| `points_balance` | int | **feeds total (verified)** |
| `points_currency` | text | row unit label |
| `points_earned_this_month` | int? | not shown in v1 (reserved) |
| `confidence` | text | provenance weighting |
| `imported_at` | timestamptz | freshness / sort |
Provenance: **verified.** Read via `GET /api/user-cards`; tagged `source: 'statement'` client-side. Access: bearer token → `auth.getUser()` → service-role scoped by `user_id`.

### 1.2 `manual_cards` — estimated wallet (live in Supabase; not in migrations)
| Column | Type | Wallet use |
|---|---|---|
| `id` | uuid | key / delete target |
| `user_id` | uuid | scope |
| `bank`, `card_name`, `card_last4` | text | row |
| `points_balance` | int (default 0) | **feeds total (estimated)** |
| `points_currency` | text | unit |
| `imported_at` | timestamptz | sort |
Provenance: **estimated.** Read via `GET /api/manual-cards`; written via `POST` (dedup by bank+name+last4), `DELETE`. `card_last4` only — **no card number is ever collected or stored.**

### 1.3 `SEED_CARDS` — add-a-card picker only (static, not a table)
`lib/data/seed-cards.ts`, **canonical** (Supabase `cards` table is unreliable — dupes, null slugs, UUID ids — per project rule). On the wallet it backs **the Add-a-card searchable picker only** — bank + card name for selection. Read at build time; no query. *(Note: `SEED_CARDS` also feeds the editorial strip — but that strip has moved to Home and is not part of the wallet.)*

## 2. Derived, not stored
```
totalPoints  = Σ points_balance (both tables)
verifiedPts  = Σ points_balance where source = statement_imports
estimatedPts = totalPoints − verifiedPts
estLow       = round(totalPoints × 0.25)   // ESTIMATE — surfaced only via EstimateRange
estHigh      = round(totalPoints × 1.8)    // ESTIMATE — surfaced only via EstimateRange
```
No derived value is persisted. The tour seen-flag (`ciq_wallet_tour_v1`) lives in **localStorage**, not the database. v1 adds **no write path** beyond the already-existing manual-card add/delete and statement upload.

## 3. Tables deliberately NOT used (and why)
| Table | Why excluded from the wallet |
|---|---|
| `user_points` (`001_initial.sql`) | schema-only, **not operationalized**; live wallet is `statement_imports` + `manual_cards` |
| `applications` | could *in theory* seed a "trending" rank, but no honest volume → NOT COMPUTABLE (audit §4). And discovery isn't the wallet's job anyway. |
| `redemptions` | redemption history — not part of the holdings ledger |
| `cached_fares` | travel surface, not the wallet |
| `aa_consents` / `linked_cards` | AA/Finvu link — if present, points already surface via the wallet merge; no wallet-specific read added |
| `cards` (Supabase) | unreliable; `SEED_CARDS` is canonical |

## 4. Access-control model (unchanged)
Per-user reads: bearer token → verify `auth.getUser()` → service-role client scoped by `.eq('user_id', userId)`. This is the app's existing pattern; v1 adds no endpoints and no new surface area. Personal tables rely on app-level scoping + service role (architectural note carried from the audit) — unchanged by this work. **No card numbers stored** (last4 only) — a data-safety property, not just a UI choice.

## 5. Migrations required for v1
**None.** The wallet's changes are: subtract two components from the render, migrate CSS/tokens to white/copper, retheme + rewire the tour. None of these touch schema.
