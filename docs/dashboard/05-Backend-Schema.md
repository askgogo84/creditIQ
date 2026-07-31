# Dashboard — Backend Schema

**Principle:** v1 introduces **no new tables and no new columns.** Everything the dashboard renders reads from tables that already exist and are populated. This doc catalogs exactly what is read, and explicitly marks what is deliberately *not* used.

## 1. Tables READ by the dashboard (all existing)

### 1.1 `statement_imports` — verified wallet (live in Supabase; not in migrations)
| Column | Type | Dashboard use |
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
Provenance: **verified.** Read via `GET /api/user-cards`. RLS: `auth.uid() = user_id`.

### 1.2 `manual_cards` — estimated wallet (live in Supabase; not in migrations)
| Column | Type | Dashboard use |
|---|---|---|
| `id` | uuid | key / delete target |
| `user_id` | uuid | scope |
| `bank`, `card_name`, `card_last4` | text | row |
| `points_balance` | int (default 0) | **feeds total (estimated)** |
| `points_currency` | text | unit |
| `imported_at` | timestamptz | sort |
Provenance: **estimated.** Read via `GET /api/manual-cards`; written via `POST` (dedup by bank+name+last4), `DELETE`.

### 1.3 `SEED_CARDS` — editorial strip (static, not a table)
`lib/data/seed-cards.ts`, 57 cards, **canonical** (Supabase `cards` table is unreliable — dupes, null slugs, UUID ids — per project rule). Fields used: `id/slug`, `name`, `bank`, `best_for` (one-liner), `card_image_url` (progressive), `color` (fallback). Read at build time; no query.

## 2. Derived, not stored
```
totalPoints  = Σ points_balance (both tables)
verifiedPts  = Σ points_balance where source = statement_imports
estimatedPts = totalPoints − verifiedPts
```
No derived value is persisted. No write path added by v1.

## 3. Tables deliberately NOT used (and why)
| Table | Why excluded from v1 |
|---|---|
| `user_points` (`001_initial.sql`) | schema-only, **not operationalized**; live wallet is statement_imports + manual_cards |
| `applications` | could *in theory* seed a "trending" rank, but no honest volume → "trending" is NOT COMPUTABLE (audit §4). Not used. |
| `redemptions` | user redemption history — not part of the wallet-glance v1 |
| `cached_fares` | travel surface, not the dashboard hero |
| `aa_consents` / `linked_cards` | AA/Finvu link — if present, points already surface via the wallet; no dashboard-specific read added |
| `cards` (Supabase) | unreliable; `SEED_CARDS` is canonical |

## 4. Access-control model (unchanged)
Per-user reads: bearer token → verify `auth.getUser()` → service-role client scoped by `.eq('user_id', userId)`. This is the app's existing pattern; v1 adds no endpoints and no new surface area. (Architectural note carried from the audit: personal tables rely on app-level scoping + service role rather than Postgres RLS on every table — unchanged by this work.)

## 5. Migrations required for v1
**None.** If Q2 (self-hosting card art) is chosen later, that adds files under `public/`, not schema. If the post-v1 optimisation rate is built, it depends on a *future* categorized-spend store (out of scope here).
