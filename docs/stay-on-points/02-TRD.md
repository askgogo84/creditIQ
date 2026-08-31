# 02 — TRD · Stay on Points

**Stack:** Next.js 14 App Router, TypeScript, Supabase, Vercel
**Repo:** `C:\Users\gover\creditIQ\creditIQ`

---

## 1. Architecture in one line

A pure calculation module fed by three swappable providers (hotel rates, FX,
photos), rendered by a server component with a client island for search.

```
/stay-on-points (server)
  → lib/hotels/engine.ts        pure functions, no I/O, fully testable
  → lib/hotels/providers/
      rates.ts    interface + SeededRateProvider  (v1)
      fx.ts       interface + LiveFxProvider
      photos.ts   interface + PlaceholderPhotoProvider (v1)
  → lib/data/hotel-programmes.ts   published redemption rates + provenance
  → lib/data/hotel-seed.ts         the seeded Bangkok dataset
```

**Why providers:** the rate and photo sources are known-temporary. Everything
behind an interface means the v2 swap is a config change. This is the direct
lesson from the two-catalogue problem — do not hardcode a source into
components.

## 2. The calculation, precisely

For an Accor stay:

```
points_required   = programme.points_per_block × nights_blocks   (published)
redemption_value_eur = (points_required / 2000) × 40             (published)
redemption_value_inr = redemption_value_eur × fx.eur_inr         (LIVE)
value_per_point_inr  = redemption_value_inr / points_required

portal_value_inr  = points_required × card.portal_value_per_point (from point-values.ts)

verdict:
  transfer_advantage_pct = ((redemption_value_inr - portal_value_inr) / portal_value_inr) × 100
  if > +5%   → POINTS_WIN
  if -5..+5  → CLOSE_CALL
  if < -5%   → CASH_WINS
```

Coverage line:

```
covered_nights   = floor(user_balance / points_per_night)
shortfall_points = max(0, points_required - user_balance)
cash_topup_inr   = uncovered_nights × cash_rate_per_night
```

**Every input above must be one of:** published by the programme, fetched live,
or captured with a timestamp. There is no fourth category.

## 3. Provider interfaces

```ts
// lib/hotels/providers/rates.ts
export interface HotelRateProvider {
  readonly id: string;              // 'seeded' | 'booking-cj' | ...
  search(q: RateQuery): Promise<RateResult[]>;
}
export interface RateResult {
  hotel_id: string;
  cash_per_night_inr: number;
  currency_original: string;
  captured_at: string;              // ISO — drives the freshness label
  source_id: string;                // provenance, shown to the user
  is_live: boolean;                 // false for seeded → renders "estimate"
}
```

```ts
// lib/hotels/providers/fx.ts
export interface FxProvider {
  rate(from: 'EUR', to: 'INR'): Promise<{ rate: number; fetched_at: string }>;
}
```

FX has **no cached fallback constant**. If the fetch fails the page renders the
points cost with the rupee comparison suppressed and an honest message. It does
not fall back to a stored number — that is the silent-fallback class the
24 Aug audit catalogued.

```ts
// lib/hotels/providers/photos.ts
export interface PhotoProvider {
  readonly id: string;
  readonly attribution: string;     // rendered on the image
  photos(hotel_id: string): Promise<{ url: string; width: number }[]>;
}
```

v1 returns deterministic gradient placeholders. The attribution label ships from
day one so the layout never has to change when a real provider lands.

## 4. Data sources and their status

| Input | v1 source | Provenance | v2 |
|---|---|---|---|
| Accor points rate | `hotel-programmes.ts`, published 2000pts = EUR40 | SOURCED | unchanged |
| EUR/INR | live public FX API, per request | LIVE | unchanged |
| Cash rate | `hotel-seed.ts`, manual capture + timestamp | ESTIMATED | Booking/CJ feed |
| Portal value/pt | `lib/data/point-values.ts` | SOURCED (HDFC) / UNVERIFIED (Axis, Amex) | portal capture |
| Photos | gradient placeholder | n/a | licensed feed |
| Marriott/IHG/Hyatt award | none | UNKNOWN | possibly never |

## 5. Existing code this must respect

- **`lib/data/point-values.ts`** — the ceiling registry, extended to Axis/Amex
  in 465b364f. Portal values come from here, never from a literal.
- **`lib/data/unverified-cards.ts`** — `UNKNOWN_CARD_FIELDS` + `isFieldUnknown()`.
  The same pattern governs unknown hotel fields. Do not build a parallel system.
- **`scripts/validate-point-values.ts`** — extended in e9a58cac to read
  `seed-cards.ts`. Extend it again to gate `hotel-programmes.ts` so a hotel
  redemption value cannot breach a ceiling silently.
- **The `--` render pattern** from a87710ce / 022cf548 — unknown renders as
  `--` with no "est" suffix. Reuse the existing `Metric` / `EstimatedValue`
  components rather than writing new ones.

## 6. Performance and caching

- Page is a server component; hotel list is statically generatable per city
- FX is per-request, never build-time
- Seeded rates are static imports — no query
- Target: first paint under 1.5s on 4G at 375px

## 7. Testing

- `engine.ts` is pure — unit test the arithmetic exhaustively, including the
  FX boundary (110 → points win, 88 → cash wins). That boundary is the product.
- Provider mocks for the page tests
- A gate test: no hotel programme value may exceed its ceiling

## 8. Explicitly not doing

- No booking, no payment, no PNR, no user funds
- No scraping of hotel sites for rates
- No storing of a cash rate without a timestamp
- No FX constant anywhere in the tree
