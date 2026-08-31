# 05 — Backend Schema · Stay on Points

**v1 stores nothing new in Supabase.** All hotel data is typed static data in
the repo, gated at build time. This is deliberate: the two-catalogue problem was
caused by data living in two places with no single writer. Hotels start with one
source of truth in git.

---

## 1. Programme registry — `lib/data/hotel-programmes.ts`

```ts
export interface HotelProgramme {
  id: string;                    // 'accor-all' | 'marriott-bonvoy' | ...
  name: string;
  pricing_model: 'fixed' | 'dynamic';

  // fixed only — null for dynamic programmes
  points_per_block: number | null;      // 2000
  block_value: number | null;           // 40
  block_currency: 'EUR' | 'USD' | null; // 'EUR'

  source_url: string;
  as_of: string;                        // ISO date
  provenance: 'SOURCED' | 'ESTIMATED' | 'UNKNOWN';
  notes?: string;
}
```

v1 contents:

| id | model | rate | provenance |
|---|---|---|---|
| accor-all | fixed | 2000 pts = EUR 40 | SOURCED |
| marriott-bonvoy | dynamic | null | UNKNOWN |
| ihg-one | dynamic | null | UNKNOWN |
| hyatt-wop | dynamic | null | UNKNOWN |
| hilton-honors | dynamic | null | UNKNOWN |

A `dynamic` programme with null rates is **correct data**, not missing data. The
UI renders `NOT_PUBLISHED` from it.

## 2. Seeded rates — `lib/data/hotel-seed.ts`

```ts
export interface SeededHotel {
  id: string;                    // 'sofitel-bangkok-sukhumvit'
  name: string;
  programme_id: string;
  city: string;
  country: string;
  area: string;
  star_rating: number;
  room_type: string;

  cash_per_night_inr: number;
  cash_captured_at: string;      // ISO — REQUIRED, drives the freshness label
  cash_source: string;           // where it was captured from, shown to users

  points_per_night: number | null;   // null for dynamic programmes
  points_source: 'programme-published' | null;

  booking_url: string;           // direct programme URL, not an OTA
  photo_ref: string | null;      // null in v1 → placeholder
}
```

**Rules on this file:**
- No entry without `cash_captured_at`. A rate with no timestamp cannot be shown.
- `points_per_night` is null unless the programme's `pricing_model` is `fixed`.
- `booking_url` points at the programme's own site. Accor points require direct
  booking on all.accor.com — an OTA link would send the user somewhere the
  points cannot be used.

v1 target: 10–15 Bangkok hotels, mixed Accor and non-Accor so both verdict paths
render with real data.

## 3. FX — no storage

Fetched per request, never persisted, never defaulted.

```ts
export interface FxRate {
  pair: 'EUR/INR';
  rate: number;
  fetched_at: string;
  source: string;
}
```

If the fetch fails, the return is `null` and the UI suppresses the rupee
comparison. **There is no fallback constant anywhere in the tree.** A grep for a
hardcoded EUR/INR number should return zero results, and the build gate should
enforce that.

## 4. Reused, not rebuilt

| Existing | Used for |
|---|---|
| `lib/data/point-values.ts` | portal value per point, per card. Never a literal. |
| `lib/data/unverified-cards.ts` | `isFieldUnknown()` governs unknown hotel fields too |
| `user_profiles` | points balance for the coverage line — read only, no new column |
| `lib/types.ts` | add hotel types here, do not start a parallel types file |

## 5. Build gates

Extend `scripts/validate-point-values.ts` (already reads `point-values.ts` and
`seed-cards.ts` after e9a58cac) with a third pass:

1. Every `SeededHotel` has a non-empty `cash_captured_at`
2. Every hotel's `programme_id` resolves in the registry
3. `points_per_night` is null iff the programme is `dynamic`
4. No hardcoded EUR/INR constant exists in `lib/` or `app/`
5. Computed `value_per_point_inr` at a reference FX does not exceed the card's
   ceiling in `point-values.ts`

Gate 4 is the important one. It is the mechanical enforcement of the rule that
has the highest chance of being violated by a future well-meaning edit.

## 6. When Booking/CJ lands (v2)

Add `BookingRateProvider implements HotelRateProvider`. Swap the provider in
config. `hotel-seed.ts` becomes a fallback or is deleted. **No component
changes, no engine changes.** That is the whole point of the interface.

If rates later need caching, they go in a Supabase table with `captured_at` as a
required column and a TTL — not into the repo.
